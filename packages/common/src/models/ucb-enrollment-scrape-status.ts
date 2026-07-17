import { Document, Model, Schema, model } from "mongoose";

export type UcbEnrollmentScrapeState =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface IUcbEnrollmentScrapeStatus {
  key: string;
  state: UcbEnrollmentScrapeState;
  year?: number;
  semester?: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentLabel?: string | null;
  message?: string | null;
  startedAt?: Date | null;
  updatedAt?: Date;
  finishedAt?: Date | null;
}

export interface IUcbEnrollmentScrapeStatusDocument
  extends IUcbEnrollmentScrapeStatus,
    Document {}

export const UCB_ENROLLMENT_SCRAPE_STATUS_KEY = "ucb-catalog-enrollments";

const ucbEnrollmentScrapeStatusSchema =
  new Schema<IUcbEnrollmentScrapeStatus>(
    {
      key: { type: String, required: true, unique: true },
      state: {
        type: String,
        required: true,
        enum: ["idle", "running", "completed", "failed"],
        default: "idle",
      },
      year: { type: Number },
      semester: { type: String },
      total: { type: Number, required: true, default: 0 },
      processed: { type: Number, required: true, default: 0 },
      succeeded: { type: Number, required: true, default: 0 },
      failed: { type: Number, required: true, default: 0 },
      skipped: { type: Number, required: true, default: 0 },
      currentLabel: { type: String, default: null },
      message: { type: String, default: null },
      startedAt: { type: Date, default: null },
      finishedAt: { type: Date, default: null },
    },
    { timestamps: { createdAt: false, updatedAt: true } }
  );

export const UcbEnrollmentScrapeStatusModel: Model<IUcbEnrollmentScrapeStatus> =
  model<IUcbEnrollmentScrapeStatus>(
    "ucb_enrollment_scrape_status",
    ucbEnrollmentScrapeStatusSchema
  );
