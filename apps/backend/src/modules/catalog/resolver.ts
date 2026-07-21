import type { GraphQLResolveInfo } from "graphql";

import type { ReservedSeatProfile } from "@repo/shared";

import {
  type CatalogQueryParams,
  getAllReservedSeatGroups,
  getCatalogClassIdentities,
  getCatalogFilterOptions,
  getCatalogLegacy,
  getCatalogSearch,
  getSuggestedReservedSeatGroups,
} from "./controller";

const resolvers = {
  Query: {
    catalog: async (
      _: unknown,
      { year, semester }: { year: number; semester: string },
      __: unknown,
      info: GraphQLResolveInfo
    ) => {
      return await getCatalogLegacy(year, semester, info);
    },
    catalogSearch: async (_: unknown, args: CatalogQueryParams) => {
      return await getCatalogSearch(args);
    },
    catalogClassIdentities: async (
      _: unknown,
      { year, semester }: { year: number; semester: string }
    ) => {
      return await getCatalogClassIdentities(year, semester);
    },
    catalogFilterOptions: async (
      _: unknown,
      { year, semester }: { year: number; semester: string }
    ) => {
      return await getCatalogFilterOptions(year, semester);
    },
    allReservedSeatGroups: async () => {
      return await getAllReservedSeatGroups();
    },
    suggestedReservedSeatGroups: async (
      _: unknown,
      { profile }: { profile: ReservedSeatProfile }
    ) => {
      return await getSuggestedReservedSeatGroups(profile);
    },
  },
};

export default resolvers;
