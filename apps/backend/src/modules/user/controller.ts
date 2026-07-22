import { GraphQLError } from "graphql";

import {
  AggregatedMetricsModel,
  CollectionModel,
  RatingModel,
  ScheduleModel,
  UserModel,
} from "@repo/common/models";

import { DormRoomId, UpdateUserInput } from "../../generated-types/graphql";
import { RequestContext } from "../../types/request-context";
import { formatUser } from "./formatter";

const MAX_DORM_LAYOUT_LENGTH = 32_768;
const DORM_ROOM_KEYS: Record<DormRoomId, string> = {
  BLACKWELL: "blackwell",
  UNIT_TRIPLE: "unit-triple",
  UNIT_DOUBLE: "unit-double",
};

const validateDormRoomLayout = (layout: string) => {
  if (
    layout.length > MAX_DORM_LAYOUT_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(layout)
  ) {
    throw new GraphQLError("Invalid dorm room layout", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(layout, "base64url").toString("utf8")
    );
    if (
      !parsed ||
      !Number.isInteger(parsed.v) ||
      parsed.v < 1 ||
      parsed.v > 4 ||
      !Array.isArray(parsed.i) ||
      parsed.i.length > 180
    ) {
      throw new Error("Unsupported layout payload");
    }
  } catch {
    throw new GraphQLError("Invalid dorm room layout", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
};

export const getDormRoomLayout = async (
  context: RequestContext,
  roomId: DormRoomId
) => {
  if (!context.user?._id) throw new Error("Unauthorized");

  const user = await UserModel.findById(context.user._id).select(
    "+dormRoomLayouts"
  );
  if (!user) throw new Error("Not found");

  return user.dormRoomLayouts?.get(DORM_ROOM_KEYS[roomId]) ?? null;
};

export const saveDormRoomLayout = async (
  context: RequestContext,
  roomId: DormRoomId,
  layout: string | null | undefined
) => {
  if (!context.user?._id) throw new Error("Unauthorized");

  const roomKey = DORM_ROOM_KEYS[roomId];
  if (layout !== null && layout !== undefined) validateDormRoomLayout(layout);

  const update = layout
    ? { $set: { [`dormRoomLayouts.${roomKey}`]: layout } }
    : { $unset: { [`dormRoomLayouts.${roomKey}`]: 1 } };
  const result = await UserModel.updateOne({ _id: context.user._id }, update);
  if (!result.matchedCount) throw new Error("Not found");

  return layout ?? null;
};

export const getUser = async (context: RequestContext) => {
  if (!context.user?._id) throw new Error("Unauthorized");
  const userId = context.user._id;

  const user = await UserModel.findById(userId);

  if (!user) throw new Error("Not found");

  return formatUser(user);
};

export const updateUser = async (
  context: RequestContext,
  user: UpdateUserInput
) => {
  if (!context.user?._id) throw new Error("Unauthorized");
  const userId = context.user._id;

  // Explicit $set so nullables (e.g. cleared termsInAttendance) persist.
  const $set: Record<string, unknown> = {};
  if (user.majors !== undefined && user.majors !== null)
    $set.majors = user.majors;
  if (user.minors !== undefined && user.minors !== null)
    $set.minors = user.minors;
  if (user.studentLevel !== undefined) $set.studentLevel = user.studentLevel;
  if (user.colleges !== undefined && user.colleges !== null) {
    $set.colleges = user.colleges;
  }
  if (user.termsInAttendance !== undefined) {
    $set.termsInAttendance = user.termsInAttendance;
  }
  if (user.isTransfer !== undefined && user.isTransfer !== null) {
    $set.isTransfer = user.isTransfer;
  }
  if (
    user.reservedSeatGroups !== undefined &&
    user.reservedSeatGroups !== null
  ) {
    $set.reservedSeatGroups = user.reservedSeatGroups;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set },
    { new: true, runValidators: true }
  );

  if (!updatedUser) throw new Error("Invalid");

  return formatUser(updatedUser);
};

export const deleteAccount = async (context: RequestContext) => {
  if (!context.user?._id) throw new Error("Unauthorized");
  const userId = context.user._id;

  // Delete all collections
  await CollectionModel.deleteMany({ createdBy: userId });

  // Delete all schedules
  await ScheduleModel.deleteMany({ createdBy: userId });

  // Find all ratings for this user
  const userRatings = await RatingModel.find({ createdBy: userId });

  // Update aggregated metrics for each rating before deletion
  for (const rating of userRatings) {
    await AggregatedMetricsModel.findOneAndUpdate(
      {
        classId: rating.classId,
        metricName: rating.metricName,
        categoryValue: rating.value,
      },
      { $inc: { categoryCount: -1 } }
    );
  }

  // Delete all ratings
  await RatingModel.deleteMany({ createdBy: userId });

  // Delete the user record
  await UserModel.findByIdAndDelete(userId);

  return true;
};
