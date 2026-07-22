import mongoose, { Document, InferSchemaType, Schema } from "mongoose";

export const userSchema = new Schema(
  {
    googleId: {
      type: String,
      trim: true,
      required: true,
      immutable: true,
      select: false,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    staff: {
      type: Boolean,
      required: true,
      default: false,
    },
    majors: {
      type: [String],
      required: false,
      default: [],
    },
    minors: {
      type: [String],
      trim: true,
      required: false,
      default: [],
    },
    studentLevel: {
      type: String,
      enum: {
        values: ["UNDERGRAD", "MASTERS", "PHD", "GRADUATE", null],
        message: "{VALUE} is not a valid student level",
      },
      required: false,
      default: null,
    },
    colleges: {
      type: [String],
      required: false,
      default: [],
    },
    termsInAttendance: {
      type: Number,
      required: false,
      default: null,
      min: 0,
    },
    isTransfer: {
      type: Boolean,
      required: false,
      default: false,
    },
    reservedSeatGroups: {
      type: [String],
      required: false,
      default: [],
    },
    dormRoomLayouts: {
      type: Map,
      of: String,
      required: true,
      default: {},
      select: false,
    },
    /**
     * True once this person has authenticated on the EECSTime deployment.
     * Berkeleytime backup merges must not overwrite these users (or their
     * schedules / GradTrak / ratings / reviews).
     */
    eecsTimeUser: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: new Date(0), // Unix epoch (1970-01-01) indicates legacy user who hasn't visited since tracking started
    },
    activityScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

// for login
userSchema.index({ email: 1 }, { unique: true });

// for active user queries
userSchema.index({ activityScore: 1 });

export const UserModel = mongoose.model("users", userSchema);

export type UserType = Document & InferSchemaType<typeof userSchema>;
