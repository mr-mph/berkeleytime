import { GraphQLError } from "graphql";

import {
  ParsedUcbCatalogEnrollment,
  UcbCatalogEnrollmentError,
  buildUcbCatalogUrl as sharedBuildUcbCatalogUrl,
  fetchUcbCatalogEnrollment as sharedFetchUcbCatalogEnrollment,
  isBlankUcbEnrollment as sharedIsBlankUcbEnrollment,
  mergeSeatReservationTypes as sharedMergeSeatReservationTypes,
  seatReservationCountsEqual as sharedSeatReservationCountsEqual,
  preserveRemovedSeatReservationCounts as sharedPreserveRemovedSeatReservationCounts,
} from "@repo/shared";

export type {
  ParsedUcbCatalogEnrollment,
  ParsedUcbEnrollment,
} from "@repo/shared";

export const buildUcbCatalogUrl = sharedBuildUcbCatalogUrl;
export const isBlankUcbEnrollment = sharedIsBlankUcbEnrollment;
export const mergeSeatReservationTypes = sharedMergeSeatReservationTypes;
export const seatReservationCountsEqual = sharedSeatReservationCountsEqual;
export const preserveRemovedSeatReservationCounts =
  sharedPreserveRemovedSeatReservationCounts;

function mapUcbError(error: unknown): never {
  if (error instanceof UcbCatalogEnrollmentError) {
    throw new GraphQLError(error.message, {
      extensions: { code: error.code },
    });
  }
  if (error instanceof GraphQLError) {
    throw error;
  }
  throw new GraphQLError(
    error instanceof Error ? error.message : "Berkeley Catalog scrape failed",
    { extensions: { code: "INTERNAL_SERVER_ERROR" } }
  );
}

export async function fetchUcbCatalogEnrollment(
  url: string
): Promise<ParsedUcbCatalogEnrollment> {
  try {
    return await sharedFetchUcbCatalogEnrollment(url);
  } catch (error) {
    mapUcbError(error);
  }
}
