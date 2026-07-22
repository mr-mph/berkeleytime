/**
 * EECSTime vs Berkeleytime user-data handling for backup merges.
 *
 * Users who have logged into EECSTime (`eecsTimeUser: true`) keep their local
 * user row and related schedules / GradTrak / ratings / reviews across merges.
 * Everyone else is eligible to be replaced by Berkeleytime backup data.
 *
 * Public daily dumps include `plans`, `ratings`, and `reviews` (not `users` /
 * `schedules`). GradTrak therefore migrates by `userEmail` without needing a
 * private dump.
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { UserModel } from "@repo/common/models";
import mongoose from "mongoose";

import { Config } from "../shared/config";

/** Collections that carry per-user app data (migrate from BT unless EECSTime-protected). */
export const USER_DATA_COLLECTIONS = [
  "users",
  "schedules",
  "collections",
  "ratings",
  "reviews",
  "plans",
  "planterms",
] as const;

type Log = Config["log"];

const runCommand = (
  command: string,
  args: string[],
  log: Log
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

export type EecsTimeProtection = {
  userIds: string[];
  emails: string[];
  archives: string[];
};

/** Snapshot EECSTime users + their related docs so a BT restore cannot clobber them. */
export const snapshotEecsTimeProtectedData = async (
  mongoUri: string,
  snapshotDir: string,
  log: Log
): Promise<EecsTimeProtection> => {
  const protectedUsers = await UserModel.find({ eecsTimeUser: true })
    .select({ _id: 1, email: 1 })
    .lean();

  const userIds = protectedUsers.map((u) => String(u._id));
  const emails = protectedUsers
    .map((u) => u.email)
    .filter((email): email is string => Boolean(email));

  log.info(
    `Protecting ${userIds.length} EECSTime user(s) across backup merge: ${emails.join(", ") || "(none)"}`
  );

  if (userIds.length === 0) {
    return { userIds, emails, archives: [] };
  }

  const archives: string[] = [];

  const dump = async (collection: string, query: object, label: string) => {
    const archivePath = path.join(snapshotDir, `eecstime-${collection}.gz`);
    log.info(`Snapshotting EECSTime-protected ${label}`);
    const result = await runCommand(
      "mongodump",
      [
        `--uri=${mongoToolsUri(mongoUri)}`,
        "--db=bt",
        `--collection=${collection}`,
        `--query=${JSON.stringify(query)}`,
        `--archive=${archivePath}`,
        "--gzip",
      ],
      log
    );
    if (result.code !== 0) {
      log.warn(
        `Skipping EECSTime snapshot for bt.${collection}: ${result.stderr.trim() || `exit ${result.code}`}`
      );
      return;
    }
    archives.push(archivePath);
  };

  await dump("users", { eecsTimeUser: true }, "users");
  await dump("schedules", { createdBy: { $in: userIds } }, "schedules");
  await dump("collections", { createdBy: { $in: userIds } }, "collections");
  await dump("ratings", { createdBy: { $in: userIds } }, "ratings");
  await dump("reviews", { createdBy: { $in: userIds } }, "reviews");
  await dump("plans", { userEmail: { $in: emails } }, "plans (GradTrak)");
  await dump("planterms", { userEmail: { $in: emails } }, "planterms");

  return { userIds, emails, archives };
};

/** mongorestore/mongodump treat /db in the URI as --db; strip it for --archive. */
const mongoToolsUri = (uri: string): string =>
  uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/]+)\/[^?]*/, "$1/");

/**
 * After a backup restore of user-data collections, remove BT copies of protected
 * identities and re-insert the EECSTime snapshots (same _ids).
 *
 * Backup rows for the same email may use different `_id`s, so we clear related
 * docs for both the local EECSTime ids and any backup user ids that share those
 * emails — otherwise orphan BT schedules/reviews would linger.
 */
export const reapplyEecsTimeProtectedData = async (
  mongoUri: string,
  protection: EecsTimeProtection,
  log: Log
) => {
  if (protection.archives.length === 0) {
    log.info("No EECSTime-protected snapshots to re-apply");
    return;
  }

  const db = UserModel.db ?? mongoose.connection.db;
  if (!db) {
    throw new Error("Mongo connection not ready for EECSTime re-apply");
  }

  // Backup may have re-created the same emails under new ObjectIds.
  const collidingUsers =
    protection.emails.length > 0
      ? await UserModel.find({ email: { $in: protection.emails } })
          .select({ _id: 1 })
          .lean()
      : [];
  const collidingIds = collidingUsers.map((u) => String(u._id));
  const createdByIds = [
    ...new Set([...protection.userIds, ...collidingIds]),
  ];

  if (createdByIds.length > 0) {
    await db.collection("schedules").deleteMany({
      createdBy: { $in: createdByIds },
    });
    await db.collection("collections").deleteMany({
      createdBy: { $in: createdByIds },
    });
    await db.collection("ratings").deleteMany({
      createdBy: { $in: createdByIds },
    });
    await db.collection("reviews").deleteMany({
      createdBy: { $in: createdByIds },
    });
  }
  if (protection.emails.length > 0) {
    await db.collection("plans").deleteMany({
      userEmail: { $in: protection.emails },
    });
    await db.collection("planterms").deleteMany({
      userEmail: { $in: protection.emails },
    });
    await UserModel.deleteMany({ email: { $in: protection.emails } });
  }

  for (const archivePath of protection.archives) {
    log.info(`Re-applying EECSTime-protected snapshot ${archivePath}`);
    const result = await runCommand(
      "mongorestore",
      [
        `--uri=${mongoToolsUri(mongoUri)}`,
        "--gzip",
        `--archive=${archivePath}`,
      ],
      log
    );
    if (result.code !== 0) {
      throw new Error(
        `Failed to restore EECSTime snapshot ${archivePath}: ${result.stderr.trim()}`
      );
    }
  }

  log.info("EECSTime-protected user data re-applied after backup merge");
};
