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

/** Union seat-reservation labels by number; incoming overwrites same number. */
export const mergeSeatReservationTypes = <T extends SeatReservationTypeLike>(
  existing: T[] | undefined,
  incoming: T[] | undefined
): T[] => {
  const byNumber = new Map<number, T>();
  for (const type of existing ?? []) {
    if (type.number == null) continue;
    byNumber.set(type.number, type);
  }
  for (const type of incoming ?? []) {
    if (type.number == null) continue;
    byNumber.set(type.number, type);
  }
  return [...byNumber.values()];
};

export const seatReservationCountsEqual = (
  a: SeatReservationCountLike[] | undefined,
  b: SeatReservationCountLike[] | undefined
): boolean => {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  for (const item of left) {
    const match = right.find((other) => other.number === item.number);
    if (!match) return false;
    if (
      (item.maxEnroll ?? 0) !== (match.maxEnroll ?? 0) ||
      (item.enrolledCount ?? 0) !== (match.enrolledCount ?? 0)
    ) {
      return false;
    }
  }
  return true;
};

/**
 * If an update drops a reserved group, keep it with 0 seats left
 * (enrolledCount = maxEnroll). Incoming values win for shared numbers.
 */
export const preserveRemovedSeatReservationCounts = <
  T extends SeatReservationCountLike,
>(
  incoming: T[] | undefined,
  previous: T[] | undefined
): T[] => {
  const byNumber = new Map<number, T>();
  for (const reservation of previous ?? []) {
    if (reservation.number == null) continue;
    if ((reservation.maxEnroll ?? 0) <= 1) continue;
    byNumber.set(reservation.number, {
      ...reservation,
      enrolledCount: reservation.maxEnroll,
    });
  }
  for (const reservation of incoming ?? []) {
    if (reservation.number == null) continue;
    byNumber.set(reservation.number, reservation);
  }
  return [...byNumber.values()];
};

/**
 * Same preserve rule for denormalized catalog rows (keyed by description).
 */
export const preserveRemovedActiveSeatReservations = (
  incoming: ActiveSeatReservation[] | undefined,
  previous: ActiveSeatReservation[] | undefined
): ActiveSeatReservation[] => {
  const byDescription = new Map<string, ActiveSeatReservation>();
  for (const reservation of previous ?? []) {
    if (!reservation.description || reservation.maxEnroll <= 1) continue;
    byDescription.set(reservation.description, {
      ...reservation,
      enrolledCount: reservation.maxEnroll,
    });
  }
  for (const reservation of incoming ?? []) {
    byDescription.set(reservation.description, reservation);
  }
  return [...byDescription.values()];
};

/**
 * Build reserved-seat counts from a full enrollment history timeline:
 * latest point wins; groups that disappeared earlier are kept at 0 seats left.
 */
export const buildPreservedSeatReservationCountsFromHistory = (
  history:
    | Array<{ seatReservationCount?: SeatReservationCountLike[] }>
    | null
    | undefined
): SeatReservationCountLike[] => {
  if (!history?.length) return [];
  const byNumber = new Map<number, SeatReservationCountLike>();
  for (const point of history) {
    for (const reservation of point.seatReservationCount ?? []) {
      if (reservation.number == null) continue;
      if ((reservation.maxEnroll ?? 0) <= 1) continue;
      byNumber.set(reservation.number, {
        ...reservation,
        enrolledCount: reservation.maxEnroll,
      });
    }
  }
  const latest = history[history.length - 1];
  for (const reservation of latest?.seatReservationCount ?? []) {
    if (reservation.number == null) continue;
    byNumber.set(reservation.number, reservation);
  }
  return [...byNumber.values()];
};
