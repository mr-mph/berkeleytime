import { createWriteStream } from "node:fs";
import { access, open, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { model, Schema } from "mongoose";

import { Config } from "../shared/config";
import {
  syncCatalogEnrollmentForAllCatalogTerms,
  updateCatalogRmpRatings,
} from "../lib/catalog-denormalize";
import { syncCrosslistingEnrollmentFanout } from "./crosslisting-enrollment-fanout";

const PUBLIC_BACKUP_BASE =
  "https://backups.berkeleytime.com/public/daily/prod_public_backup";

/**
 * How many PT calendar days back to probe when looking for the newest public
 * backup. Cron schedules are unreliable (job start ≠ upload ready), so we
 * HEAD recent dates instead of assuming a publish hour.
 */
const BACKUP_LOOKBACK_DAYS = 3;

/**
 * Never touch local user / private state, even if a future public dump includes them.
 * Restore uses --drop on collections present in the archive (excluded / absent
 * collections are left alone). Local-owned collections are snapshotted first
 * and put back afterward.
 *
 * Also never overwrite locally-owned enrichment datasets that we pull ourselves:
 * - rmp_professors: Rate My Professors cache
 * - articulations: ASSIST.org CCC→Berkeley articulations
 *
 * Spring 2027 draft schedule is NOT excluded here (it lives in shared
 * classes/sections/terms/catalog_classes). Instead we re-seed it from
 * scripts/data/spring-2027-draft.json after every successful merge.
 */
const NS_EXCLUDE = [
  // Auth + per-user app data (must survive public/private backup merges)
  "bt.users",
  "bt.schedules",
  "bt.collections",
  "bt.pods",
  "bt.ratings",
  "bt.reviews",
  "bt.aggregatedmetrics",
  "bt.plans",
  "bt.planterms",
  "bt.planrequirements",
  "bt.selectedplanrequirements",
  "bt.labels",
  "bt.banners",
  "bt.bannerviewcounts",
  "bt.classviewcounts",
  "bt.clickevents",
  "bt.semester-roles",
  "bt.staff-members",
  "bt.targetedmessages",
  // Locally owned — not taken from berkeleytime.com backups
  "bt.rmp_professors",
  "bt.articulations",
  // Local job bookkeeping
  "bt.enrollment_backup_sync_statuses",
  "bt.ucb_enrollment_scrape_statuses",
] as const;

/**
 * Collections we snapshot before restore and always put back afterward.
 * Belt-and-suspenders with NS_EXCLUDE — even if exclude/filtering fails, these
 * local collections are restored from the pre-merge snapshot.
 */
const LOCAL_OWNED_COLLECTIONS = [
  "users",
  "schedules",
  "collections",
  "pods",
  "ratings",
  "reviews",
  "plans",
  "planterms",
  "selectedplanrequirements",
  "labels",
  "rmp_professors",
  "articulations",
] as const;

/** Idempotent draft importer mounted into the datapuller container. */
const DRAFT_SCHEDULE_IMPORT_SCRIPT =
  "/datapuller/scripts/import-draft-schedule.ts";

const SYNC_STATUS_KEY = "public-backup-sync";
const SYNC_LOCK_PATH = "/tmp/enrollment-from-public-backup.lock";

/** mongorestore treats /db in the URI as --db; strip it when using --archive. */
const mongoToolsUri = (uri: string): string =>
  uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/]+)\/[^?]*/, "$1/");

interface IPublicBackupSyncStatus {
  key: string;
  lastBackupDate?: string | null;
  lastEtag?: string | null;
  lastRestoredAt?: Date | null;
  message?: string | null;
}

const publicBackupSyncStatusSchema = new Schema<IPublicBackupSyncStatus>(
  {
    key: { type: String, required: true, unique: true },
    lastBackupDate: { type: String, default: null },
    lastEtag: { type: String, default: null },
    lastRestoredAt: { type: Date, default: null },
    message: { type: String, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const PublicBackupSyncStatusModel = model<IPublicBackupSyncStatus>(
  "enrollment_backup_sync_status",
  publicBackupSyncStatusSchema
);

/** YYYYMMDD calendar date in America/Los_Angeles for an absolute instant. */
const ptDateKey = (instant: Date): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}${month}${day}`;
};

/**
 * PT calendar days ending at "today" (most recent first). Uses noon UTC offsets
 * so DST transitions don't skip/duplicate a calendar day.
 */
const recentPtDateKeys = (
  lookbackDays = BACKUP_LOOKBACK_DAYS,
  now = new Date()
): string[] => {
  const todayKey = ptDateKey(now);
  const year = Number(todayKey.slice(0, 4));
  const month = Number(todayKey.slice(4, 6));
  const day = Number(todayKey.slice(6, 8));
  // Anchor at UTC noon on the PT calendar date, then step back whole days.
  const anchor = Date.UTC(year, month - 1, day, 12, 0, 0);
  const keys: string[] = [];
  for (let ago = 0; ago < lookbackDays; ago++) {
    keys.push(ptDateKey(new Date(anchor - ago * 24 * 60 * 60 * 1000)));
  }
  return keys;
};

const backupUrlForDate = (dateKey: string) =>
  `${PUBLIC_BACKUP_BASE}-${dateKey}.gz`;

type AvailableBackup = {
  dateKey: string;
  url: string;
  etag: string | null;
};

/** Newest public daily backup that currently exists (HEAD), or null. */
const findNewestAvailableBackup = async (
  log: Config["log"]
): Promise<AvailableBackup | null> => {
  for (const dateKey of recentPtDateKeys()) {
    const url = backupUrlForDate(dateKey);
    const head = await headBackup(url);
    if (head.ok) {
      log.info(`Found public backup ${dateKey}`);
      return { dateKey, url, etag: head.etag };
    }
    log.info(`Backup not available yet: ${url}`);
  }
  return null;
};

const runCommand = (
  command: string,
  args: string[],
  log: Config["log"]
): Promise<{ code: number; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) log.info(trimmed);
      }
    });
    child.stdout.on("data", (chunk: Buffer) => {
      const line = chunk.toString().trim();
      if (line) log.info(line);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stderr });
    });
  });

const ensureMongorestore = async (log: Config["log"]) => {
  const version = await runCommand("mongorestore", ["--version"], log);
  if (version.code === 0) {
    const dump = await runCommand("mongodump", ["--version"], log);
    if (dump.code === 0) return;
  }
  log.info("mongo database tools missing; installing mongodb-tools via apk...");
  const install = await runCommand(
    "apk",
    ["add", "--no-cache", "mongodb-tools"],
    log
  );
  if (install.code !== 0) {
    throw new Error(`Failed to install mongodb-tools: ${install.stderr}`);
  }
};

const snapshotLocalOwnedCollections = async (
  mongoUri: string,
  snapshotDir: string,
  log: Config["log"]
): Promise<string[]> => {
  const archives: string[] = [];
  for (const collection of LOCAL_OWNED_COLLECTIONS) {
    const archivePath = path.join(snapshotDir, `local-${collection}.gz`);
    log.info(`Snapshotting local collection bt.${collection}`);
    const result = await runCommand(
      "mongodump",
      [
        `--uri=${mongoUri}`,
        "--db=bt",
        `--collection=${collection}`,
        `--archive=${archivePath}`,
        "--gzip",
      ],
      log
    );
    if (result.code !== 0) {
      log.warn(
        `Skipping snapshot for bt.${collection}: ${result.stderr.trim() || `exit ${result.code}`}`
      );
      continue;
    }
    archives.push(archivePath);
  }
  return archives;
};

const restoreLocalOwnedSnapshots = async (
  mongoUri: string,
  archives: string[],
  log: Config["log"]
) => {
  for (const archivePath of archives) {
    log.info(`Restoring local-owned snapshot ${archivePath}`);
    const result = await runCommand(
      "mongorestore",
      [
        `--uri=${mongoUri}`,
        "--gzip",
        `--archive=${archivePath}`,
        "--drop",
      ],
      log
    );
    if (result.code !== 0) {
      throw new Error(
        `Failed to restore local snapshot ${archivePath}: ${result.stderr.trim()}`
      );
    }
  }
};

/**
 * Re-seed the Spring 2027 draft schedule after a public backup merge.
 * Draft rows live in shared catalog collections that --drop replaces, so
 * exclude/snapshot can't preserve them — re-import from JSON instead.
 * Soft-fails (warn) so a missing term / importer hiccup doesn't block
 * enrollment restore.
 */
const reseedDraftSchedule = async (
  mongoUri: string,
  log: Config["log"]
): Promise<boolean> => {
  try {
    await access(DRAFT_SCHEDULE_IMPORT_SCRIPT);
  } catch {
    log.warn(
      `Draft schedule importer not found at ${DRAFT_SCHEDULE_IMPORT_SCRIPT}; skipping reseed`
    );
    return false;
  }

  log.info("Re-seeding Spring 2027 draft schedule after public backup merge");
  try {
    const result = await new Promise<{ code: number; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(
          "npx",
          ["tsx", DRAFT_SCHEDULE_IMPORT_SCRIPT],
          {
            env: { ...process.env, MONGODB_URI: mongoUri },
            stdio: ["ignore", "pipe", "pipe"],
          }
        );
        let stderr = "";
        child.stderr.on("data", (chunk: Buffer) => {
          const text = chunk.toString();
          stderr += text;
          for (const line of text.split("\n")) {
            const trimmed = line.trim();
            if (trimmed) log.info(trimmed);
          }
        });
        child.stdout.on("data", (chunk: Buffer) => {
          const line = chunk.toString().trim();
          if (line) log.info(line);
        });
        child.on("error", reject);
        child.on("close", (code) => {
          resolve({ code: code ?? 1, stderr });
        });
      }
    );

    if (result.code !== 0) {
      log.warn(
        `Draft schedule reseed failed (backup merge still kept): ${result.stderr.trim() || `exit ${result.code}`}`
      );
      return false;
    }
  } catch (error) {
    log.warn(
      `Draft schedule reseed failed (backup merge still kept): ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
    return false;
  }

  log.info("Spring 2027 draft schedule reseeded");
  return true;
};

const invalidateBackendCaches = async (
  backendUrl: string,
  log: Config["log"]
) => {
  const url = new URL("/api/cache/invalidate-catalog", backendUrl);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      log.warn(
        `Cache invalidate returned HTTP ${response.status} from ${url.href}`
      );
      return;
    }
    log.info(`Invalidated backend catalog caches via ${url.href}`);
  } catch (error) {
    log.warn(
      `Failed to invalidate backend caches: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
};

const headBackup = async (
  url: string
): Promise<{ ok: boolean; etag: string | null }> => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { ok: false, etag: null };
    return { ok: true, etag: response.headers.get("etag") };
  } catch {
    return { ok: false, etag: null };
  }
};

const downloadBackup = async (
  url: string,
  destination: string,
  log: Config["log"]
) => {
  log.info(`Downloading ${url}`);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10 * 60_000),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download backup: HTTP ${response.status}`);
  }
  const body = Readable.fromWeb(
    response.body as import("node:stream/web").ReadableStream
  );
  await pipeline(body, createWriteStream(destination));
  const info = await stat(destination);
  if (info.size <= 0) {
    throw new Error(`Downloaded backup is empty: ${destination}`);
  }
  log.info(
    `Downloaded ${(info.size / (1024 * 1024)).toFixed(1)} MiB → ${destination}`
  );
};

/**
 * Replace public collections from the dump into local Mongo.
 * - --drop: drop each restored collection first (no E11000 spam; full refresh).
 * - Collections not in the archive / nsExclude'd are untouched.
 * - Local-owned collections are snapshotted and restored around this call.
 */
const mergePublicBackup = async (
  archivePath: string,
  mongoUri: string,
  log: Config["log"]
) => {
  const args = [
    `--uri=${mongoToolsUri(mongoUri)}`,
    "--gzip",
    `--archive=${archivePath}`,
    "--drop",
    "--nsInclude=bt.*",
    ...NS_EXCLUDE.flatMap((ns) => ["--nsExclude", ns]),
  ];
  log.info(
    "Restoring public backup into local DB (--drop collections in archive; skip excluded namespaces)"
  );
  const result = await runCommand("mongorestore", args, log);
  if (result.code !== 0) {
    throw new Error(
      `mongorestore exited with code ${result.code}: ${result.stderr.trim()}`
    );
  }
};

/**
 * When classes.berkeley.edu scraping is disabled, merge berkeleytime.com's
 * public daily backup into local Mongo. Polled hourly — publish time varies,
 * so we HEAD recent PT dates and take the newest file that exists.
 */
export const syncEnrollmentFromPublicBackup = async (config: Config) => {
  const { log } = config;

  let lockHandle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    lockHandle = await open(SYNC_LOCK_PATH, "wx");
  } catch {
    log.info("Another public-backup sync is already running; skipping");
    return;
  }

  try {
    await syncEnrollmentFromPublicBackupLocked(config);
  } finally {
    await lockHandle.close().catch(() => undefined);
    await unlink(SYNC_LOCK_PATH).catch(() => undefined);
  }
};

const syncEnrollmentFromPublicBackupLocked = async (config: Config) => {
  const { log } = config;

  log.info(
    `Checking for newest public backup (lookback ${BACKUP_LOOKBACK_DAYS} PT days)`
  );

  const available = await findNewestAvailableBackup(log);
  if (!available) {
    log.info("No public backup available in lookback window");
    return;
  }

  const { dateKey, url, etag } = available;

  const status =
    (await PublicBackupSyncStatusModel.findOne({
      key: SYNC_STATUS_KEY,
    }).lean()) ?? null;

  if (
    status?.lastBackupDate === dateKey &&
    status.lastEtag &&
    etag &&
    status.lastEtag === etag
  ) {
    log.info(`Already merged backup ${dateKey} (etag match); skipping`);
    return;
  }

  // Prefer a strictly newer calendar date; allow same-date rematch on etag change.
  if (status?.lastBackupDate && dateKey < status.lastBackupDate) {
    log.info(
      `Newest available backup ${dateKey} is older than last merged ${status.lastBackupDate}; skipping`
    );
    return;
  }

  await ensureMongorestore(log);

  const runId = `${dateKey}-${process.pid}-${Date.now()}`;
  const archivePath = path.join("/tmp", `prod_public_backup-${runId}.gz`);
  const snapshotDir = path.join("/tmp", `bt-local-owned-${runId}`);
  try {
    await runCommand("mkdir", ["-p", snapshotDir], log);
    const localSnapshots = await snapshotLocalOwnedCollections(
      config.mongoDB.uri,
      snapshotDir,
      log
    );

    await downloadBackup(url, archivePath, log);
    await mergePublicBackup(archivePath, config.mongoDB.uri, log);

    // Guarantee users + RMP + ASSIST survive even if exclude/filtering fails.
    await restoreLocalOwnedSnapshots(
      config.mongoDB.uri,
      localSnapshots,
      log
    );

    // Draft Sp2027 lives in shared classes/sections/terms — re-seed from JSON.
    const draftReseeded = await reseedDraftSchedule(
      config.mongoDB.uri,
      log
    );

    // Recompute denormalized RMP on catalog_classes from our local professor cache
    // (backup catalog rows often lack / stale rmp* fields).
    log.info("Re-applying RMP averages onto catalog_classes from local cache");
    await updateCatalogRmpRatings(log);

    await syncCrosslistingEnrollmentFanout(config);
    await syncCatalogEnrollmentForAllCatalogTerms(log);
    await invalidateBackendCaches(config.BACKEND_URL, log);

    await PublicBackupSyncStatusModel.findOneAndUpdate(
      { key: SYNC_STATUS_KEY },
      {
        $set: {
          lastBackupDate: dateKey,
          lastEtag: etag,
          lastRestoredAt: new Date(),
          message: `Restored public backup ${dateKey} (--drop); preserved local user data + rmp_professors + articulations; ${draftReseeded ? "reseeded Spring 2027 draft; " : ""}synced catalog enrollment + RMP`,
        },
      },
      { upsert: true }
    );

    log.info(`Public backup merge for ${dateKey} complete`);
  } finally {
    try {
      await access(archivePath);
      await unlink(archivePath);
    } catch {
      // ignore cleanup errors
    }
    await runCommand("rm", ["-rf", snapshotDir], log).catch(() => undefined);
  }
};

export default { syncEnrollmentFromPublicBackup };
