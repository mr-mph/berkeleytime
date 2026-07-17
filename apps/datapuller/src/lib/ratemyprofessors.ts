/**
 * Unofficial Rate My Professors GraphQL client.
 * Pattern inspired by https://github.com/tisuela/ratemyprof-api
 *
 * Endpoint + auth header are public (embedded in RMP's frontend).
 */

const RMP_GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql";
const RMP_AUTH_HEADER = "Basic dGVzdDp0ZXN0";

/** UC Berkeley school ID on Rate My Professors (legacy sid 1072). */
export const UC_BERKELEY_RMP_SCHOOL_ID = "U2Nob29sLTEwNzI=";

export interface RmpProfessorSummary {
  legacyId: number;
  firstName: string;
  lastName: string;
  department?: string;
  avgRating: number | null;
  numRatings: number;
}

type TeacherEdge = {
  node: {
    legacyId: number;
    firstName: string;
    lastName: string;
    department?: string | null;
    avgRating?: number | null;
    numRatings?: number | null;
  };
};

type TeacherSearchResponse = {
  data?: {
    newSearch?: {
      teachers?: {
        pageInfo?: {
          hasNextPage?: boolean;
          endCursor?: string | null;
        };
        edges?: TeacherEdge[];
      };
    };
  };
  errors?: { message: string }[];
};

const TEACHERS_QUERY = `
  query TeachersBySchool($schoolID: ID!, $cursor: String) {
    newSearch {
      teachers(
        query: { text: "", schoolID: $schoolID }
        first: 100
        after: $cursor
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            legacyId
            firstName
            lastName
            department
            avgRating
            numRatings
          }
        }
      }
    }
  }
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function rmpGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(RMP_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: RMP_AUTH_HEADER,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Rate My Professors request failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

/**
 * Fetch all professors for a school (paginated), similar to
 * RateMyProfScraper in tisuela/ratemyprof-api.
 */
export async function fetchAllProfessorsForSchool(
  schoolId: string = UC_BERKELEY_RMP_SCHOOL_ID,
  options?: {
    delayMs?: number;
    onPage?: (fetched: number) => void;
  }
): Promise<RmpProfessorSummary[]> {
  const delayMs = options?.delayMs ?? 250;
  const professors: RmpProfessorSummary[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const payload: TeacherSearchResponse = await rmpGraphQL<TeacherSearchResponse>(
      TEACHERS_QUERY,
      {
        schoolID: schoolId,
        cursor,
      }
    );

    if (payload.errors?.length) {
      throw new Error(
        `Rate My Professors GraphQL error: ${payload.errors
          .map((error: { message: string }) => error.message)
          .join("; ")}`
      );
    }

    const teachers: NonNullable<
      NonNullable<TeacherSearchResponse["data"]>["newSearch"]
    >["teachers"] = payload.data?.newSearch?.teachers;
    const edges = teachers?.edges ?? [];

    for (const edge of edges) {
      const node = edge.node;
      if (!node?.firstName || !node?.lastName) continue;
      professors.push({
        legacyId: node.legacyId,
        firstName: node.firstName.trim(),
        lastName: node.lastName.trim(),
        department: node.department?.trim() || undefined,
        avgRating:
          typeof node.avgRating === "number" && node.avgRating > 0
            ? node.avgRating
            : null,
        numRatings: node.numRatings ?? 0,
      });
    }

    options?.onPage?.(professors.length);
    hasNextPage = Boolean(teachers?.pageInfo?.hasNextPage);
    cursor = teachers?.pageInfo?.endCursor ?? null;

    if (hasNextPage) {
      await sleep(delayMs);
    }
  }

  return professors;
}

export {
  instructorLookupKey,
  normalizeInstructorName,
} from "@repo/shared";
