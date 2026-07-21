import { UserModel } from "@repo/common/models";

import { UpdateUserInput } from "../../generated-types/graphql";
import { RequestContext } from "../../types/request-context";
import { formatUser } from "./formatter";

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
  if (user.majors !== undefined && user.majors !== null) $set.majors = user.majors;
  if (user.minors !== undefined && user.minors !== null) $set.minors = user.minors;
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
  if (user.reservedSeatGroups !== undefined && user.reservedSeatGroups !== null) {
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

  // accounts are shared on eecstime, so deletion stays disabled
  throw new Error("Nice try");
};
