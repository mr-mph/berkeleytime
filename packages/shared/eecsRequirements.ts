/**
 * EECS catalog requirement definitions.
 *
 * Update these lists when EECS Humanities/Social Sciences breadths or
 * Ethics course eligibility changes.
 */

/** L&S breadths that satisfy EECS Humanities/Social Sciences. */
export const EECS_HUMANITIES_SOCIAL_SCIENCES_BREADTHS = [
  "Arts & Literature",
  "Historical Studies",
  "International Studies",
  "Philosophy & Values",
  "Social & Behavioral Sciences",
] as const;

export type EecsHumanitiesSocialSciencesBreadth =
  (typeof EECS_HUMANITIES_SOCIAL_SCIENCES_BREADTHS)[number];

export interface EecsCourseIdentifier {
  subject: string;
  courseNumber: string;
}

/**
 * Courses that satisfy the EECS Ethics requirement.
 * Subjects use SIS codes (e.g. COMPSCI, not CS; BIOENG, not BIO).
 */
export const EECS_ETHICS_COURSES: readonly EecsCourseIdentifier[] = [
  { subject: "BIOENG", courseNumber: "100" },
  { subject: "ENERES", courseNumber: "C100" },
  { subject: "ENERES", courseNumber: "W100" },
  { subject: "ENGIN", courseNumber: "125" },
  { subject: "ENGIN", courseNumber: "157AC" },
  { subject: "ENGIN", courseNumber: "185" },
  { subject: "COMPSCI", courseNumber: "195" },
  { subject: "COMPSCI", courseNumber: "H195" },
  { subject: "DATA", courseNumber: "C104" },
  { subject: "STS", courseNumber: "C104D" },
  { subject: "HISTORY", courseNumber: "C184D" },
  { subject: "IAS", courseNumber: "157AC" },
  { subject: "ISF", courseNumber: "100D" },
  // Explicitly 100G only — ISF C100G does not count.
  { subject: "ISF", courseNumber: "100G" },
  { subject: "MEDIAST", courseNumber: "104D" },
  { subject: "NWMEDIA", courseNumber: "151AC" },
  { subject: "PHILOS", courseNumber: "121" },
  { subject: "UGBA", courseNumber: "107" },
  { subject: "PUBPOL", courseNumber: "C184" },
  { subject: "PUBPOL", courseNumber: "W184" },
];

export const EECS_REQUIREMENT_VALUES = {
  HUMANITIES_SOCIAL_SCIENCES: "humanities-social-sciences",
  ETHICS: "ethics",
} as const;

export type EecsRequirementValue =
  (typeof EECS_REQUIREMENT_VALUES)[keyof typeof EECS_REQUIREMENT_VALUES];

export const EECS_REQUIREMENT_OPTIONS: ReadonlyArray<{
  value: EecsRequirementValue;
  label: string;
}> = [
  {
    value: EECS_REQUIREMENT_VALUES.HUMANITIES_SOCIAL_SCIENCES,
    label: "Humanities/Social Sciences",
  },
  {
    value: EECS_REQUIREMENT_VALUES.ETHICS,
    label: "Ethics",
  },
];

const HUMANITIES_BREADTH_SET = new Set<string>(
  EECS_HUMANITIES_SOCIAL_SCIENCES_BREADTHS
);

export function getEecsHumanitiesBreadthsMet(
  breadths: readonly string[] | null | undefined
): string[] {
  if (!breadths?.length) return [];
  return breadths.filter((breadth) => HUMANITIES_BREADTH_SET.has(breadth));
}

export function meetsEecsHumanitiesSocialSciences(
  breadths: readonly string[] | null | undefined
): boolean {
  return getEecsHumanitiesBreadthsMet(breadths).length > 0;
}

export function meetsEecsEthics(
  subject: string,
  courseNumber: string
): boolean {
  const normalizedSubject = subject.trim().toUpperCase();
  const normalizedNumber = courseNumber.trim().toUpperCase();
  return EECS_ETHICS_COURSES.some(
    (course) =>
      course.subject === normalizedSubject &&
      course.courseNumber.toUpperCase() === normalizedNumber
  );
}

export function isEecsRequirementValue(
  value: string | null | undefined
): value is EecsRequirementValue {
  return (
    value === EECS_REQUIREMENT_VALUES.HUMANITIES_SOCIAL_SCIENCES ||
    value === EECS_REQUIREMENT_VALUES.ETHICS
  );
}
