/**
 * Unofficial ASSIST.org client for CCC-to-UC-Berkeley course articulations.
 *
 * Uses the same public, unauthenticated API that powers assist.org itself.
 * The API requires the standard ASP.NET antiforgery pair issued to every
 * visitor: the cookies set by loading the homepage plus an X-XSRF-TOKEN
 * header echoing the readable X-XSRF-TOKEN cookie.
 */
import { normalizeSubject } from "@repo/common";
import { IArticulationCourse, IArticulationItem } from "@repo/common/models";

const ASSIST_BASE_URL = "https://assist.org";
const REQUEST_TIMEOUT_MS = 60_000;

/** UC Berkeley institution ID on ASSIST. */
export const UC_BERKELEY_ASSIST_ID = 79;

export interface AssistInstitution {
  id: number;
  isCommunityCollege: boolean;
  code?: string;
  names: { name: string; fromYear?: number }[];
}

export interface AssistAcademicYear {
  id: number;
  fallYear: number;
}

export interface AssistAgreementAvailability {
  institutionParentId: number;
  sendingYearIds: number[];
  receivingYearIds: number[];
}

interface AssistAttribute {
  content?: string | null;
}

interface AssistSendingCourse {
  type?: string;
  prefix?: string;
  courseNumber?: string;
  courseTitle?: string;
  minUnits?: number;
  maxUnits?: number;
  position?: number;
  attributes?: AssistAttribute[] | null;
}

interface AssistCourseGroup {
  type?: string;
  courseConjunction?: string;
  position?: number;
  items?: AssistSendingCourse[] | null;
  attributes?: AssistAttribute[] | null;
}

interface AssistSendingArticulation {
  noArticulationReason?: string | null;
  items?: AssistCourseGroup[] | null;
  courseGroupConjunctions?: { groupConjunction?: string }[] | null;
  attributes?: AssistAttribute[] | null;
}

interface AssistReceivingCourse {
  prefix?: string;
  courseNumber?: string;
  courseTitle?: string;
}

interface AssistArticulation {
  type?: string;
  course?: AssistReceivingCourse;
  series?: {
    conjunction?: string;
    courses?: AssistReceivingCourse[] | null;
  };
  sendingArticulation?: AssistSendingArticulation | null;
  courseAttributes?: AssistAttribute[] | null;
  attributes?: AssistAttribute[] | null;
}

interface AssistAgreementResult {
  isSuccessful?: boolean;
  result?: {
    // JSON-encoded array of departments, each with articulations
    articulations?: string;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class AssistClient {
  private cookies = "";
  private xsrfToken = "";
  private delayMs: number;

  constructor(options?: { delayMs?: number }) {
    this.delayMs = options?.delayMs ?? 500;
  }

  /** Load the homepage to receive the antiforgery cookies. */
  async handshake(): Promise<void> {
    const response = await fetch(ASSIST_BASE_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`ASSIST handshake failed: ${response.status}`);
    }

    const setCookies = response.headers.getSetCookie();
    const pairs = setCookies
      .map((cookie) => cookie.split(";")[0])
      .filter(Boolean);
    this.cookies = pairs.join("; ");

    const xsrfPair = pairs.find((pair) => pair.startsWith("X-XSRF-TOKEN="));
    if (!xsrfPair) {
      throw new Error("ASSIST handshake did not set an X-XSRF-TOKEN cookie");
    }
    this.xsrfToken = decodeURIComponent(xsrfPair.split("=").slice(1).join("="));
  }

  async getJson<T>(path: string): Promise<T> {
    const maxAttempts = 5;
    for (let attempt = 1; ; attempt++) {
      await sleep(this.delayMs);
      // exponential backoff for transient failures; overridden on 429
      let retryDelayMs = 1000 * 2 ** attempt;
      try {
        if (!this.xsrfToken) await this.handshake();
        const response = await fetch(`${ASSIST_BASE_URL}${path}`, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
            Cookie: this.cookies,
            "X-XSRF-TOKEN": this.xsrfToken,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          // a 400/403 usually means the antiforgery pair went stale
          if (response.status === 400 || response.status === 403) {
            this.xsrfToken = "";
          }
          // rate limited: wait out the window (ASSIST allows bursts of ~100)
          if (response.status === 429) {
            const retryAfter = Number(response.headers.get("retry-after"));
            retryDelayMs =
              retryAfter > 0
                ? Math.min(retryAfter * 1000, 600_000)
                : 60_000 * attempt;
          }
          throw new Error(`ASSIST request failed: ${response.status} ${path}`);
        }
        return (await response.json()) as T;
      } catch (error) {
        if (attempt >= maxAttempts) throw error;
        await sleep(retryDelayMs);
      }
    }
  }

  getInstitutions(): Promise<AssistInstitution[]> {
    return this.getJson<AssistInstitution[]>("/api/institutions");
  }

  getAcademicYears(): Promise<AssistAcademicYear[]> {
    return this.getJson<AssistAcademicYear[]>("/api/AcademicYears");
  }

  getAgreementAvailability(
    receivingId: number
  ): Promise<AssistAgreementAvailability[]> {
    return this.getJson<AssistAgreementAvailability[]>(
      `/api/institutions/${receivingId}/agreements`
    );
  }

  /**
   * Fetch the parsed all-departments agreement from a sending college for one
   * academic year. Returns the raw ASSIST articulation entries.
   */
  async getAllDepartmentsAgreement(
    sendingId: number,
    receivingId: number,
    academicYearId: number
  ): Promise<AssistArticulation[]> {
    const key = `${academicYearId}/${sendingId}/to/${receivingId}/AllDepartments`;
    const data = await this.getJson<AssistAgreementResult>(
      `/api/articulation/Agreements?Key=${encodeURIComponent(key)}`
    );

    if (!data.isSuccessful || !data.result?.articulations) {
      throw new Error(
        `ASSIST agreement ${key} returned no articulations payload`
      );
    }

    const departments = JSON.parse(data.result.articulations) as {
      articulations?: AssistArticulation[] | null;
    }[];

    return departments.flatMap((department) => department.articulations ?? []);
  }
}

// ASSIST prefixes whose normalized form differs from Berkeley SIS subject codes
const SUBJECT_ALIASES: Record<string, string> = {
  LNS: "LS", // Letters & Science
};

const toBerkeleySubject = (prefix: string) => {
  const normalized = normalizeSubject(prefix);
  return SUBJECT_ALIASES[normalized] ?? normalized;
};

const byPosition = <T extends { position?: number }>(a: T, b: T) =>
  (a.position ?? 0) - (b.position ?? 0);

const toArticulationCourse = (
  course: AssistSendingCourse
): IArticulationCourse => ({
  prefix: (course.prefix ?? "").trim(),
  number: (course.courseNumber ?? "").trim(),
  title: course.courseTitle?.trim() || undefined,
  minUnits: course.minUnits,
  maxUnits: course.maxUnits,
});

const collectNotes = (target: Set<string>, ...sources: unknown[]) => {
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const attribute of source as AssistAttribute[]) {
      const content = attribute?.content?.trim();
      if (content) target.add(content);
    }
  }
};

const optionSignature = (courses: IArticulationCourse[]) =>
  courses
    .map((course) => `${course.prefix} ${course.number}`)
    .sort()
    .join("|");

interface ReceivingCourseTarget {
  subject: string;
  number: string;
  courseTitle?: string;
  seriesWith?: string[];
}

const toReceivingTargets = (
  articulation: AssistArticulation
): ReceivingCourseTarget[] => {
  if (articulation.type === "Course" && articulation.course) {
    const { prefix, courseNumber, courseTitle } = articulation.course;
    if (!prefix || !courseNumber) return [];
    return [
      {
        subject: toBerkeleySubject(prefix),
        number: courseNumber.trim(),
        courseTitle: courseTitle?.trim() || undefined,
      },
    ];
  }

  if (articulation.type === "Series" && articulation.series?.courses?.length) {
    const members = articulation.series.courses.filter(
      (course) => course.prefix && course.courseNumber
    );
    return members.map((course) => ({
      subject: toBerkeleySubject(course.prefix as string),
      number: (course.courseNumber as string).trim(),
      courseTitle: course.courseTitle?.trim() || undefined,
      seriesWith: members
        .filter((other) => other !== course)
        .map((other) => `${other.prefix} ${other.courseNumber}`),
    }));
  }

  return [];
};

/**
 * Convert one sending articulation into OR-alternatives of AND-course-groups.
 * Returns null when the entry articulates no actual courses.
 */
const toOptions = (
  sending: AssistSendingArticulation | null | undefined,
  notes: Set<string>
): IArticulationCourse[][] | null => {
  if (!sending || sending.noArticulationReason) return null;

  const groups = (sending.items ?? [])
    .filter((group) => group.type === "CourseGroup")
    .sort(byPosition);
  if (groups.length === 0) return null;

  collectNotes(notes, sending.attributes);

  const groupConjunctions = sending.courseGroupConjunctions ?? [];
  const hasAndBetweenGroups = groupConjunctions.some(
    (conjunction) => conjunction.groupConjunction === "And"
  );

  const groupCourses = groups.map((group) => {
    collectNotes(notes, group.attributes);
    const courses = (group.items ?? [])
      .filter((item) => item.type === "Course")
      .sort(byPosition);
    for (const course of courses) collectNotes(notes, course.attributes);
    return { conjunction: group.courseConjunction, courses };
  });

  // ASSIST agreements nearly always join groups with "Or" (alternatives).
  // On the rare "And" between groups, conservatively require every course.
  if (hasAndBetweenGroups) {
    const combined = groupCourses
      .flatMap((group) => group.courses)
      .map(toArticulationCourse);
    return combined.length > 0 ? [combined] : null;
  }

  const options: IArticulationCourse[][] = [];
  for (const group of groupCourses) {
    if (group.courses.length === 0) continue;
    if (group.conjunction === "Or") {
      // alternatives within a single group: each course stands alone
      for (const course of group.courses) {
        options.push([toArticulationCourse(course)]);
      }
    } else {
      options.push(group.courses.map(toArticulationCourse));
    }
  }

  return options.length > 0 ? options : null;
};

export interface ParseAgreementInput {
  articulations: AssistArticulation[];
  institution: { id: number; name: string; code?: string };
  academicYearId: number;
  academicYear: string;
}

/**
 * Flatten one college's all-departments agreement into per-Berkeley-course
 * articulation documents, merging duplicate receiving courses (e.g. the same
 * course listed under multiple ASSIST departments).
 */
export const parseAgreement = ({
  articulations,
  institution,
  academicYearId,
  academicYear,
}: ParseAgreementInput): IArticulationItem[] => {
  const merged = new Map<string, IArticulationItem>();

  for (const articulation of articulations) {
    const notes = new Set<string>();
    collectNotes(notes, articulation.courseAttributes, articulation.attributes);

    const options = toOptions(articulation.sendingArticulation, notes);
    if (!options) continue;

    for (const target of toReceivingTargets(articulation)) {
      const key = [
        target.subject,
        target.number,
        ...(target.seriesWith ?? []).toSorted(),
      ].join("|");

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          subject: target.subject,
          number: target.number,
          courseTitle: target.courseTitle,
          seriesWith: target.seriesWith,
          institutionId: institution.id,
          institutionName: institution.name,
          institutionCode: institution.code,
          academicYear,
          academicYearId,
          options: options.map((courses) => ({ courses })),
          notes: notes.size > 0 ? [...notes] : undefined,
        });
        continue;
      }

      const seen = new Set(
        existing.options.map((option) => optionSignature(option.courses))
      );
      for (const courses of options) {
        if (seen.has(optionSignature(courses))) continue;
        existing.options.push({ courses });
      }
      if (notes.size > 0) {
        existing.notes = [...new Set([...(existing.notes ?? []), ...notes])];
      }
    }
  }

  return [...merged.values()];
};

/** Current display name for an ASSIST institution, e.g. "De Anza College". */
export const institutionDisplayName = (
  institution: AssistInstitution
): string => {
  const names = institution.names ?? [];
  const current = names.toSorted(
    (a, b) => (b.fromYear ?? 0) - (a.fromYear ?? 0)
  )[0];
  return current?.name?.trim() ?? `Institution ${institution.id}`;
};
