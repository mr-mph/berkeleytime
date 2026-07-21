import {
  IEnrollmentHistoryItem,
  ISectionItem,
  NewEnrollmentHistoryModel,
  SectionModel,
} from "@repo/common/models";
import { isBlankUcbEnrollment } from "@repo/shared";

import { updateCatalogEnrollment } from "./catalog-denormalize";
import { computeActiveReservedMaxCount } from "./enrollment-utils";

type Logger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

type LatestEnrollment = {
  doc: IEnrollmentHistoryItem;
  point: IEnrollmentHistoryItem["history"][number];
};

const GRANULARITY_SECONDS = 60;

const enrollmentCountsEqual = (
  a: Pick<
    IEnrollmentHistoryItem["history"][number],
    | "enrolledCount"
    | "reservedCount"
    | "waitlistedCount"
    | "maxEnroll"
    | "maxWaitlist"
    | "openReserved"
  >,
  b: typeof a
) =>
  a.enrolledCount === b.enrolledCount &&
  a.reservedCount === b.reservedCount &&
  a.waitlistedCount === b.waitlistedCount &&
  a.maxEnroll === b.maxEnroll &&
  a.maxWaitlist === b.maxWaitlist &&
  a.openReserved === b.openReserved;

/** Latest history point is blank/missing (0/0 or no enrollment row). */
export const isEnrollmentHistoryBlank = (
  enrollment: IEnrollmentHistoryItem | null | undefined
): boolean => {
  if (!enrollment?.history?.length) return true;
  const latest = enrollment.history[enrollment.history.length - 1];
  return isBlankUcbEnrollment(latest);
};

export const getLatestEnrollmentPoint = (
  enrollment: IEnrollmentHistoryItem | null | undefined
): IEnrollmentHistoryItem["history"][number] | null => {
  if (!enrollment?.history?.length) return null;
  return enrollment.history[enrollment.history.length - 1] ?? null;
};

/**
 * True when this section's stored enrollment is blank (0/0) or missing.
 * Used instead of fetching classes.berkeley.edu for crosslisting fan-out.
 */
export const isSectionEnrollmentBlankInDb = async (
  section: Pick<
    ISectionItem,
    | "year"
    | "semester"
    | "sessionId"
    | "sectionId"
    | "subject"
    | "courseNumber"
    | "number"
  >
): Promise<boolean> => {
  let enrollment = await NewEnrollmentHistoryModel.findOne({
    year: section.year,
    semester: section.semester,
    sessionId: section.sessionId,
    subject: section.subject,
    courseNumber: section.courseNumber,
    sectionNumber: section.number,
  }).lean();

  if (!enrollment) {
    enrollment = await NewEnrollmentHistoryModel.findOne({
      termId: (section as ISectionItem).termId,
      sessionId: section.sessionId,
      sectionId: section.sectionId,
    }).lean();
  }

  return isEnrollmentHistoryBlank(enrollment as IEnrollmentHistoryItem | null);
};

const findUnion = (parent: Map<string, string>, id: string): string => {
  const current = parent.get(id) ?? id;
  if (current === id) return id;
  const root = findUnion(parent, current);
  parent.set(id, root);
  return root;
};

const union = (parent: Map<string, string>, a: string, b: string) => {
  const rootA = findUnion(parent, a);
  const rootB = findUnion(parent, b);
  if (rootA !== rootB) parent.set(rootA, rootB);
};

const pickDonor = (candidates: LatestEnrollment[]): LatestEnrollment => {
  return candidates.reduce((best, current) => {
    const bestMax = best.point.maxEnroll ?? 0;
    const currentMax = current.point.maxEnroll ?? 0;
    if (currentMax !== bestMax) {
      return currentMax > bestMax ? current : best;
    }
    const bestEnrolled = best.point.enrolledCount ?? 0;
    const currentEnrolled = current.point.enrolledCount ?? 0;
    if (currentEnrolled !== bestEnrolled) {
      return currentEnrolled > bestEnrolled ? current : best;
    }
    const bestEnd = new Date(best.point.endTime).getTime();
    const currentEnd = new Date(current.point.endTime).getTime();
    return currentEnd > bestEnd ? current : best;
  });
};

const applyDonorToSection = async (
  year: number,
  semester: string,
  section: ISectionItem,
  donor: LatestEnrollment,
  now: Date
): Promise<{
  sectionId: string;
  patch: {
    status?: string;
    enrolledCount?: number;
    maxEnroll?: number;
    waitlistedCount?: number;
    maxWaitlist?: number;
    activeReservedMaxCount?: number;
    enrollmentUpdatedAt?: Date;
  };
}> => {
  const historyPoint = {
    startTime: now,
    endTime: now,
    granularitySeconds: GRANULARITY_SECONDS,
    status: donor.point.status,
    enrolledCount: donor.point.enrolledCount,
    reservedCount: donor.point.reservedCount,
    waitlistedCount: donor.point.waitlistedCount,
    minEnroll: donor.point.minEnroll,
    maxEnroll: donor.point.maxEnroll,
    maxWaitlist: donor.point.maxWaitlist,
    openReserved: donor.point.openReserved,
    instructorAddConsentRequired: donor.point.instructorAddConsentRequired,
    instructorDropConsentRequired: donor.point.instructorDropConsentRequired,
    seatReservationCount: donor.point.seatReservationCount,
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
      seatReservationTypes: donor.doc.seatReservationTypes ?? [],
    });
  } else {
    const history = enrollmentDoc.history ?? [];
    const lastEntry = history[history.length - 1];
    if (
      lastEntry &&
      enrollmentCountsEqual(lastEntry, historyPoint) &&
      lastEntry.granularitySeconds === GRANULARITY_SECONDS
    ) {
      lastEntry.endTime = now;
      enrollmentDoc.markModified("history");
    } else {
      enrollmentDoc.history = [...history, historyPoint];
    }
    if ((donor.doc.seatReservationTypes?.length ?? 0) > 0) {
      enrollmentDoc.seatReservationTypes = donor.doc.seatReservationTypes;
    }
    await enrollmentDoc.save();
  }

  const activeReservedMaxCount = computeActiveReservedMaxCount(
    historyPoint.seatReservationCount,
    enrollmentDoc.seatReservationTypes
  );

  return {
    sectionId: section.sectionId,
    patch: {
      status: historyPoint.status,
      enrolledCount: historyPoint.enrolledCount,
      maxEnroll: historyPoint.maxEnroll,
      waitlistedCount: historyPoint.waitlistedCount,
      maxWaitlist: historyPoint.maxWaitlist,
      activeReservedMaxCount: section.primary
        ? activeReservedMaxCount
        : undefined,
      enrollmentUpdatedAt: now,
    },
  };
};

/**
 * Copy real enrollment onto combinedSections siblings that only have 0/0 (or
 * missing) data. Works from DB state — independent of scrape / backup / SIS.
 */
export const fanOutCrosslistingEnrollmentForTerm = async (
  log: Logger,
  year: number,
  semester: string
): Promise<{ groups: number; updatedSections: number }> => {
  const sections = (await SectionModel.find({
    year,
    semester,
    combinedSections: { $exists: true, $ne: [] },
  }).lean()) as ISectionItem[];

  if (sections.length === 0) {
    log.info(`No crosslisted sections for ${semester} ${year}`);
    return { groups: 0, updatedSections: 0 };
  }

  const parent = new Map<string, string>();
  const sectionById = new Map<string, ISectionItem>();

  for (const section of sections) {
    sectionById.set(section.sectionId, section);
    parent.set(section.sectionId, section.sectionId);
    for (const combinedId of section.combinedSections ?? []) {
      const id = String(combinedId);
      if (!parent.has(id)) parent.set(id, id);
      union(parent, section.sectionId, id);
    }
  }

  // Load any sibling sections referenced only by id
  const missingIds = [...parent.keys()].filter((id) => !sectionById.has(id));
  if (missingIds.length > 0) {
    const extras = (await SectionModel.find({
      year,
      semester,
      sectionId: { $in: missingIds },
    }).lean()) as ISectionItem[];
    for (const section of extras) {
      sectionById.set(section.sectionId, section);
    }
  }

  const groups = new Map<string, string[]>();
  for (const id of parent.keys()) {
    if (!sectionById.has(id)) continue;
    const root = findUnion(parent, id);
    const list = groups.get(root) ?? [];
    list.push(id);
    groups.set(root, list);
  }

  const allSectionIds = [...sectionById.keys()];
  const enrollments = (await NewEnrollmentHistoryModel.find({
    year,
    semester,
    sectionId: { $in: allSectionIds },
  }).lean()) as IEnrollmentHistoryItem[];

  const enrollmentBySectionId = new Map<string, IEnrollmentHistoryItem>();
  for (const enrollment of enrollments) {
    enrollmentBySectionId.set(enrollment.sectionId, enrollment);
  }

  const now = new Date();
  const catalogPatches = new Map<
    string,
    {
      status?: string;
      enrolledCount?: number;
      maxEnroll?: number;
      waitlistedCount?: number;
      maxWaitlist?: number;
      activeReservedMaxCount?: number;
      enrollmentUpdatedAt?: Date;
    }
  >();
  let updatedSections = 0;
  let groupsUpdated = 0;

  for (const memberIds of groups.values()) {
    if (memberIds.length < 2) continue;

    const donors: LatestEnrollment[] = [];
    const receivers: ISectionItem[] = [];

    for (const id of memberIds) {
      const section = sectionById.get(id);
      if (!section) continue;
      const enrollment = enrollmentBySectionId.get(id);
      const point = getLatestEnrollmentPoint(enrollment);
      if (enrollment && point && !isBlankUcbEnrollment(point)) {
        donors.push({ doc: enrollment, point });
      } else {
        receivers.push(section);
      }
    }

    if (donors.length === 0 || receivers.length === 0) continue;

    const donor = pickDonor(donors);
    groupsUpdated += 1;

    for (const receiver of receivers) {
      const { sectionId, patch } = await applyDonorToSection(
        year,
        semester,
        receiver,
        donor,
        now
      );
      catalogPatches.set(sectionId, patch);
      updatedSections += 1;
    }
  }

  if (catalogPatches.size > 0) {
    await updateCatalogEnrollment(log, year, semester, catalogPatches);
  }

  log.info(
    `Crosslisting fan-out ${semester} ${year}: updated ${updatedSections} blank section(s) across ${groupsUpdated} group(s)`
  );

  return { groups: groupsUpdated, updatedSections };
};
