import { requireStaffAdmin } from "../../../helpers/staffAdmin";
import { RequestContext } from "../../../types/request-context";

/**
 * Verifies that the request is from an authenticated staff member.
 * Throws appropriate GraphQL errors if not authenticated or not a staff member.
 */
export const requireStaffAuth = async (context: RequestContext) => {
  return requireStaffAdmin(context);
};
