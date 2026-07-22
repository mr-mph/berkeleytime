/**
 * Development-only authentication utilities and constants.
 * This file is only used in development mode.
 */

// localStorage keys
export const DEV_AUTH_USER_ID_KEY = "bt.devAuth.userId";
export const DEV_AUTH_COLLAPSED_KEY = "bt.devAuth.collapsed";

// API routes
export const DEV_AUTH_LOGIN_ROUTE = "/api/dev/login";
export const DEV_AUTH_USERS_ROUTE = "/api/dev/users";

// Seed account to auto-login as when no user is signed in
export const DEFAULT_DEV_USER_EMAIL = "oski@berkeleytime.local";

// Types
export interface DevUser {
  _id: string;
  email: string;
  name: string;
  staff: boolean;
}

/**
 * Frontend gate for the yellow DevAuthBanner / auto-login.
 * Must stay in sync with backend DISABLE_DEV_AUTH (set VITE_DISABLE_DEV_AUTH too).
 */
export const isDevAuthUiEnabled = (): boolean => {
  if (!import.meta.env.DEV) return false;
  const disabled = String(
    import.meta.env.VITE_DISABLE_DEV_AUTH ?? ""
  ).toLowerCase();
  return disabled !== "true" && disabled !== "1" && disabled !== "yes";
};

// Helper functions
export const getStoredDevUserId = (): string | null => {
  return localStorage.getItem(DEV_AUTH_USER_ID_KEY);
};

export const setStoredDevUserId = (userId: string): void => {
  localStorage.setItem(DEV_AUTH_USER_ID_KEY, userId);
};

export const clearStoredDevUserId = (): void => {
  localStorage.removeItem(DEV_AUTH_USER_ID_KEY);
};

export const isDevAuthCollapsed = (): boolean => {
  const value = localStorage.getItem(DEV_AUTH_COLLAPSED_KEY);
  // Default to collapsed when unset.
  if (value === null) return true;
  return value === "true";
};

export const setDevAuthCollapsed = (collapsed: boolean): void => {
  localStorage.setItem(DEV_AUTH_COLLAPSED_KEY, String(collapsed));
};
