import { GraphQLError } from "graphql";

import { requireStaffAdmin } from "../../helpers/staffAdmin";
import {
  TargetType,
  getClickEvents,
  getClickEventsTimeSeries,
  getClickStats,
} from "./controller";

interface RequestContext {
  user: {
    _id: string;
    isAuthenticated: boolean;
  };
}

const requireStaffMember = async (context: RequestContext) => {
  return requireStaffAdmin(context);
};

const resolvers = {
  Query: {
    clickEvents: async (
      _: unknown,
      {
        targetId,
        targetType,
        startDate,
        endDate,
        limit,
        offset,
      }: {
        targetId: string;
        targetType: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
      },
      context: RequestContext
    ) => {
      await requireStaffMember(context);

      if (
        targetType !== "banner" &&
        targetType !== "redirect" &&
        targetType !== "targeted-message"
      ) {
        throw new GraphQLError(
          "Invalid targetType. Must be 'banner', 'redirect', or 'targeted-message'",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      const result = await getClickEvents(
        targetId,
        targetType as TargetType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        limit ?? 100,
        offset ?? 0
      );

      return {
        events: result.events.map((event) => ({
          id: event._id.toString(),
          targetId: event.targetId.toString(),
          targetType: event.targetType,
          targetVersion: event.targetVersion ?? null,
          additionalInfo: event.additionalInfo ?? null,
          timestamp: event.timestamp.toISOString(),
          ipHash: event.ipHash,
          userAgent: event.userAgent,
          referrer: event.referrer,
          sessionFingerprint: event.sessionFingerprint,
        })),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
      };
    },

    clickStats: async (
      _: unknown,
      {
        targetId,
        targetType,
        startDate,
        endDate,
      }: {
        targetId: string;
        targetType: string;
        startDate?: string;
        endDate?: string;
      },
      context: RequestContext
    ) => {
      await requireStaffMember(context);

      if (
        targetType !== "banner" &&
        targetType !== "redirect" &&
        targetType !== "targeted-message"
      ) {
        throw new GraphQLError(
          "Invalid targetType. Must be 'banner', 'redirect', or 'targeted-message'",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      return getClickStats(
        targetId,
        targetType as TargetType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
    },

    clickEventsTimeSeries: async (
      _: unknown,
      {
        targetId,
        targetType,
        startDate,
        endDate,
      }: {
        targetId: string;
        targetType: string;
        startDate?: string;
        endDate?: string;
      },
      context: RequestContext
    ) => {
      await requireStaffMember(context);

      if (
        targetType !== "banner" &&
        targetType !== "redirect" &&
        targetType !== "targeted-message"
      ) {
        throw new GraphQLError(
          "Invalid targetType. Must be 'banner', 'redirect', or 'targeted-message'",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      return getClickEventsTimeSeries(
        targetId,
        targetType as TargetType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
    },
  },

  ClickEvent: {
    id: (parent: { _id?: { toString: () => string }; id?: string }) =>
      parent._id?.toString() ?? parent.id,
  },
};

export default resolvers;
