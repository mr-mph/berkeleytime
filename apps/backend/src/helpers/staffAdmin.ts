import { GraphQLError } from "graphql";

import { StaffMemberModel } from "@repo/common/models";
import { config } from "../../../../packages/common/src/utils/config";

export interface StaffAuthContext {
  user?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id?: any;
    staff?: boolean;
    isAuthenticated?: boolean;
  } | null;
}

/** Staff admin (dashboard, outreach, analytics, AG CMS) is off unless explicitly enabled. */
export const isStaffAdminEnabled = (): boolean => config.staffAdminEnabled;

export const assertStaffAdminEnabled = (): void => {
  if (!isStaffAdminEnabled()) {
    throw new GraphQLError("Staff admin features are disabled", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

/**
 * Verifies staff admin is enabled and the caller is an authenticated staff member.
 */
export const requireStaffAdmin = async (context: StaffAuthContext) => {
  assertStaffAdminEnabled();

  if (!context.user?._id) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  const staffMember = await StaffMemberModel.findOne({
    userId: context.user._id,
  }).lean();

  if (!staffMember) {
    throw new GraphQLError("Only staff members can perform this action", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return staffMember;
};

/** For curated-classes / AG which check User.staff instead of StaffMember. */
export const assertCuratedClassStaff = (context: StaffAuthContext): void => {
  assertStaffAdminEnabled();
  if (!context.user?.staff) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};
