import { parseTermName } from "@repo/common";
import { CatalogClassModel, ITermItem, TermModel } from "@repo/common/models";

export type TermSelector = () => Promise<ITermItem[]>;

const SEMESTER_ORDER: Record<string, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

/** Latest active term that has denormalized catalog_classes rows. */
export const getCurrentCatalogTerm = async (): Promise<{
  year: number;
  semester: string;
} | null> => {
  const terms = await getActiveTerms();
  const uniqueTerms = new Map<string, { year: number; semester: string }>();
  for (const term of terms) {
    const parsed = parseTermName(term.name);
    if (!parsed) continue;
    const key = `${parsed.year}:${parsed.semester}`;
    if (!uniqueTerms.has(key)) uniqueTerms.set(key, parsed);
  }

  const termsWithCounts = await Promise.all(
    [...uniqueTerms.values()].map(async (term) => {
      const count = await CatalogClassModel.countDocuments({
        year: term.year,
        semester: term.semester,
      });
      return { ...term, count };
    })
  );

  return (
    termsWithCounts
      .filter((term) => term.count > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          (SEMESTER_ORDER[b.semester] ?? 0) - (SEMESTER_ORDER[a.semester] ?? 0)
        );
      })[0] ?? null
  );
};

/**
 * Gets the 8 latest past terms. 8 is an overestimation of the 4 unique terms (UGRD, GRAD, LAW, UCBX) in a single semester.
 */
export const getRecentPastTerms = async () => {
  const pastTerms = await TermModel.find({ temporalPosition: "Past" })
    .lean()
    .sort({ endDate: -1 })
    .limit(8);

  return pastTerms;
};

export const getActiveTerms = async () => {
  return TermModel.find({
    temporalPosition: { $in: ["Current", "Future"] },
    // Skip manually-seeded draft terms (e.g. a department schedule imported
    // before SIS opens). SIS has no data for them yet, so pulling would delete
    // the seeded draft classes/sections. When SIS opens, clear the term's
    // isDraft flag to hand the term back to the datapuller.
    isDraft: { $ne: true },
  }).lean();
};

/**
 * Gets all terms with academic year greater than five years ago, including the current and future terms.
 */
export const getLastFiveYearsTerms = async () => {
  const since = new Date().getFullYear() - 5;

  return TermModel.find({ academicYear: { $gte: since.toString() } }).lean();
};
