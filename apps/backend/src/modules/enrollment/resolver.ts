import type { RedisClientType } from "redis";

import { EnrollmentTimeframeModel } from "@repo/common/models";

import { getEnrollment, refreshClassEnrollment } from "./controller";
import { EnrollmentModule } from "./generated-types/module-types";

type EnrollmentContext = {
  redis: RedisClientType;
};

const resolvers: EnrollmentModule.Resolvers = {
  Query: {
    enrollment: async (
      _,
      { year, semester, sessionId, subject, courseNumber, sectionNumber }
    ) => {
      return await getEnrollment(
        year,
        semester,
        sessionId,
        subject,
        courseNumber,
        sectionNumber
      );
    },
    enrollmentTimeframes: async (_, { year, semester }) => {
      const timeframes = await EnrollmentTimeframeModel.find({
        year,
        semester,
      }).lean();

      return timeframes.map((tf) => ({
        phase: tf.phase ?? null,
        isAdjustment: tf.isAdjustment,
        group: tf.group,
        startDate: tf.startDate.toISOString(),
        endDate: tf.endDate?.toISOString() ?? null,
        startEventSummary: tf.startEventSummary ?? null,
      }));
    },
  },

  Mutation: {
    refreshClassEnrollment: async (
      _,
      { year, semester, sessionId, subject, courseNumber, number },
      context: EnrollmentContext
    ) => {
      return await refreshClassEnrollment(
        year,
        semester,
        sessionId ?? null,
        subject,
        courseNumber,
        number,
        context.redis
      );
    },
  },

  EnrollmentSingular: {
    activeReservedMaxCount: (parent) => {
      const seatReservations = parent.seatReservationCount ?? [];
      return seatReservations.reduce((sum, reservation) => {
        const isValid = reservation.isValid ?? false;
        const maxEnroll = reservation.maxEnroll ?? 0;
        return sum + (isValid ? maxEnroll : 0);
      }, 0);
    },
  },
};

export default resolvers;
