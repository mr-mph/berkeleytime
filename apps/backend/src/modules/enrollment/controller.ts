import { GraphQLError } from "graphql";
import type { RedisClientType } from "redis";

import {
  CatalogClassModel,
  ISectionItem,
  NewEnrollmentHistoryModel,
  SectionModel,
} from "@repo/common/models";

import { Semester } from "../../generated-types/graphql";
import { invalidateApolloResponseCache } from "../../utils/cache";
import { buildSubjectQuery } from "../../utils/subject";
import { invalidateCatalogCache } from "../catalog/catalog-cache";
import { formatEnrollment } from "./formatter";
import {
  ParsedUcbEnrollment,
  buildUcbCatalogUrl,
  fetchUcbCatalogEnrollment,
} from "./ucbCatalogEnrollment";

const MANUAL_REFRESH_GRANULARITY_SECONDS = 60;

const computeActiveReservedMaxCount = (
  seatReservationCount:
    | Array<{ number?: number; maxEnroll?: number }>
    | undefined,
  seatReservationTypes: Array<{ number?: number; fromDate?: string }> | undefined
): number => {
  const counts = seatReservationCount ?? [];
  if (counts.length === 0) return 0;

  const types = seatReservationTypes ?? [];
  const now = new Date();

  return counts.reduce((sum, reservation) => {
    const maxEnroll = reservation.maxEnroll ?? 0;
    const matchingType = types.find(
      (type) => type.number === reservation.number
    );
    const fromDate = matchingType?.fromDate ?? "";
    const fromDateObj = fromDate ? new Date(fromDate) : null;
    const hasValidFromDate =
      fromDateObj !== null && !Number.isNaN(fromDateObj.getTime());

    const isActive =
      maxEnroll > 1 &&
      (!hasValidFromDate || (fromDateObj && fromDateObj <= now));

    return sum + (isActive ? maxEnroll : 0);
  }, 0);
};

const enrollmentCountsEqual = (
  a: {
    status?: string;
    enrolledCount?: number;
    reservedCount?: number;
    waitlistedCount?: number;
    maxEnroll?: number;
    maxWaitlist?: number;
    openReserved?: number;
  },
  b: {
    status?: string;
    enrolledCount?: number;
    reservedCount?: number;
    waitlistedCount?: number;
    maxEnroll?: number;
    maxWaitlist?: number;
    openReserved?: number;
  }
) =>
  a.status === b.status &&
  a.enrolledCount === b.enrolledCount &&
  a.reservedCount === b.reservedCount &&
  a.waitlistedCount === b.waitlistedCount &&
  a.maxEnroll === b.maxEnroll &&
  a.maxWaitlist === b.maxWaitlist &&
  a.openReserved === b.openReserved;

const persistScrapedSectionEnrollment = async (
  year: number,
  semester: Semester,
  section: ISectionItem,
  scraped: ParsedUcbEnrollment,
  now: Date
) => {
  const historyPoint = {
    startTime: now,
    endTime: now,
    granularitySeconds: MANUAL_REFRESH_GRANULARITY_SECONDS,
    status: scraped.status,
    enrolledCount: scraped.enrolledCount,
    reservedCount: scraped.reservedCount,
    waitlistedCount: scraped.waitlistedCount,
    minEnroll: scraped.minEnroll,
    maxEnroll: scraped.maxEnroll,
    maxWaitlist: scraped.maxWaitlist,
    openReserved: scraped.openReserved,
    instructorAddConsentRequired: scraped.instructorAddConsentRequired,
    instructorDropConsentRequired: scraped.instructorDropConsentRequired,
    seatReservationCount: scraped.seatReservationCount,
  };

  let enrollmentDoc = await NewEnrollmentHistoryModel.findOne({
    year,
    semester,
    sessionId: section.sessionId,
    subject: section.subject,
    courseNumber: section.courseNumber,
    sectionNumber: section.number,
  });

  if (!enrollmentDoc) {
    enrollmentDoc = await NewEnrollmentHistoryModel.findOne({
      termId: section.termId,
      sessionId: section.sessionId,
      sectionId: section.sectionId,
    });
  }

  if (!enrollmentDoc) {
    enrollmentDoc = await NewEnrollmentHistoryModel.create({
      termId: section.termId,
      year,
      semester,
      sessionId: section.sessionId,
      sectionId: section.sectionId,
      subject: section.subject,
      courseNumber: section.courseNumber,
      sectionNumber: section.number,
      history: [historyPoint],
      seatReservationTypes: scraped.seatReservationTypes,
    });
  } else {
    const history = enrollmentDoc.history ?? [];
    const lastEntry = history[history.length - 1];

    if (
      lastEntry &&
      enrollmentCountsEqual(lastEntry, historyPoint) &&
      lastEntry.granularitySeconds === MANUAL_REFRESH_GRANULARITY_SECONDS
    ) {
      lastEntry.endTime = now;
      enrollmentDoc.markModified("history");
    } else {
      enrollmentDoc.history = [...history, historyPoint];
    }

    if (scraped.seatReservationTypes.length > 0) {
      enrollmentDoc.seatReservationTypes = scraped.seatReservationTypes;
    }

    await enrollmentDoc.save();
  }

  const activeReservedMaxCount = computeActiveReservedMaxCount(
    historyPoint.seatReservationCount,
    enrollmentDoc.seatReservationTypes
  );
  const openSeats = Math.max(
    0,
    (historyPoint.maxEnroll ?? 0) - (historyPoint.enrolledCount ?? 0)
  );

  if (section.primary) {
    await CatalogClassModel.updateMany(
      {
        year,
        semester,
        primarySectionId: section.sectionId,
      },
      {
        $set: {
          enrollmentStatus: historyPoint.status,
          enrolledCount: historyPoint.enrolledCount,
          maxEnroll: historyPoint.maxEnroll,
          waitlistedCount: historyPoint.waitlistedCount,
          maxWaitlist: historyPoint.maxWaitlist,
          activeReservedMaxCount,
          openSeats,
          enrollmentUpdatedAt: now,
        },
      }
    );
  }

  await CatalogClassModel.updateMany(
    {
      year,
      semester,
      "sections.sectionId": section.sectionId,
    },
    {
      $set: {
        "sections.$.enrollmentStatus": historyPoint.status,
        "sections.$.enrolledCount": historyPoint.enrolledCount,
        "sections.$.maxEnroll": historyPoint.maxEnroll,
        "sections.$.waitlistedCount": historyPoint.waitlistedCount,
        "sections.$.maxWaitlist": historyPoint.maxWaitlist,
      },
    }
  );

  return enrollmentDoc;
};

export const getEnrollment = async (
  year: number,
  semester: Semester,
  sessionId: string | null,
  subject: string,
  courseNumber: string,
  sectionNumber: string
) => {
  const subjectQuery = buildSubjectQuery(subject);

  const enrollment = await NewEnrollmentHistoryModel.findOne({
    year,
    semester,
    sessionId: sessionId ? sessionId : "1",
    subject: subjectQuery,
    courseNumber,
    sectionNumber,
  }).lean();

  if (!enrollment) return null;

  return formatEnrollment(enrollment);
};

export const getEnrollmentBySectionId = async (
  termId: string,
  sessionId: string,
  sectionId: string
) => {
  const enrollment = await NewEnrollmentHistoryModel.findOne({
    termId,
    sessionId,
    sectionId,
  }).lean();

  if (!enrollment) return null;

  return formatEnrollment(enrollment);
};

export const refreshClassEnrollment = async (
  year: number,
  semester: Semester,
  sessionId: string | null,
  subject: string,
  courseNumber: string,
  number: string,
  redis: RedisClientType
) => {
  const resolvedSessionId = sessionId || "1";

  const primarySection = await SectionModel.findOne({
    year,
    semester,
    sessionId: resolvedSessionId,
    subject: buildSubjectQuery(subject),
    courseNumber,
    number,
    primary: true,
  }).lean();

  if (!primarySection?.sectionId || !primarySection.component) {
    throw new GraphQLError("Class primary section not found", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const url = buildUcbCatalogUrl({
    year,
    semester,
    subject: primarySection.subject,
    courseNumber: primarySection.courseNumber,
    number: primarySection.number,
    component: primarySection.component,
  });

  const scrapedCatalog = await fetchUcbCatalogEnrollment(url);
  const now = new Date();

  const enrollmentDoc = await persistScrapedSectionEnrollment(
    year,
    semester,
    primarySection as ISectionItem,
    scrapedCatalog.primary,
    now
  );

  const associatedBySectionId = new Map(
    scrapedCatalog.associatedSections.map((section) => [
      section.sectionId,
      section,
    ])
  );
  const associatedByNumber = new Map(
    scrapedCatalog.associatedSections
      .filter((section) => section.sectionNumber)
      .map((section) => [section.sectionNumber!, section])
  );

  const associatedSections = await SectionModel.find({
      year,
      semester,
      sessionId: resolvedSessionId,
      subject: buildSubjectQuery(subject),
      courseNumber,
      primary: false,
      $or: [
        { sectionId: { $in: [...associatedBySectionId.keys()] } },
        { number: { $in: [...associatedByNumber.keys()] } },
      ],
    }).lean();

  await Promise.all(
    associatedSections.map((section) => {
      const scraped =
        associatedBySectionId.get(section.sectionId) ??
        associatedByNumber.get(section.number);
      if (!scraped) return Promise.resolve();
      return persistScrapedSectionEnrollment(
        year,
        semester,
        section as ISectionItem,
        scraped,
        now
      );
    })
  );

  invalidateCatalogCache(year, semester);
  // Catalog/class enrollment responses live in Apollo's Redis response cache
  // (Enrollment maxAge=60, catalogSearch maxAge=300). Clear them so the next
  // client refetch sees the scrape instead of a stale cached payload.
  await invalidateApolloResponseCache(redis);

  const refreshed = await NewEnrollmentHistoryModel.findById(
    enrollmentDoc._id
  ).lean();

  if (!refreshed) {
    throw new GraphQLError("Failed to load refreshed enrollment", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }

  return formatEnrollment(refreshed);
};
