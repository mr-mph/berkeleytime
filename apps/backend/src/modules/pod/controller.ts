import { PodModel } from "@repo/common/models";

import { Semester } from "../../generated-types/graphql";
import { requireStaffAdmin } from "../../helpers/staffAdmin";

// Context interface for authenticated requests
export interface PodRequestContext {
  user: {
    _id: string;
    isAuthenticated: boolean;
  };
}

// Helper to verify the current user is a staff member
export const requireStaffMember = async (context: PodRequestContext) => {
  return requireStaffAdmin(context);
};

export interface CreatePodInput {
  name: string;
  semester: Semester;
  year: number;
}

export const getAllPods = async () => {
  const pods = await PodModel.find()
    .sort({ year: -1, semester: 1, name: 1 })
    .lean();

  return pods;
};

export const createPod = async (
  context: PodRequestContext,
  input: CreatePodInput
) => {
  // Verify caller is a staff member
  await requireStaffMember(context);

  const pod = await PodModel.create({
    name: input.name,
    semester: input.semester,
    year: input.year,
  });

  return pod.toObject();
};

export const deletePod = async (context: PodRequestContext, podId: string) => {
  // Verify caller is a staff member
  await requireStaffMember(context);

  const result = await PodModel.findByIdAndDelete(podId);
  return result !== null;
};
