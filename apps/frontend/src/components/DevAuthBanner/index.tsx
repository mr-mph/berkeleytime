import { useEffect, useState } from "react";

import { NavArrowDown, NavArrowUp, RefreshDouble, User } from "iconoir-react";

import { DropdownMenu } from "@repo/theme";

import useUser from "@/hooks/useUser";
import {
  DEFAULT_DEV_USER_EMAIL,
  DEV_AUTH_LOGIN_ROUTE,
  DEV_AUTH_USERS_ROUTE,
  DevUser,
  clearStoredDevUserId,
  getStoredDevUserId,
  isDevAuthCollapsed,
  isDevAuthUiEnabled,
  setDevAuthCollapsed,
  setStoredDevUserId,
} from "@/utils/devAuth";

import styles from "./DevAuthBanner.module.scss";

export default function DevAuthBanner() {
  const { user, loading: userLoading } = useUser();
  const [devUsers, setDevUsers] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(() => isDevAuthCollapsed());

  useEffect(() => {
    if (!isDevAuthUiEnabled()) {
      setLoading(false);
      return;
    }

    fetch(DEV_AUTH_USERS_ROUTE)
      .then((res) => {
        if (!res.ok) throw new Error("dev auth disabled");
        return res.json();
      })
      .then((users) => {
        setDevUsers(users);
        setLoading(false);
      })
      .catch(() => {
        setDevUsers([]);
        setLoading(false);
      });
  }, []);

  const selectUser = (userId: string) => {
    setStoredDevUserId(userId);
    const redirectUri = window.location.pathname + window.location.search;
    window.location.href = `${DEV_AUTH_LOGIN_ROUTE}?userId=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  // Auto-login as the stored dev user (or the default seed account) so
  // logged-in features like ratings work without picking a user first.
  useEffect(() => {
    if (loading || userLoading || user || devUsers.length === 0) return;
    // A failed dev login redirects back with devAuthError; don't loop.
    if (new URLSearchParams(window.location.search).has("devAuthError")) return;

    const storedId = getStoredDevUserId();
    const defaultUser =
      devUsers.find((u) => u._id === storedId) ??
      devUsers.find((u) => u.email === DEFAULT_DEV_USER_EMAIL) ??
      devUsers[0];

    selectUser(defaultUser._id);
  }, [loading, userLoading, user, devUsers]);

  const clearSelection = () => {
    clearStoredDevUserId();
    window.location.href = `/api/logout?redirect_uri=${encodeURIComponent(window.location.pathname)}`;
  };

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    setDevAuthCollapsed(newCollapsed);
  };

  const filteredUsers = [...devUsers]
    .filter(
      (u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
    )
    // Pin local seed accounts above restored prod users in the switcher.
    .sort((a, b) => {
      const aLocal = a.email.endsWith("@berkeleytime.local") ? 0 : 1;
      const bLocal = b.email.endsWith("@berkeleytime.local") ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
      return a.name.localeCompare(b.name);
    });

  if (collapsed) {
    return (
      <div className={styles.collapsed}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={toggleCollapsed}
          aria-label="Expand dev auth banner"
        >
          <NavArrowDown width={12} height={12} />
        </button>
      </div>
    );
  }

  if (loading || userLoading) {
    return (
      <>
        <div className={styles.root}>
          <span className={styles.badge}>DEV</span>
          <span className={styles.text}>Loading...</span>
          <button
            type="button"
            className={styles.minimizeButton}
            onClick={toggleCollapsed}
            aria-label="Minimize dev auth banner"
          >
            <NavArrowUp width={16} height={16} />
          </button>
        </div>
        <div className={styles.spacer} />
      </>
    );
  }

  // Backend DISABLE_DEV_AUTH (or missing seed users) — hide the banner.
  if (devUsers.length === 0 && !user) {
    return null;
  }

  return (
    <>
      <div className={styles.root}>
        <span className={styles.badge}>DEV</span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={styles.trigger}>
              <User width={14} height={14} />
              <span>{user ? user.email : "Select User"}</span>
              <NavArrowDown width={14} height={14} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            align="start"
            sideOffset={5}
            className={styles.dropdown}
          >
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className={styles.searchInput}
              />
            </div>

            <DropdownMenu.Separator />

            <div className={styles.userList}>
              {filteredUsers.slice(0, 20).map((devUser) => (
                <DropdownMenu.Item
                  key={devUser._id}
                  onSelect={() => selectUser(devUser._id)}
                  className={styles.userItem}
                >
                  <span className={styles.userName}>{devUser.name}</span>
                  <span className={styles.userEmail}>{devUser.email}</span>
                  {devUser.staff && (
                    <span className={styles.staffBadge}>Staff</span>
                  )}
                </DropdownMenu.Item>
              ))}
              {filteredUsers.length === 0 && (
                <div className={styles.noResults}>No users found</div>
              )}
            </div>

            {user && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onSelect={clearSelection}
                  className={styles.switchUser}
                >
                  <RefreshDouble width={14} height={14} />
                  <span>Sign Out / Switch User</span>
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <button
          type="button"
          className={styles.minimizeButton}
          onClick={toggleCollapsed}
          aria-label="Minimize dev auth banner"
        >
          <NavArrowUp width={16} height={16} />
        </button>
      </div>
      <div className={styles.spacer} />
    </>
  );
}
