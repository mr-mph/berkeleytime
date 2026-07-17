import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApolloClient, useQuery } from "@apollo/client/react";

import type {
  ICatalogClassServer,
  ICatalogFilterOptions,
  ICatalogFilters,
} from "@/lib/api/catalog";
import { GET_CATALOG_SEARCH } from "@/lib/api/catalog";
import { CATALOG_ENROLLMENT_REFRESH_EVENT } from "@/lib/catalogEnrollmentRefresh";
import { GetCatalogFilterOptionsDocument } from "@/lib/generated/graphql";
import type {
  GetCatalogSearchQuery,
  GetCatalogSearchQueryVariables,
  Semester,
} from "@/lib/generated/graphql";

import { SortBy } from "../browser";
import { mapSortBy } from "./useCatalogFilters";

const DEFAULT_PAGE_SIZE = 25;

const mapSortOrder = (
  order: "asc" | "desc"
): GetCatalogSearchQueryVariables["sortOrder"] =>
  (order === "asc"
    ? "ASC"
    : "DESC") as GetCatalogSearchQueryVariables["sortOrder"];

const getCatalogClassKey = (_class: ICatalogClassServer): string =>
  `${_class.sessionId}-${_class.subject}-${_class.courseNumber}-${_class.number}`;

const mergeUniqueCatalogClasses = (
  existingClasses: ICatalogClassServer[],
  incomingClasses: ICatalogClassServer[]
): ICatalogClassServer[] => {
  if (incomingClasses.length === 0) return existingClasses;

  const seenClassKeys = new Set(existingClasses.map(getCatalogClassKey));
  const uniqueIncomingClasses = incomingClasses.filter((incomingClass) => {
    const key = getCatalogClassKey(incomingClass);
    if (seenClassKeys.has(key)) return false;
    seenClassKeys.add(key);
    return true;
  });

  if (uniqueIncomingClasses.length === 0) return existingClasses;
  return [...existingClasses, ...uniqueIncomingClasses];
};

const enrollmentFieldsEqual = (
  a: ICatalogClassServer,
  b: ICatalogClassServer
) =>
  a.enrolledCount === b.enrolledCount &&
  a.maxEnroll === b.maxEnroll &&
  a.activeReservedMaxCount === b.activeReservedMaxCount &&
  a.enrollmentUpdatedAt === b.enrollmentUpdatedAt;

export interface UseCatalogQueryOptions {
  year: number;
  semester: Semester;
  query: string;
  sortBy: SortBy;
  effectiveOrder: "asc" | "desc";
  filterVariables: ICatalogFilters | undefined;
  semanticSearch?: boolean;
}

export interface UseCatalogQueryReturn {
  classes: ICatalogClassServer[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  loadNextPage: () => Promise<void>;
  isLoadingNextPage: boolean;
  filterOptions: ICatalogFilterOptions | null;
  semanticError: string | null;
}

export default function useCatalogQuery({
  year: currentYear,
  semester: currentSemester,
  query: rawQuery,
  sortBy,
  effectiveOrder,
  filterVariables,
  semanticSearch = false,
}: UseCatalogQueryOptions): UseCatalogQueryReturn {
  const apolloClient = useApolloClient();
  const [localPage, setLocalPage] = useState(1);
  const [classes, setClasses] = useState<ICatalogClassServer[]>([]);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const isLoadingNextPageRef = useRef(false);
  const queryGenerationRef = useRef(0);
  const localPageRef = useRef(1);
  const isRefreshingEnrollmentRef = useRef(false);

  // In semantic mode the query is committed externally — no debounce needed.
  // In normal mode, debounce to avoid firing on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);
  useEffect(() => {
    if (semanticSearch) {
      setDebouncedQuery(rawQuery);
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(rawQuery), 300);
    return () => clearTimeout(timer);
  }, [rawQuery, semanticSearch]);

  // Reset page when filters/search change
  useEffect(() => {
    queryGenerationRef.current += 1;
    setLocalPage(1);
    setIsLoadingNextPage(false);
    isLoadingNextPageRef.current = false;
  }, [
    debouncedQuery,
    filterVariables,
    sortBy,
    effectiveOrder,
    currentYear,
    currentSemester,
    semanticSearch,
  ]);

  const catalogQueryVariables = useMemo<
    Omit<GetCatalogSearchQueryVariables, "page" | "pageSize">
  >(
    () => ({
      year: currentYear,
      semester: currentSemester,
      search: debouncedQuery || undefined,
      filters: filterVariables,
      sortBy: debouncedQuery ? undefined : mapSortBy(sortBy),
      sortOrder: debouncedQuery ? undefined : mapSortOrder(effectiveOrder),
      semanticSearch: semanticSearch || undefined,
    }),
    [
      currentYear,
      currentSemester,
      debouncedQuery,
      filterVariables,
      sortBy,
      effectiveOrder,
      semanticSearch,
    ]
  );

  const catalogQueryVariablesRef = useRef(catalogQueryVariables);
  catalogQueryVariablesRef.current = catalogQueryVariables;
  localPageRef.current = localPage;

  // Server-side catalog query (always requests first page)
  const { data, loading, error, fetchMore } = useQuery<
    GetCatalogSearchQuery,
    GetCatalogSearchQueryVariables
  >(GET_CATALOG_SEARCH, {
    variables: {
      ...catalogQueryVariables,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    },
    // Show cached data instantly, then revalidate in the background.
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Fetch filter options (heavily cached)
  const { data: filterOptionsData } = useQuery(
    GetCatalogFilterOptionsDocument,
    {
      variables: {
        year: currentYear,
        semester: currentSemester,
      },
      fetchPolicy: "cache-first",
    }
  );

  const firstPageClasses: ICatalogClassServer[] = useMemo(
    () => data?.catalogSearch?.results ?? [],
    [data]
  );
  const totalCount: number = data?.catalogSearch?.totalCount ?? 0;

  useEffect(() => {
    if (localPage === 1) {
      setClasses(firstPageClasses);
      setIsLoadingNextPage(false);
      isLoadingNextPageRef.current = false;
      return;
    }

    // After scroll-load, still merge refreshed page-1 enrollment into the list.
    if (firstPageClasses.length === 0) return;
    setClasses((previousClasses) => {
      const updates = new Map(
        firstPageClasses.map((catalogClass) => [
          getCatalogClassKey(catalogClass),
          catalogClass,
        ])
      );
      let changed = false;
      const next = previousClasses.map((catalogClass) => {
        const updated = updates.get(getCatalogClassKey(catalogClass));
        if (!updated || enrollmentFieldsEqual(catalogClass, updated)) {
          return catalogClass;
        }
        changed = true;
        return { ...catalogClass, ...updated };
      });
      return changed ? next : previousClasses;
    });
  }, [firstPageClasses, localPage]);

  const refreshLoadedEnrollment = useCallback(async () => {
    if (isRefreshingEnrollmentRef.current) return;
    isRefreshingEnrollmentRef.current = true;
    const requestGeneration = queryGenerationRef.current;
    const pagesToLoad = Math.max(localPageRef.current, 1);
    const variables = catalogQueryVariablesRef.current;

    try {
      const pageResults: ICatalogClassServer[][] = [];
      for (let page = 1; page <= pagesToLoad; page += 1) {
        const { data: pageData } = await apolloClient.query<
          GetCatalogSearchQuery,
          GetCatalogSearchQueryVariables
        >({
          query: GET_CATALOG_SEARCH,
          variables: {
            ...variables,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          },
          fetchPolicy: "network-only",
        });
        pageResults.push(pageData?.catalogSearch?.results ?? []);
      }

      if (requestGeneration !== queryGenerationRef.current) return;

      const merged = pageResults.reduce<ICatalogClassServer[]>(
        (acc, pageClasses) => mergeUniqueCatalogClasses(acc, pageClasses),
        []
      );
      setClasses(merged);
    } finally {
      isRefreshingEnrollmentRef.current = false;
    }
  }, [apolloClient]);

  useEffect(() => {
    const onRefresh = () => {
      void refreshLoadedEnrollment();
    };
    window.addEventListener(CATALOG_ENROLLMENT_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener(CATALOG_ENROLLMENT_REFRESH_EVENT, onRefresh);
    };
  }, [refreshLoadedEnrollment]);

  const hasNextPage = classes.length < totalCount;

  const loadNextPage = useCallback(async () => {
    if (!hasNextPage || loading || isLoadingNextPageRef.current) return;

    const requestGeneration = queryGenerationRef.current;
    const nextPage = localPage + 1;
    isLoadingNextPageRef.current = true;
    setIsLoadingNextPage(true);

    try {
      const { data: nextPageData } = await fetchMore({
        variables: {
          ...catalogQueryVariables,
          page: nextPage,
          pageSize: DEFAULT_PAGE_SIZE,
        },
      });

      if (requestGeneration !== queryGenerationRef.current) return;

      const nextPageClasses: ICatalogClassServer[] =
        nextPageData?.catalogSearch?.results ?? [];
      if (nextPageClasses.length === 0) return;

      setClasses((previousClasses) =>
        mergeUniqueCatalogClasses(previousClasses, nextPageClasses)
      );
      setLocalPage(nextPage);
    } finally {
      if (requestGeneration === queryGenerationRef.current) {
        isLoadingNextPageRef.current = false;
        setIsLoadingNextPage(false);
      }
    }
  }, [catalogQueryVariables, fetchMore, hasNextPage, loading, localPage]);

  const isFirstPageLoading = loading && localPage === 1 && !isLoadingNextPage;
  const semanticError =
    semanticSearch && error
      ? (error.graphQLErrors?.[0]?.message ?? error.message ?? "AI search failed")
      : null;

  return {
    classes,
    loading: isFirstPageLoading,
    totalCount,
    page: localPage,
    pageSize: DEFAULT_PAGE_SIZE,
    hasNextPage,
    loadNextPage,
    isLoadingNextPage,
    filterOptions: filterOptionsData?.catalogFilterOptions ?? null,
    semanticError,
  };
}
