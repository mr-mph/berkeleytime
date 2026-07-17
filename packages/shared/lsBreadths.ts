/**
 * L&S breadth vs university requirement classification.
 *
 * SIS sometimes puts university / college designations (e.g. American Cultures,
 * Reading and Composition) on section attributes with attribute code "GE".
 * Use these helpers so those are not treated as L&S seven-course breadths.
 */

/** Canonical L&S seven-course breadth labels used in catalog data. */
export const LS_BREADTH_REQUIREMENTS = [
  "Arts & Literature",
  "Biological Science",
  "Biological Sciences",
  "Historical Studies",
  "International Studies",
  "Philosophy & Values",
  "Physical Science",
  "Social & Behavioral Science",
  "Social & Behavioral Sciences",
] as const;

/** University / college requirement labels that may also appear on GE attributes. */
export const UNIVERSITY_REQUIREMENT_LABELS = [
  "American Cultures",
  "American History",
  "American Institutions",
  "American History and Institutions",
  "Entry-Level Writing",
  "Quantitative Reasoning",
  "Foreign Language",
  "Reading and Composition A",
  "Reading and Composition B",
] as const;

const LS_BREADTH_SET = new Set<string>(LS_BREADTH_REQUIREMENTS);
const UNIVERSITY_REQUIREMENT_SET = new Set<string>(
  UNIVERSITY_REQUIREMENT_LABELS
);

export function isLsBreadthRequirement(
  value: string | null | undefined
): boolean {
  if (!value) return false;
  return LS_BREADTH_SET.has(value.trim());
}

export function isUniversityRequirementLabel(
  value: string | null | undefined
): boolean {
  if (!value) return false;
  return UNIVERSITY_REQUIREMENT_SET.has(value.trim());
}

export function filterLsBreadthRequirements(
  values: readonly string[] | null | undefined
): string[] {
  if (!values?.length) return [];
  return values.filter(isLsBreadthRequirement);
}

export function filterUniversityRequirementLabels(
  values: readonly string[] | null | undefined
): string[] {
  if (!values?.length) return [];
  return values.filter(isUniversityRequirementLabel);
}
