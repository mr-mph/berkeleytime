import { createWriteStream } from "node:fs";
import { access, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { model, Schema } from "mongoose";

import { Config } from "../shared/config";
import {
  syncCatalogEnrollmentForCurrentTerm,
  updateCatalogRmpRatings,
} from "../lib/catalog-denormalize";
import { syncCrosslistingEnrollmentFanout } from "./crosslisting-enrollment-fanout";

const PUBLIC_BACKUP_BASE =
  "https://backups.berkeleytime.com/public/daily/prod_public_backup";

/** Official public backups are published daily at 05:00 America/Los_Angeles. */
const BACKUP_HOUR_PT = 5;

/**
 * Never touch local user / private state, even if a future public dump includes them.
 * mongorestore without --drop keeps existing docs on _id conflict (backup is older).
 *
 * Also never overwrite locally-owned enrichment datasets that we pull ourselves:
 * - rmp_professors: Rate My Professors cache
 * - articulations: ASSIST.org CCC→Berkeley articulations
 */
const NS_EXCLUDE = [
  "bt.users",
  "bt.schedules",
  "bt.collections",
  "bt.pods",
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
  "rmp_professors",
  "articulations",
] as const;

const SYNC_STATUS_KEY = "public-backup-sync";

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

/** YYYYMMDD in America/Los_Angeles for "now minus 6 hours" (matches docs bootstrap). */
const backupDateKey = (now = new Date()): string => {
  // Subtract 6h so pre-5am PT still targets yesterday's published file.
  const shifted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(shifted);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}${month}${day}`;
};

const backupUrlForDate = (dateKey: string) =>
  `${PUBLIC_BACKUP_BASE}-${dateKey}.gz`;

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
};

/**
 * Merge the public dump into local Mongo.
 * - No --drop / no --upsert: existing local docs (newer) are kept on _id conflict.
 * - Missing docs from the backup are inserted.
 * - User/private collections are excluded.
 */
const mergePublicBackup = async (
  archivePath: string,
  mongoUri: string,
  log: Config["log"]
) => {
  const args = [
    `--uri=${mongoUri}`,
    "--gzip",
    `--archive=${archivePath}`,
    "--nsInclude=bt.*",
    ...NS_EXCLUDE.flatMap((ns) => ["--nsExclude", ns]),
  ];
  log.info(
    "Merging public backup into local DB (keep existing docs; insert missing only)"
  );
  const result = await runCommand("mongorestore", args, log);
  // Duplicate-key skips on existing _ids are expected and may yield a non-zero
  // exit depending on mongorestore version; treat "documents restored" as success.
  if (result.code !== 0) {
    const restored = /document\(s\) restored successfully/.test(result.stderr);
    if (!restored) {
      throw new Error(
        `mongorestore exited with code ${result.code}: ${result.stderr.trim()}`
      );
    }
    log.warn(
      `mongorestore exited ${result.code} but restored documents (likely duplicate-key skips on newer local data)`
    );
  }
};

/**
 * When classes.berkeley.edu scraping is disabled, merge berkeleytime.com's
 * public daily backup (published ~05:00 America/Los_Angeles) into local Mongo.
 */
export const syncEnrollmentFromPublicBackup = async (config: Config) => {
  const { log } = config;
  const dateKey = backupDateKey();
  const url = backupUrlForDate(dateKey);

  log.info(
    `Checking for public backup ${dateKey} (daily @ ${BACKUP_HOUR_PT}:00 PT)`
  );

  const head = await headBackup(url);
  if (!head.ok) {
    log.info(`Backup not available yet: ${url}`);
    return;
  }

  const status =
    (await PublicBackupSyncStatusModel.findOne({
      key: SYNC_STATUS_KEY,
    }).lean()) ?? null;

  if (
    status?.lastBackupDate === dateKey &&
    status.lastEtag &&
    head.etag &&
    status.lastEtag === head.etag
  ) {
    log.info(`Already merged backup ${dateKey} (etag match); skipping`);
    return;
  }

  await ensureMongorestore(log);

  const archivePath = path.join("/tmp", `prod_public_backup-${dateKey}.gz`);
  const snapshotDir = path.join("/tmp", `bt-local-owned-${dateKey}`);
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

    // Recompute denormalized RMP on catalog_classes from our local professor cache
    // (backup catalog rows often lack / stale rmp* fields).
    log.info("Re-applying RMP averages onto catalog_classes from local cache");
    await updateCatalogRmpRatings(log);

    await syncCrosslistingEnrollmentFanout(config);
    await syncCatalogEnrollmentForCurrentTerm(log);
    await invalidateBackendCaches(config.BACKEND_URL, log);

    await PublicBackupSyncStatusModel.findOneAndUpdate(
      { key: SYNC_STATUS_KEY },
      {
        $set: {
          lastBackupDate: dateKey,
          lastEtag: head.etag,
          lastRestoredAt: new Date(),
          message: `Merged public backup ${dateKey}; preserved users + rmp_professors + articulations; synced catalog enrollment + RMP`,
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
