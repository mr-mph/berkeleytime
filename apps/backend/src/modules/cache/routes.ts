import { type Application, type Request, type Response } from "express";
import { RedisClientType } from "redis";

import {
  UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
  UcbEnrollmentScrapeStatusModel,
} from "@repo/common/models";

import { invalidateApolloResponseCache } from "../../utils/cache";
import { invalidateCatalogCache } from "../catalog/catalog-cache";
import { flushViewCounts } from "../class/controller";

export default (app: Application, redis: RedisClientType) => {
  app.post(
    "/cache/flush-view-counts",
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const result = await flushViewCounts(redis);
        res.status(200).json(result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("[Cache API] Flush error:", error);
        res.status(500).json({
          error: "Internal server error",
          message: error.message,
        });
      }
    }
  );

  app.post(
    "/cache/invalidate-catalog",
    async (_req: Request, res: Response): Promise<void> => {
      try {
        invalidateCatalogCache();
        const deleted = await invalidateApolloResponseCache(redis);
        res.status(200).json({
          ok: true,
          apolloCacheKeysDeleted: deleted,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("[Cache API] Invalidate catalog error:", error);
        res.status(500).json({
          error: "Internal server error",
          message: error.message,
        });
      }
    }
  );

  app.get(
    "/cache/ucb-enrollment-scrape-status",
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const status = await UcbEnrollmentScrapeStatusModel.findOne({
          key: UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
        }).lean();

        if (!status) {
          res.status(200).json({
            key: UCB_ENROLLMENT_SCRAPE_STATUS_KEY,
            state: "idle",
            total: 0,
            processed: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
          });
          return;
        }

        res.status(200).json({
          key: status.key,
          state: status.state,
          year: status.year ?? null,
          semester: status.semester ?? null,
          total: status.total,
          processed: status.processed,
          succeeded: status.succeeded,
          failed: status.failed,
          skipped: status.skipped,
          currentLabel: status.currentLabel ?? null,
          message: status.message ?? null,
          startedAt: status.startedAt?.toISOString() ?? null,
          updatedAt: status.updatedAt?.toISOString() ?? null,
          finishedAt: status.finishedAt?.toISOString() ?? null,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("[Cache API] Scrape status error:", error);
        res.status(500).json({
          error: "Internal server error",
          message: error.message,
        });
      }
    }
  );
};
