import { useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { requestCatalogEnrollmentRefresh } from "@/lib/catalogEnrollmentRefresh";

import styles from "./EnrollmentScrapeStatusBar.module.scss";

export type UcbEnrollmentScrapeStatus = {
  key: string;
  state: "idle" | "running" | "completed" | "failed";
  year?: number | null;
  semester?: string | null;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentLabel?: string | null;
  message?: string | null;
  startedAt?: string | null;
  updatedAt?: string | null;
  finishedAt?: string | null;
};

const POLL_MS = 2000;
const COMPLETED_VISIBLE_MS = 2 * 60 * 1000;
/** Align with datapuller's catalog flush cadence. */
const CATALOG_REFRESH_EVERY_PROCESSED = 25;

async function fetchScrapeStatus(): Promise<UcbEnrollmentScrapeStatus | null> {
  try {
    const response = await fetch("/api/cache/ucb-enrollment-scrape-status", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as UcbEnrollmentScrapeStatus;
  } catch {
    return null;
  }
}

function shouldShow(status: UcbEnrollmentScrapeStatus | null): boolean {
  if (!status) return false;
  if (status.state === "running") return true;
  if (status.state === "failed") return true;
  if (status.state === "completed") {
    const finishedAt = status.finishedAt
      ? Date.parse(status.finishedAt)
      : NaN;
    if (Number.isNaN(finishedAt)) return true;
    return Date.now() - finishedAt < COMPLETED_VISIBLE_MS;
  }
  return false;
}

export default function EnrollmentScrapeStatusBar() {
  const [status, setStatus] = useState<UcbEnrollmentScrapeStatus | null>(null);
  const lastCatalogRefetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const next = await fetchScrapeStatus();
      if (cancelled) return;

      setStatus(next);

      if (!next || next.year == null || !next.semester) return;
      if (next.state !== "running" && next.state !== "completed") return;

      const refreshBucket =
        next.state === "completed"
          ? "completed"
          : Math.floor(next.processed / CATALOG_REFRESH_EVERY_PROCESSED);
      if (refreshBucket === 0) return;

      const refetchKey = `${next.year}:${next.semester}:${refreshBucket}`;
      if (lastCatalogRefetchKeyRef.current === refetchKey) return;
      lastCatalogRefetchKeyRef.current = refetchKey;

      // Reload all currently loaded catalog pages (not just Apollo page-1 cache).
      requestCatalogEnrollmentRefresh();
    };

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!shouldShow(status) || !status) return null;

  const total = Math.max(status.total, 0);
  const processed = Math.min(Math.max(status.processed, 0), total || status.processed);
  const percent =
    total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  const termLabel =
    status.year != null && status.semester
      ? `${status.semester} ${status.year}`
      : null;

  const stateLabel =
    status.state === "running"
      ? "Syncing enrollment"
      : status.state === "completed"
        ? "Enrollment synced"
        : status.state === "failed"
          ? "Enrollment sync failed"
          : "Enrollment sync";

  return (
    <div
      className={classNames(styles.root, {
        [styles.running]: status.state === "running",
        [styles.completed]: status.state === "completed",
        [styles.failed]: status.state === "failed",
      })}
      role="status"
      aria-live="polite"
    >
      <div className={styles.row}>
        <span className={styles.label}>{stateLabel}</span>
        {termLabel && <span className={styles.meta}>{termLabel}</span>}
        {total > 0 && (
          <span className={styles.meta}>
            {processed.toLocaleString()} / {total.toLocaleString()} ({percent}%)
          </span>
        )}
        {status.currentLabel && status.state === "running" && (
          <span className={styles.current}>{status.currentLabel}</span>
        )}
        {status.state === "failed" && status.message && (
          <span className={styles.current}>{status.message}</span>
        )}
      </div>
      <div className={styles.track} aria-hidden>
        <div
          className={styles.fill}
          style={{
            width:
              status.state === "completed"
                ? "100%"
                : total > 0
                  ? `${percent}%`
                  : status.state === "running"
                    ? "8%"
                    : "0%",
          }}
        />
      </div>
    </div>
  );
}
