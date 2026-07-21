export type StudentLevel = "UNDERGRAD" | "MASTERS" | "PHD" | "GRADUATE";

export type ReservedSeatProfile = {
  studentLevel?: StudentLevel | null;
  colleges?: string[] | null;
  majors?: string[] | null;
  minors?: string[] | null;
  termsInAttendance?: number | null;
  /** True if the student transferred to Berkeley (newness comes from terms). */
  isTransfer?: boolean | null;
};

const OPAQUE_GROUP_PATTERNS = [
  /enrollment permission/i,
  /^students with enrollment permission$/i,
];

/** College → phrases that appear in SIS reserved-seat labels (keep specific). */
const COLLEGE_ALIASES: Record<string, string[]> = {
  Business: ["haas school of business", "haas", "business administration"],
  Chemistry: ["college of chemistry"],
  "Computing, Data Science & Society": [
    "computing data science and society",
    "cdss",
  ],
  Education: ["school of education", "education sciences"],
  Engineering: ["college of engineering", "undeclared students in the coe"],
  "Environmental Design": [
    "college of environmental design",
    "environmental design",
  ],
  Information: ["school of information", "information management"],
  Journalism: ["journalism"],
  Law: ["school of law"],
  "Letters & Science": [
    "college of letters and science",
    "college of letters and sciences",
    "letters and science",
    "letters and sciences",
    "l and s",
    "undeclared students in the college of letters",
  ],
  "Natural Resources": [
    "rausser college of natural resources",
    "college of natural resources",
    "natural resources",
  ],
  Optometry: ["optometry"],
  "Public Health": ["public health", "school of public health"],
  "Public Policy": ["goldman school of public policy", "public policy"],
  "Social Welfare": ["social welfare"],
};

/**
 * Major → SIS phrases. Do NOT add sibling majors (e.g. bare "computer science"
 * on EECS) — that over-selects exclusive CS pools.
 */
const MAJOR_ALIASES: Record<string, string[]> = {
  "Electrical Engineering & Computer Sciences (EECS)": [
    "electrical engineering and computer sciences",
    "electrical engineering and computer science",
    "electrical and computer engineering",
    "eecs",
  ],
  "Computer Science": [
    "computer science ba",
    "computer science majors",
    "l and s computer science",
    "computer science",
  ],
  "Data Science": ["data science"],
  "Business Administration": ["business administration", "haas"],
  "Molecular and Cell Biology": ["molecular and cell biology"],
  "Integrative Biology": ["integrative biology"],
  "Chicanx Latinx Studies": [
    "chicano studies",
    "chicanx latinx",
    "chicanx latinX",
  ],
  "Film & Media": ["film majors", "film and media"],
  "Art History": ["art history"],
  "Art Practice": ["art practice"],
  "Aerospace Engineering": ["aerospace engineering"],
  "Mechanical Engineering": ["mechanical engineering"],
  Bioengineering: ["bioengineering"],
  "Civil Engineering": ["civil engineering"],
  Statistics: ["statistics"],
  English: ["english majors"],
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isOpaqueGroup = (description: string): boolean =>
  OPAQUE_GROUP_PATTERNS.some((pattern) => pattern.test(description));

type TermsConstraint =
  | { kind: "range"; min: number; max: number }
  | { kind: "min"; min: number }
  | null;

const parseTermsConstraint = (description: string): TermsConstraint => {
  const range = description.match(
    /(\d+)\s*[-–]\s*(\d+)\s+terms?\s+in\s+attendance/i
  );
  if (range) {
    return { kind: "range", min: Number(range[1]), max: Number(range[2]) };
  }

  const orMore = description.match(
    /(\d+)\s*(?:\+|or more)\s*terms?\s+in\s+attendance/i
  );
  if (orMore) {
    return { kind: "min", min: Number(orMore[1]) };
  }

  const plus = description.match(/(\d+)\+\s*terms?\s+in\s+attendance/i);
  if (plus) {
    return { kind: "min", min: Number(plus[1]) };
  }

  return null;
};

const termsMatch = (
  description: string,
  termsInAttendance: number | null | undefined
): boolean | null => {
  const constraint = parseTermsConstraint(description);
  if (!constraint) return null;
  if (termsInAttendance == null || Number.isNaN(termsInAttendance)) {
    return false;
  }
  if (constraint.kind === "range") {
    return (
      termsInAttendance >= constraint.min &&
      termsInAttendance <= constraint.max
    );
  }
  return termsInAttendance >= constraint.min;
};

/** Generic "Students with N Terms in Attendance" pools (no major/college). */
const isGenericTermsGroup = (description: string): boolean =>
  /^students with \d+/i.test(description.trim()) &&
  /terms?\s+in\s+attendance/i.test(description) &&
  !/\bmajors?\b|\bminors?\b|college|graduate|undergraduate students:/i.test(
    description
  );

const levelMatch = (
  description: string,
  level: StudentLevel | null | undefined
): boolean | null => {
  if (!level) return null;
  const text = description.toLowerCase();
  const hasUndergrad =
    /\bundergraduate\b|\bfreshman\b|\bfreshmen\b|\bfirst year undergraduate\b/.test(
      text
    );
  const hasMasters =
    /\bmaster(?:'s)?\b|\bmasters\b|\bmfa\b|\bmph\b|\bmeng\b|\bm\.eng\b/.test(
      text
    );
  const hasPhd = /\bphd\b|\bph\.d\b|\bdoctoral\b/.test(text);
  const hasGraduate = /\bgraduate\b/.test(text) && !hasUndergrad;

  const mentionsLevel = hasUndergrad || hasMasters || hasPhd || hasGraduate;
  if (!mentionsLevel) return null;

  switch (level) {
    case "UNDERGRAD":
      return hasUndergrad && !hasMasters && !hasPhd;
    case "MASTERS":
      return hasMasters || (hasGraduate && !hasPhd && !hasUndergrad);
    case "PHD":
      return hasPhd || (hasGraduate && !hasMasters && !hasUndergrad);
    case "GRADUATE":
      return hasGraduate || hasMasters || hasPhd;
    default:
      return null;
  }
};

const isTransferGroup = (description: string): boolean =>
  /\btransfers?\b/i.test(description);

/**
 * Canonical SIS "new first-year admit" pools only.
 * Do NOT match bare "freshman"/"freshmen" — that pulls in specialty programs
 * like Freshman Edge that are not automatic for every first-year student.
 */
const isNewStudentGroup = (description: string): boolean =>
  /\bnew first[ -]?year undergraduate\b|\bnew freshman(?:\s+students?)?\b/i.test(
    description
  ) && !/\bedge\b/i.test(description);

/** Standalone new-first-year pools (no college/major constraint in the label). */
const isPureNewStudentGroup = (description: string): boolean =>
  isNewStudentGroup(description) &&
  !/\bcollege\b|\bschool of\b|\bmajors?\b|\bminors?\b|\bundeclared\b/i.test(
    description
  );

/**
 * Broad undergrad-only pools ("All Undergraduate Students", etc.) with no
 * major/college/terms/program constraint in the label.
 */
const isGenericUndergraduateGroup = (description: string): boolean => {
  const text = description.trim();
  const looksUndergradWide =
    /^(?:all\s+)?undergraduates?(?:\s+students?)?$/i.test(text) ||
    /^all\s+undergraduate\s+students?\b/i.test(text) ||
    /^undergraduate\s+students?\b/i.test(text);
  if (!looksUndergradWide) return false;
  return !/\bmajors?\b|\bminors?\b|\bcollege\b|\bschool of\b|\bterms?\s+in\s+attendance\b|\btransfers?\b|\bedge\b|\bfreshman\b|\bfreshmen\b|\bnew first|\bdeclared\b|\bundeclared\b/i.test(
    text
  );
};

/**
 * Word-boundary alias hit on normalized text. Skips matches preceded by "non"
 * so "Non-EECS" does not match alias "eecs". Short "eecs" also ignores joint
 * program forms like "EECS/MSE" (slash compounds).
 */
const descriptionHasAlias = (
  description: string,
  alias: string
): boolean => {
  const normalizedAlias = normalize(alias);
  if (normalizedAlias.length < 3) return false;

  // Standalone EECS only — not EECS/MSE joint tokens.
  if (normalizedAlias === "eecs") {
    return /\beecs\b(?!\s*\/)/i.test(description) && !/\bnon[- ]eecs\b/i.test(description);
  }

  const normalizedDescription = normalize(description);
  const padded = ` ${normalizedDescription} `;
  const token = ` ${normalizedAlias} `;
  let from = 0;
  while (from < padded.length) {
    const idx = padded.indexOf(token, from);
    if (idx < 0) return false;
    const before = padded.slice(0, idx).trimEnd();
    if (before.endsWith(" non") || before.endsWith(" non-")) {
      from = idx + token.length;
      continue;
    }
    return true;
  }
  return false;
};

const aliasesFor = (
  value: string,
  aliasMap: Record<string, string[]>
): string[] => {
  const curated = aliasMap[value];
  // When curated aliases exist, do NOT also match the short display name
  // ("Engineering" ⊂ "Civil Engineering Majors").
  if (curated && curated.length > 0) {
    return [...curated];
  }
  return [
    value,
    value.replace(/&/g, " and "),
    value.replace(/\band\b/gi, "&"),
  ].filter(Boolean);
};

const aliasHits = (
  description: string,
  values: string[],
  aliasMap: Record<string, string[]>
): number => {
  let hits = 0;
  for (const value of values) {
    const aliases = aliasesFor(value, aliasMap);
    aliases.sort((a, b) => normalize(b).length - normalize(a).length);
    for (const alias of aliases) {
      if (descriptionHasAlias(description, alias)) {
        hits += 1;
        break;
      }
    }
  }
  return hits;
};

/** Other CoE majors — college-wide match should not pull these in for EECS/etc. */
const OTHER_SPECIFIC_MAJOR_MARKERS =
  /\b(mechanical engineering|civil engineering|bioengineering|aerospace engineering|industrial engineering(?: and operations research)?|environmental engineering|nuclear engineering|materials science|engineering physics|engineering science|chemical engineering)\b/i;

const isCollegeWideOnlyConflict = (
  description: string,
  majorHits: number,
  minorHits: number
): boolean =>
  majorHits === 0 &&
  minorHits === 0 &&
  OTHER_SPECIFIC_MAJOR_MARKERS.test(description);

/** Group names a specific exclusive major that conflicts with the user's majors. */
const exclusiveMajorConflict = (
  description: string,
  majors: string[]
): boolean => {
  const norm = normalize(description);
  const hasEecs = majors.some((m) => /eecs|electrical engineering/i.test(m));
  const hasCs = majors.some((m) => /^computer science$/i.test(m.trim()));

  // Pure CS BA pool should not apply to EECS-only profiles.
  if (
    hasEecs &&
    !hasCs &&
    /\bcomputer science ba\b|\bstudents declared in the computer science\b/.test(
      norm
    ) &&
    !/\beecs\b|\belectrical engineering\b/.test(norm)
  ) {
    return true;
  }

  // Explicit Non-EECS pools for EECS majors.
  if (hasEecs && /\bnon eecs\b/.test(norm)) {
    return true;
  }

  return false;
};

export type ReservedSeatGroupScore = {
  description: string;
  score: number;
};

type ScoreOptions = {
  /**
   * When true, include weak / non-suggested matches for browse ranking
   * (hard conflicts still score 0 and sort last).
   */
  includeWeakMatches?: boolean;
};

/**
 * Rank reserved-seat requirement-group descriptions against an academic profile.
 * Opaque permission-only groups are never suggested.
 * Level alone is never enough for auto-suggest — need major/college/terms/transfer
 * specificity (except canonical new-first-year pools).
 */
export const scoreReservedSeatGroups = (
  descriptions: string[],
  profile: ReservedSeatProfile,
  options: ScoreOptions = {}
): ReservedSeatGroupScore[] => {
  const includeWeakMatches = Boolean(options.includeWeakMatches);
  const colleges = profile.colleges?.filter(Boolean) ?? [];
  const majors = profile.majors?.filter(Boolean) ?? [];
  const minors = profile.minors?.filter(Boolean) ?? [];
  const isTransfer = Boolean(profile.isTransfer);
  const terms = profile.termsInAttendance;
  const isNewByTerms =
    terms != null && !Number.isNaN(terms) && terms <= 2;

  const scored: ReservedSeatGroupScore[] = [];

  for (const description of descriptions) {
    if (!description || isOpaqueGroup(description)) continue;

    let score = 0;
    let hardFail = false;

    const transfer = isTransferGroup(description);
    const isNewTransferLabel =
      /\bnew\b[\w\s]*\btransfers?\b|\btransfers?\b[\w\s]*\bnew\b/i.test(
        description
      );
    if (transfer && !isTransfer) {
      hardFail = true;
    } else if (transfer && isTransfer) {
      // "New transfer" pools only apply while terms are still low.
      if (isNewTransferLabel && !isNewByTerms) {
        hardFail = true;
      } else {
        score += 40;
      }
    }

    // "New First Year Undergraduate Students" / new freshman pools:
    // first-year admits (typically ≤2 terms), not transfers.
    const newFirstYearEligible =
      isNewStudentGroup(description) && !isTransfer && isNewByTerms;
    if (
      isNewStudentGroup(description) &&
      (isTransfer || (terms != null && terms > 2))
    ) {
      hardFail = true;
    } else if (newFirstYearEligible) {
      score += 40;
    }

    if (exclusiveMajorConflict(description, majors)) {
      hardFail = true;
    }

    // Declared majors shouldn't get undeclared-only pools.
    if (
      majors.length > 0 &&
      /\bundeclared students\b/i.test(description) &&
      !aliasHits(description, majors, MAJOR_ALIASES)
    ) {
      hardFail = true;
    }

    const level = levelMatch(description, profile.studentLevel);
    if (level === false) hardFail = true;
    if (level === true) score += 10; // small bonus only

    const termsOk = termsMatch(description, terms);
    if (termsOk === false) hardFail = true;
    if (termsOk === true) score += 30;

    const collegeHits = aliasHits(description, colleges, COLLEGE_ALIASES);
    const majorHits = aliasHits(description, majors, MAJOR_ALIASES);
    const minorHits = aliasHits(description, minors, MAJOR_ALIASES);

    // College hit on a Mechanical/Civil/... pool is not a real match for EECS.
    const collegeCounts =
      collegeHits > 0 &&
      !isCollegeWideOnlyConflict(description, majorHits, minorHits);

    score += (collegeCounts ? collegeHits : 0) * 20;
    score += majorHits * 40;
    score += minorHits * 30;

    // Soft browse ranking: partial college/major token overlap even when the
    // structured alias map missed (helps order the long tail in the dropdown).
    if (includeWeakMatches) {
      score += softProfileTokenOverlap(description, colleges, majors, minors);
    }

    const genericTerms = isGenericTermsGroup(description) && termsOk === true;
    if (genericTerms) score += 25;

    // Broad "All Undergraduate Students" pools for undergrads.
    const genericUndergrad =
      isGenericUndergraduateGroup(description) &&
      profile.studentLevel === "UNDERGRAD";
    if (genericUndergrad) {
      // Below major/college hits so more specific matches rank first.
      score += 20;
    } else if (
      isGenericUndergraduateGroup(description) &&
      profile.studentLevel != null &&
      profile.studentLevel !== "UNDERGRAD"
    ) {
      hardFail = true;
    }

    // Must have a specific hook — not undergrad-only noise from levelMatch.
    // Pure new-first-year labels match on terms; college/major-scoped ones
    // still need those hits (via collegeCounts / majorHits above).
    const newFirstYearSignal =
      newFirstYearEligible && isPureNewStudentGroup(description);
    const hasSpecificSignal =
      majorHits > 0 ||
      minorHits > 0 ||
      collegeCounts ||
      genericTerms ||
      genericUndergrad ||
      newFirstYearSignal ||
      (transfer && isTransfer);

    if (hardFail) {
      if (includeWeakMatches) {
        scored.push({ description, score: 0 });
      }
      continue;
    }

    if (!includeWeakMatches && (!hasSpecificSignal || score <= 0)) {
      continue;
    }

    scored.push({ description, score });
  }

  return scored.sort(
    (a, b) => b.score - a.score || a.description.localeCompare(b.description)
  );
};

/**
 * Soft token overlap between a group label and the user's college/major/minor
 * display names (and short aliases). Used only for browse ranking.
 */
const softProfileTokenOverlap = (
  description: string,
  colleges: string[],
  majors: string[],
  minors: string[]
): number => {
  const haystack = normalize(description);
  if (!haystack) return 0;

  let bonus = 0;
  const addTerms = (
    values: string[],
    aliasMap: Record<string, string[]>,
    weight: number
  ) => {
    for (const value of values) {
      const candidates = [
        ...aliasesFor(value, aliasMap),
        value,
        normalize(value),
      ];
      for (const alias of candidates) {
        const normalizedAlias = normalize(alias);
        if (normalizedAlias.length < 4) continue;
        if (haystack.includes(normalizedAlias)) {
          bonus += weight;
          break;
        }
        // Multi-word / short college names: count significant token hits.
        const tokens = normalizedAlias
          .split(" ")
          .filter((token) => token.length >= 4);
        if (tokens.length === 0) continue;
        const hits = tokens.filter((token) =>
          new RegExp(
            `\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
          ).test(haystack)
        ).length;
        if (tokens.length === 1 && hits === 1) {
          bonus += Math.floor(weight / 2);
          break;
        }
        if (tokens.length >= 2 && hits >= 2) {
          bonus += Math.floor(weight * (hits / tokens.length));
          break;
        }
      }
    }
  };

  addTerms(colleges, COLLEGE_ALIASES, 8);
  addTerms(majors, MAJOR_ALIASES, 12);
  addTerms(minors, MAJOR_ALIASES, 10);
  return bonus;
};

/** Full ranked list for dropdown browse (suggested-quality + weaker neighbors). */
export const rankReservedSeatGroups = (
  descriptions: string[],
  profile: ReservedSeatProfile
): string[] =>
  scoreReservedSeatGroups(descriptions, profile, {
    includeWeakMatches: true,
  }).map((item) => item.description);

export const suggestReservedSeatGroups = (
  descriptions: string[],
  profile: ReservedSeatProfile
): string[] =>
  scoreReservedSeatGroups(descriptions, profile).map((item) => item.description);
