import { UserType } from "@repo/common/models";

import { UserModule } from "./generated-types/module-types";

export const formatUser = (user: UserType): UserModule.User => {
  const legacy = user as UserType & { isNewTransfer?: boolean };
  return {
    _id: user._id as unknown as string,
    email: user.email,
    staff: user.staff,
    name: user.name,
    student: user.email.endsWith("@berkeley.edu"),
    majors: user.majors ? user.majors : [],
    minors: user.minors ? user.minors : [],
    studentLevel: (user.studentLevel as UserModule.StudentLevel | null) ?? null,
    colleges: user.colleges ? user.colleges : [],
    termsInAttendance: user.termsInAttendance ?? null,
    // Prefer isTransfer; fall back to legacy isNewTransfer on older docs.
    isTransfer: Boolean(legacy.isTransfer ?? legacy.isNewTransfer),
    reservedSeatGroups: user.reservedSeatGroups ? user.reservedSeatGroups : [],
  };
};
