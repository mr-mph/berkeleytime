export type ParsedUcbEnrollment = {
  sectionId: string;
  sectionNumber?: string;
  status?: string;
  enrolledCount: number;
  reservedCount: number;
  waitlistedCount: number;
  minEnroll?: number;
  maxEnroll: number;
  maxWaitlist: number;
  openReserved: number;
  instructorAddConsentRequired?: boolean;
  instructorDropConsentRequired?: boolean;
  seatReservationCount: Array<{
    number: number;
    maxEnroll: number;
    enrolledCount?: number;
  }>;
  seatReservationTypes: Array<{
    number: number;
    requirementGroup?: {
      code?: string;
      description: string;
    };
    fromDate: string;
  }>;
};

export type ParsedUcbCatalogEnrollment = {
  primary: ParsedUcbEnrollment;
  associatedSections: ParsedUcbEnrollment[];
};

/** True when the catalog page has no usable seat counts (common on non-controlling cross-listings). */
export function isBlankUcbEnrollment(
  scraped: Pick<ParsedUcbEnrollment, "enrolledCount" | "maxEnroll"> | null | undefined
): boolean {
  if (!scraped) return true;
  return (scraped.maxEnroll ?? 0) <= 0 && (scraped.enrolledCount ?? 0) <= 0;
}

export type UcbCatalogEnrollmentErrorCode =
  | "BAD_USER_INPUT"
  | "INTERNAL_SERVER_ERROR";

export class UcbCatalogEnrollmentError extends Error {
  readonly code: UcbCatalogEnrollmentErrorCode;

  constructor(message: string, code: UcbCatalogEnrollmentErrorCode) {
    super(message);
    this.name = "UcbCatalogEnrollmentError";
    this.code = code;
  }
}

type UcbEnrollmentStatus = {
  status?: { code?: string; description?: string };
  enrolledCount?: number;
  reservedCount?: number;
  waitlistedCount?: number;
  minEnroll?: number;
  maxEnroll?: number;
  maxWaitlist?: number;
  openReserved?: number;
  instructorAddConsentRequired?: boolean;
  instructorDropConsentRequired?: boolean;
  seatReservations?: Array<{
    number?: number;
    requirementGroup?: { code?: string; description?: string };
    fromDate?: string;
    maxEnroll?: number;
    enrolledCount?: number;
  }>;
};

type UcbEnrollmentPayload = {
  id?: number | string;
  enrollmentStatus?: UcbEnrollmentStatus;
};

const DEFAULT_USER_AGENT = "BerkeleytimeEnrollmentRefresh/1.0";
const DEFAULT_TIMEOUT_MS = 15000;

export function buildUcbCatalogUrl(args: {
  year: number;
  semester: string;
  subject: string;
  courseNumber: string;
  number: string;
  component: string;
}): string {
  const { year, semester, subject, courseNumber, number, component } = args;
  return `https://classes.berkeley.edu/content/${year}-${semester.toLowerCase()}-${subject.toLowerCase()}-${courseNumber}-${number}-${component.toLowerCase()}-${number}`;
}

function extractNodeId(html: string): string | null {
  const match = html.match(/<article[^>]*data-history-node-id="([^"]+)"/i);
  return match?.[1] ?? null;
}

function extractDrupalSettingsJson(html: string): unknown {
  const match = html.match(
    /<script[^>]*data-drupal-selector="drupal-settings-json"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) {
    throw new UcbCatalogEnrollmentError(
      "Could not find enrollment data on the Berkeley Catalog page",
      "BAD_USER_INPUT"
    );
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    throw new UcbCatalogEnrollmentError(
      "Could not parse enrollment data from the Berkeley Catalog page",
      "INTERNAL_SERVER_ERROR"
    );
  }
}

function mapEnrollmentStatus(
  payload: UcbEnrollmentPayload | undefined
): ParsedUcbEnrollment | null {
  const status = payload?.enrollmentStatus;
  if (!status || payload?.id == null) return null;

  const seatReservations = status.seatReservations ?? [];

  return {
    sectionId: String(payload.id),
    status: status.status?.code,
    enrolledCount: status.enrolledCount ?? 0,
    reservedCount: status.reservedCount ?? 0,
    waitlistedCount: status.waitlistedCount ?? 0,
    minEnroll: status.minEnroll,
    maxEnroll: status.maxEnroll ?? 0,
    maxWaitlist: status.maxWaitlist ?? 0,
    openReserved: status.openReserved ?? 0,
    instructorAddConsentRequired: status.instructorAddConsentRequired,
    instructorDropConsentRequired: status.instructorDropConsentRequired,
    seatReservationCount: seatReservations.map((reservation) => ({
      number: reservation.number ?? 0,
      maxEnroll: reservation.maxEnroll ?? 0,
      enrolledCount: reservation.enrolledCount,
    })),
    seatReservationTypes: seatReservations
      .filter((reservation) => reservation.requirementGroup?.description)
      .map((reservation) => ({
        number: reservation.number ?? 0,
        requirementGroup: {
          code: reservation.requirementGroup?.code,
          description: reservation.requirementGroup?.description ?? "Unknown",
        },
        fromDate: reservation.fromDate ?? "",
      })),
  };
}

export function parseUcbCatalogEnrollment(html: string): ParsedUcbEnrollment {
  const settings = extractDrupalSettingsJson(html) as {
    ucb?: {
      enrollment?: {
        available?: UcbEnrollmentPayload;
        history?: UcbEnrollmentPayload;
      };
    };
  };

  const parsed =
    mapEnrollmentStatus(settings.ucb?.enrollment?.available) ??
    mapEnrollmentStatus(settings.ucb?.enrollment?.history);

  if (!parsed) {
    throw new UcbCatalogEnrollmentError(
      "Berkeley Catalog page did not include enrollment counts",
      "BAD_USER_INPUT"
    );
  }

  return parsed;
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumberField(text: string, label: string): number | undefined {
  const match = text.match(new RegExp(`${label}:\\s*([0-9]+)`, "i"));
  if (!match?.[1]) return undefined;
  return Number.parseInt(match[1], 10);
}

export function parseAssociatedSectionEnrollments(
  html: string
): ParsedUcbEnrollment[] {
  const chunks = html.match(
    /<div class="detail-class-associated-sections-flex">[\s\S]*?(?=<div class="detail-class-associated-sections-flex">|$)/g
  );
  if (!chunks) return [];

  return chunks
    .map((chunk) => {
      const text = stripTags(chunk);
      const sectionMatch = text.match(/\b([0-9]{3}[A-Z]?)\s+[A-Z]+\b/i);
      const classNumberMatch = text.match(/Class #:\s*([0-9]+)/i);
      const enrolledCount = parseNumberField(text, "Enrolled");
      const maxEnroll = parseNumberField(text, "Enrollment Limit");
      const waitlistedCount = parseNumberField(text, "Waitlisted") ?? 0;
      const maxWaitlist = parseNumberField(text, "Waitlist limit") ?? 0;

      if (
        !sectionMatch?.[1] ||
        !classNumberMatch?.[1] ||
        enrolledCount == null ||
        maxEnroll == null
      ) {
        return null;
      }

      const parsed: ParsedUcbEnrollment = {
        sectionId: classNumberMatch[1],
        sectionNumber: sectionMatch[1],
        status: enrolledCount < maxEnroll ? "O" : "C",
        enrolledCount,
        reservedCount: enrolledCount,
        waitlistedCount,
        maxEnroll,
        maxWaitlist,
        openReserved: Math.max(0, maxEnroll - enrolledCount),
        seatReservationCount: [],
        seatReservationTypes: [],
      };

      return parsed;
    })
    .filter((section): section is ParsedUcbEnrollment => section != null);
}

export type FetchUcbCatalogEnrollmentOptions = {
  userAgent?: string;
  timeoutMs?: number;
};

export async function fetchUcbCatalogEnrollment(
  url: string,
  options: FetchUcbCatalogEnrollmentOptions = {}
): Promise<ParsedUcbCatalogEnrollment> {
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new UcbCatalogEnrollmentError(
      `Failed to reach Berkeley Catalog: ${
        error instanceof Error ? error.message : "network error"
      }`,
      "INTERNAL_SERVER_ERROR"
    );
  }

  if (!response.ok) {
    throw new UcbCatalogEnrollmentError(
      `Berkeley Catalog returned HTTP ${response.status}`,
      "BAD_USER_INPUT"
    );
  }

  const html = await response.text();
  const primary = parseUcbCatalogEnrollment(html);

  const nodeId = extractNodeId(html);
  if (!nodeId) {
    return { primary, associatedSections: [] };
  }

  const associatedUrl = new URL(`/sections/associated/${nodeId}`, url);
  let associatedSections: ParsedUcbEnrollment[] = [];
  try {
    const associatedResponse = await fetch(associatedUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (associatedResponse.ok) {
      associatedSections = parseAssociatedSectionEnrollments(
        await associatedResponse.text()
      );
    }
  } catch {
    // Associated sections are best-effort; keep primary refresh working.
  }

  return { primary, associatedSections };
}
