/** Neutral score used for RMP ranking when an instructor has no rating. */
export const RMP_MISSING_RATING_FOR_SORT = 3;

export function normalizeInstructorName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function instructorLookupKey(
  givenName: string,
  familyName: string
): string {
  return `${normalizeInstructorName(familyName)}|${normalizeInstructorName(givenName)}`;
}

/** Public Rate My Professor profile URL for a matched instructor. */
export function buildRmpProfessorUrl(legacyId: number): string {
  return `https://www.ratemyprofessors.com/professor/${legacyId}`;
}
