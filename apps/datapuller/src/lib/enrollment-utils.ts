export type SeatReservationCountLike = {
  number?: number;
  maxEnroll?: number;
  enrolledCount?: number;
};

export type SeatReservationTypeLike = {
  number?: number;
  fromDate?: string;
  requirementGroup?: {
    code?: string;
    description?: string;
  };
};

export type ActiveSeatReservation = {
  description: string;
  enrolledCount: number;
  maxEnroll: number;
};

const isActiveSeatReservation = (
  maxEnroll: number,
  fromDate: string | undefined,
  now: Date
): boolean => {
  const fromDateObj = fromDate ? new Date(fromDate) : null;
  const hasValidFromDate =
    fromDateObj !== null && !Number.isNaN(fromDateObj.getTime());

  return (
    maxEnroll > 1 && (!hasValidFromDate || (fromDateObj !== null && fromDateObj <= now))
  );
};

/** Active reserved groups with labels — same validity as Reserved Seating hover card. */
export const buildActiveSeatReservations = (
  seatReservationCount: SeatReservationCountLike[] | undefined,
  seatReservationTypes: SeatReservationTypeLike[] | undefined,
  now: Date = new Date()
): ActiveSeatReservation[] => {
  const counts = seatReservationCount ?? [];
  if (counts.length === 0) return [];

  const types = seatReservationTypes ?? [];
  const reservations: ActiveSeatReservation[] = [];

  for (const reservation of counts) {
    const maxEnroll = reservation.maxEnroll ?? 0;
    const matchingType = types.find(
      (type) => type.number === reservation.number
    );
    if (!isActiveSeatReservation(maxEnroll, matchingType?.fromDate, now)) {
      continue;
    }

    reservations.push({
      description:
        matchingType?.requirementGroup?.description?.trim() || "Unknown",
      enrolledCount: reservation.enrolledCount ?? 0,
      maxEnroll,
    });
  }

  return reservations;
};

export const computeActiveReservedMaxCount = (
  seatReservationCount: SeatReservationCountLike[] | undefined,
  seatReservationTypes: SeatReservationTypeLike[] | undefined
): number => {
  return buildActiveSeatReservations(
    seatReservationCount,
    seatReservationTypes
  ).reduce((sum, reservation) => sum + reservation.maxEnroll, 0);
};
