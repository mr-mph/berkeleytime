/** Dispatched when denormalized catalog enrollment may have changed. */
export const CATALOG_ENROLLMENT_REFRESH_EVENT = "bt:catalog-enrollment-refresh";

export function requestCatalogEnrollmentRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CATALOG_ENROLLMENT_REFRESH_EVENT));
}
