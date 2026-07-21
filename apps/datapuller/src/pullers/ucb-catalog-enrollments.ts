import { parseTermName } from "@repo/common";
import {
  CatalogClassModel,
  ICatalogClassItem,
  ISectionItem,
  NewEnrollmentHistoryModel,
  SectionModel,
  UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
  UcbEnrollmentScrapeStatusModel,
  type UcbEnrollmentScrapeState,
} from "@repo/common/models";
import {
  ParsedUcbEnrollment,
  UcbCatalogEnrollmentError,
  buildUcbCatalogUrl,
  fetchUcbCatalogEnrollment,
  isBlankUcbEnrollment,
} from "@repo/shared";

import { updateCatalogEnrollment } from "../lib/catalog-denormalize";
import { isSectionEnrollmentBlankInDb } from "../lib/crosslisting-enrollment-fanout";
import { Config } from "../shared/config";
import { getActiveTerms } from "../shared/term-selectors";

const CONCURRENCY = 4;
const CATALOG_FLUSH_EVERY = 50;
const PROGRESS_WRITE_EVERY = 5;
const GRANULARITY_SECONDS = 60;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 500;
const USER_AGENT = "BerkeleytimeUcbEnrollmentPuller/1.0";
/** Skip classes scraped within this window so restarts don't re-query them. */
const RECENT_SCRAPE_TTL_MS = 45 * 60 * 1000;
/** Hard cap so one wedged class/fetch can't stall the whole pool forever. */
const CLASS_SCRAPE_TIMEOUT_MS = 120_000;
/** Don't walk unbounded combinedSections scrape candidates. */
const MAX_SCRAPE_CANDIDATES = 3;
const PERSIST_VERSION_RETRIES = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProgressUpdate = {
  state: UcbEnrollmentScrapeState;
  year?: number;
  semester?: string;
  total?: number;
  processed?: number;
  succeeded?: number;
  failed?: number;
  skipped?: number;
  currentLabel?: string | null;
  message?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
};

const writeScrapeProgress = async (update: ProgressUpdate) => {
  await UcbEnrollmentScrapeStatusModel.findOneAndUpdate(
    { key: UCB_ENROLLMENT_SCRAPE_STATUS_KEY },
    {
      $set: {
        key: UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
        ...update,
      },
    },
    { upsert: true }
  );
};

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

type CatalogEnrollmentPatch = {
  status?: string;
  enrolledCount?: number;
  maxEnroll?: number;
  waitlistedCount?: number;
  maxWaitlist?: number;
  activeReservedMaxCount?: number;
  enrollmentUpdatedAt?: Date;
};

const persistScrapedSectionEnrollment = async (
  year: number,
  semester: string,
  section: ISectionItem,
  scraped: ParsedUcbEnrollment,
  now: Date
): Promise<{ sectionId: string; patch: CatalogEnrollmentPatch }> => {
  const historyPoint = {
    startTime: now,
    endTime: now,
    granularitySeconds: GRANULARITY_SECONDS,
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

  let seatReservationTypes = scraped.seatReservationTypes;
  let lastError: unknown;

  for (let attempt = 0; attempt < PERSIST_VERSION_RETRIES; attempt++) {
    try {
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
          lastEntry.granularitySeconds === GRANULARITY_SECONDS
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

      seatReservationTypes = enrollmentDoc.seatReservationTypes ?? [];
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      const isVersionError =
        error instanceof Error &&
        (error.name === "VersionError" ||
          /No matching document found for id/.test(error.message));
      if (!isVersionError || attempt === PERSIST_VERSION_RETRIES - 1) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;

  const activeReservedMaxCount = computeActiveReservedMaxCount(
    historyPoint.seatReservationCount,
    seatReservationTypes
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

const findCombinedSiblingSections = async (
  section: ISectionItem
): Promise<ISectionItem[]> => {
  const combinedIds = (section.combinedSections ?? [])
    .map(String)
    .filter((id) => id !== String(section.sectionId));
  if (combinedIds.length === 0) return [];

  return (await SectionModel.find({
    year: section.year,
    semester: section.semester,
    sessionId: section.sessionId,
    sectionId: { $in: combinedIds },
  }).lean()) as ISectionItem[];
};

const matchAssociatedScrapedEnrollment = (
  section: ISectionItem,
  associatedBySectionId: Map<string, ParsedUcbEnrollment>,
  associatedByNumber: Map<string, ParsedUcbEnrollment>
): ParsedUcbEnrollment | undefined => {
  const byId = associatedBySectionId.get(section.sectionId);
  if (byId) return byId;

  const byNumber = associatedByNumber.get(section.number);
  if (byNumber) return byNumber;

  for (const combinedId of section.combinedSections ?? []) {
    const byCombined = associatedBySectionId.get(String(combinedId));
    if (byCombined) return byCombined;
  }

  return undefined;
};

const scrapeEnrollmentForSection = async (
  section: ISectionItem,
  log: Config["log"]
): Promise<Awaited<ReturnType<typeof fetchUcbCatalogEnrollment>> | null> => {
  if (!section.component) return null;
  const url = buildUcbCatalogUrl({
    year: section.year,
    semester: section.semester,
    subject: section.subject,
    courseNumber: section.courseNumber,
    number: section.number,
    component: section.component,
  });
  try {
    const scraped = await fetchWithRetry(url, log);
    if (isBlankUcbEnrollment(scraped.primary)) return null;
    return scraped;
  } catch {
    return null;
  }
};

const isSiblingCatalogBlank = async (
  section: ISectionItem,
  _log: Config["log"]
): Promise<boolean | null> => {
  // Use stored enrollment (data-source agnostic) instead of re-fetching
  // classes.berkeley.edu for every combinedSections sibling.
  try {
    return await isSectionEnrollmentBlankInDb(section);
  } catch {
    return null;
  }
};

/**
 * Persist enrollment to a section, and fan out only to combinedSections siblings
 * whose own classes.berkeley.edu page is blank (0/0). SIS may put separately
 * enrolled lectures (e.g. DATA C8 LEC 001 + 002) in the same combination — those
 * with real seat counts must not be overwritten.
 */
const persistScrapedSectionEnrollmentWithFanOut = async (
  year: number,
  semester: string,
  section: ISectionItem,
  scraped: ParsedUcbEnrollment,
  now: Date,
  log: Config["log"]
): Promise<Array<{ sectionId: string; patch: CatalogEnrollmentPatch }>> => {
  const siblings = await findCombinedSiblingSections(section);
  const targets: ISectionItem[] = [section];
  const seen = new Set<string>([section.sectionId]);

  for (const sibling of siblings) {
    if (seen.has(sibling.sectionId)) continue;
    seen.add(sibling.sectionId);

    const blank = await isSiblingCatalogBlank(sibling, log);
    if (blank !== true) continue;

    targets.push(sibling);
  }

  const results: Array<{ sectionId: string; patch: CatalogEnrollmentPatch }> =
    [];
  for (const target of targets) {
    results.push(
      await persistScrapedSectionEnrollment(
        year,
        semester,
        target,
        scraped,
        now
      )
    );
  }

  return results;
};

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  if (/HTTP (429|403|5\d\d)/.test(message)) return true;
  if (error instanceof UcbCatalogEnrollmentError) {
    return error.code === "INTERNAL_SERVER_ERROR";
  }
  return /timeout|network|ECONNRESET|ETIMEDOUT|fetch failed/i.test(message);
};

const fetchWithRetry = async (url: string, log: Config["log"]) => {
  let attempt = 0;
  while (true) {
    try {
      return await fetchUcbCatalogEnrollment(url, {
        userAgent: USER_AGENT,
      });
    } catch (error) {
      attempt += 1;
      if (!isRetryableError(error) || attempt > MAX_RETRIES) {
        throw error;
      }
      const delay = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      log.warn(
        `Retry ${attempt}/${MAX_RETRIES} for ${url} after ${delay}ms: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      await sleep(delay);
    }
  }
};

const flushCatalogPatches = async (
  log: Config["log"],
  backendUrl: string,
  year: number,
  semester: string,
  catalogPatches: Map<string, CatalogEnrollmentPatch>
) => {
  if (catalogPatches.size === 0) return;
  const batch = new Map(catalogPatches);
  catalogPatches.clear();
  await updateCatalogEnrollment(log, year, semester, batch);
  // Let the scrape continue while the frontend/backend caches are cleared.
  void invalidateBackendCaches(backendUrl, log);
};

const invalidateBackendCaches = async (
  backendUrl: string,
  log: Config["log"]
) => {
  const url = new URL("/api/cache/invalidate-catalog", backendUrl);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      log.warn(
        `Cache invalidate returned HTTP ${response.status} from ${url.href}`
      );
      return;
    }
    log.info(`Invalidated backend catalog caches via ${url.href}`);
  } catch (error) {
    log.warn(
      `Failed to invalidate backend caches: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
};

type CatalogClassTarget = Pick<
  ICatalogClassItem,
  | "year"
  | "semester"
  | "termId"
  | "sessionId"
  | "subject"
  | "courseNumber"
  | "number"
  | "primarySectionId"
  | "primaryComponent"
  | "berkeleytimeRatingCount"
  | "enrollmentUpdatedAt"
>;

const runPool = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) => {
  let nextIndex = 0;

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= items.length) return;
        await worker(items[index], index);
      }
    }
  );

  await Promise.all(runners);
};

const scrapeTerm = async (config: Config, year: number, semester: string) => {
  const log = config.log.getSubLogger({
    name: `UcbCatalogEnrollments:${year}${semester}`,
  });

  const allClasses = (await CatalogClassModel.find({ year, semester })
    .select({
      year: 1,
      semester: 1,
      termId: 1,
      sessionId: 1,
      subject: 1,
      courseNumber: 1,
      number: 1,
      primarySectionId: 1,
      primaryComponent: 1,
      berkeleytimeRatingCount: 1,
      enrollmentUpdatedAt: 1,
    })
    .sort({
      berkeleytimeRatingCount: -1,
      subject: 1,
      courseNumber: 1,
      number: 1,
    })
    .lean()) as CatalogClassTarget[];

  const recentCutoff = Date.now() - RECENT_SCRAPE_TTL_MS;
  const classes = allClasses.filter((catalogClass) => {
    if (!catalogClass.enrollmentUpdatedAt) return true;
    return new Date(catalogClass.enrollmentUpdatedAt).getTime() < recentCutoff;
  });
  const alreadyFresh = allClasses.length - classes.length;

  log.info(
    `Scraping ${classes.length.toLocaleString()} of ${allClasses.length.toLocaleString()} catalog classes ordered by berkeleytimeRatingCount` +
      (alreadyFresh > 0
        ? ` (skipping ${alreadyFresh.toLocaleString()} scraped within ${Math.round(RECENT_SCRAPE_TTL_MS / 60000)}m)`
        : "")
  );

  if (classes.length === 0) {
    await writeScrapeProgress({
      state: "completed",
      year,
      semester,
      total: allClasses.length,
      processed: allClasses.length,
      succeeded: alreadyFresh,
      failed: 0,
      skipped: 0,
      currentLabel: null,
      message: `All ${semester} ${year} classes already scraped recently`,
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    return;
  }

  await writeScrapeProgress({
    state: "running",
    year,
    semester,
    total: classes.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    currentLabel: null,
    message:
      alreadyFresh > 0
        ? `Resuming ${semester} ${year} (${alreadyFresh.toLocaleString()} already fresh)`
        : `Scraping ${semester} ${year}`,
    startedAt: new Date(),
    finishedAt: null,
  });

  const catalogPatches = new Map<string, CatalogEnrollmentPatch>();
  let patchMutex: Promise<void> = Promise.resolve();
  const withPatchLock = async <T>(fn: () => Promise<T>): Promise<T> => {
    const previous = patchMutex;
    let release!: () => void;
    patchMutex = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  };

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;
  let processedSinceFlush = 0;
  let processedSinceProgress = 0;

  const bumpProgress = async (
    currentLabel: string | null,
    kind: "success" | "fail" | "skip"
  ) => {
    await withPatchLock(async () => {
      if (kind === "success") succeeded += 1;
      if (kind === "fail") failed += 1;
      if (kind === "skip") skipped += 1;
      processed += 1;
      processedSinceProgress += 1;

      const shouldWrite =
        processedSinceProgress >= PROGRESS_WRITE_EVERY ||
        processed >= classes.length;

      if (!shouldWrite) return;

      processedSinceProgress = 0;
      await writeScrapeProgress({
        state: "running",
        year,
        semester,
        total: classes.length,
        processed,
        succeeded,
        failed,
        skipped,
        currentLabel,
        message: `Scraping ${semester} ${year}`,
      });
    });
  };

  await runPool(classes, CONCURRENCY, async (catalogClass, index) => {
    const label = `${catalogClass.subject} ${catalogClass.courseNumber} ${catalogClass.number}`;

    if (!catalogClass.primaryComponent || !catalogClass.primarySectionId) {
      await bumpProgress(label, "skip");
      return;
    }

    const primarySection = await SectionModel.findOne({
      year: catalogClass.year,
      semester: catalogClass.semester,
      sessionId: catalogClass.sessionId,
      subject: catalogClass.subject,
      courseNumber: catalogClass.courseNumber,
      number: catalogClass.number,
      primary: true,
    }).lean();

    if (!primarySection?.sectionId || !primarySection.component) {
      await bumpProgress(label, "skip");
      return;
    }

    const combinedSiblings = await findCombinedSiblingSections(
      primarySection as ISectionItem
    );
    const scrapeCandidates = [
      primarySection as ISectionItem,
      ...combinedSiblings,
    ].slice(0, MAX_SCRAPE_CANDIDATES);

    const scrapeAndPersist = async (signal: { aborted: boolean }) => {
      let scraped: Awaited<ReturnType<typeof fetchUcbCatalogEnrollment>> | null =
        null;

      for (const candidate of scrapeCandidates) {
        if (signal.aborted) return;
        scraped = await scrapeEnrollmentForSection(candidate, log);
        if (scraped) {
          if (candidate.sectionId !== primarySection.sectionId) {
            log.info(
              `Using cross-listed enrollment from ${candidate.subject} ${candidate.courseNumber} ${candidate.number} for ${label}`
            );
          }
          break;
        }
      }

      if (signal.aborted) return;

      if (!scraped) {
        await bumpProgress(label, "fail");
        log.warn(
          `Failed ${label}: no usable enrollment on this listing or combinedSections siblings`
        );
        return;
      }

      const now = new Date();
      const patches: Array<{
        sectionId: string;
        patch: CatalogEnrollmentPatch;
      }> = [];

      patches.push(
        ...(await persistScrapedSectionEnrollmentWithFanOut(
          catalogClass.year,
          catalogClass.semester,
          primarySection as ISectionItem,
          scraped.primary,
          now,
          log
        ))
      );

      if (signal.aborted) return;

      if (scraped.associatedSections.length > 0) {
        const associatedBySectionId = new Map(
          scraped.associatedSections.map((section) => [
            section.sectionId,
            section,
          ])
        );
        const associatedByNumber = new Map(
          scraped.associatedSections
            .filter((section) => section.sectionNumber)
            .map((section) => [section.sectionNumber!, section])
        );
        const scrapedSectionIds = scraped.associatedSections.map(
          (section) => section.sectionId
        );
        const scrapedSectionIdNums = scrapedSectionIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));

        const associatedSections = await SectionModel.find({
          year: catalogClass.year,
          semester: catalogClass.semester,
          sessionId: catalogClass.sessionId,
          subject: catalogClass.subject,
          courseNumber: catalogClass.courseNumber,
          primary: false,
          $or: [
            { sectionId: { $in: scrapedSectionIds } },
            { number: { $in: [...associatedByNumber.keys()] } },
            ...(scrapedSectionIdNums.length > 0
              ? [{ combinedSections: { $in: scrapedSectionIdNums } }]
              : []),
          ],
        }).lean();

        const seenAssociated = new Set<string>();
        for (const section of associatedSections) {
          if (signal.aborted) return;
          const match = matchAssociatedScrapedEnrollment(
            section as ISectionItem,
            associatedBySectionId,
            associatedByNumber
          );
          if (!match || seenAssociated.has(section.sectionId)) continue;
          seenAssociated.add(section.sectionId);

          const fanOutPatches = await persistScrapedSectionEnrollmentWithFanOut(
            catalogClass.year,
            catalogClass.semester,
            section as ISectionItem,
            match,
            now,
            log
          );
          for (const patch of fanOutPatches) {
            seenAssociated.add(patch.sectionId);
            patches.push(patch);
          }
        }
      }

      if (signal.aborted) return;

      await withPatchLock(async () => {
        for (const { sectionId, patch } of patches) {
          catalogPatches.set(sectionId, patch);
        }
        processedSinceFlush += 1;

        if (processedSinceFlush >= CATALOG_FLUSH_EVERY) {
          processedSinceFlush = 0;
          await flushCatalogPatches(
            log,
            config.BACKEND_URL,
            catalogClass.year,
            catalogClass.semester,
            catalogPatches
          );
        }
      });

      if (signal.aborted) return;

      await bumpProgress(label, "success");

      if ((index + 1) % 100 === 0 || index === classes.length - 1) {
        log.info(
          `Progress ${index + 1}/${classes.length} (ok=${succeeded}, fail=${failed}, skip=${skipped}) last=${label}`
        );
      }
    };

    const signal = { aborted: false };
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        scrapeAndPersist(signal),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            signal.aborted = true;
            reject(
              new Error(
                `Timed out after ${CLASS_SCRAPE_TIMEOUT_MS}ms scraping ${label}`
              )
            );
          }, CLASS_SCRAPE_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      signal.aborted = true;
      await bumpProgress(label, "fail");
      log.warn(
        `Failed ${label}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  });

  await withPatchLock(async () => {
    await flushCatalogPatches(
      log,
      config.BACKEND_URL,
      year,
      semester,
      catalogPatches
    );
  });

  await writeScrapeProgress({
    state: "running",
    year,
    semester,
    total: classes.length,
    processed,
    succeeded,
    failed,
    skipped,
    currentLabel: null,
    message: `Finished ${semester} ${year}`,
  });

  log.info(
    `Finished ${year} ${semester}: ok=${succeeded}, fail=${failed}, skip=${skipped}`
  );
};

const SEMESTER_ORDER: Record<string, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

export const syncUcbCatalogEnrollments = async (config: Config) => {
  const log = config.log.getSubLogger({ name: "UcbCatalogEnrollmentsPuller" });

  const terms = await getActiveTerms();

  const uniqueTerms = new Map<string, { year: number; semester: string }>();
  for (const term of terms) {
    const parsed = parseTermName(term.name);
    if (!parsed) continue;
    const key = `${parsed.year}:${parsed.semester}`;
    if (!uniqueTerms.has(key)) {
      uniqueTerms.set(key, parsed);
    }
  }

  // Only scrape the single current semester: the latest term (by year, then
  // Fall > Summer > Spring) that actually has catalog classes. This matches the
  // catalog's default term and skips empty future terms (e.g. Spring 2027).
  const termsWithCounts = await Promise.all(
    [...uniqueTerms.values()].map(async (term) => {
      const count = await CatalogClassModel.countDocuments({
        year: term.year,
        semester: term.semester,
      });
      return { ...term, count };
    })
  );

  const currentTerm = termsWithCounts
    .filter((term) => term.count > 0)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (
        (SEMESTER_ORDER[b.semester] ?? 0) - (SEMESTER_ORDER[a.semester] ?? 0)
      );
    })[0];

  if (!currentTerm) {
    log.warn("No active terms with catalog data found; nothing to scrape");
    await writeScrapeProgress({
      state: "idle",
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      currentLabel: null,
      message: "No active terms found",
      finishedAt: new Date(),
    });
    return;
  }

  log.info(
    `Starting UCB catalog enrollment scrape for ${currentTerm.semester} ${currentTerm.year}`
  );

  try {
    await scrapeTerm(config, currentTerm.year, currentTerm.semester);

    await invalidateBackendCaches(config.BACKEND_URL, log);

    const latest = await UcbEnrollmentScrapeStatusModel.findOne({
      key: UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
    }).lean();

    await writeScrapeProgress({
      state: "completed",
      year: latest?.year,
      semester: latest?.semester,
      total: latest?.total ?? 0,
      processed: latest?.processed ?? 0,
      succeeded: latest?.succeeded ?? 0,
      failed: latest?.failed ?? 0,
      skipped: latest?.skipped ?? 0,
      currentLabel: null,
      message: "Enrollment scrape complete",
      finishedAt: new Date(),
    });
  } catch (error) {
    await writeScrapeProgress({
      state: "failed",
      message:
        error instanceof Error ? error.message : "Enrollment scrape failed",
      finishedAt: new Date(),
    });
    throw error;
  }
};

export default {
  syncUcbCatalogEnrollments,
};
