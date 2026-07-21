import { ITermItem, TermModel } from "@repo/common/models";

export type TermSelector = () => Promise<ITermItem[]>;

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
