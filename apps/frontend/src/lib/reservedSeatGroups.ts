export type SeatReservationSummary = {
  description: string;
  enrolledCount: number;
  maxEnroll: number;
};

/** Read reserved-seat identity from URL (supports commas/& in group names). */
export const readReservedSeatGroupsFromSearchParams = (
  searchParams: URLSearchParams
): string[] => {
  const values = searchParams.getAll("reservedSeatGroups").filter(Boolean);
  if (values.length > 0) return values;
  // Legacy: single comma-joined param (breaks on commas in names)
  const legacy = searchParams.get("reservedSeatGroups");
  if (!legacy) return [];
  return legacy.split(",").filter(Boolean);
};

/** Write reserved-seat identity to URL without corrupting names that contain , or &. */
export const writeReservedSeatGroupsToSearchParams = (
  searchParams: URLSearchParams,
  groups: string[]
) => {
  searchParams.delete("reservedSeatGroups");
  for (const group of groups) {
    searchParams.append("reservedSeatGroups", group);
  }
};

/** Prefer the open matching group with the most remaining seats. */
export const findBestOpenMatch = (
  seatReservations: SeatReservationSummary[] | null | undefined,
  selected: string[] | null | undefined
): SeatReservationSummary | null => {
  if (!seatReservations?.length || !selected?.length) return null;
  const selectedSet = new Set(selected);
  let best: SeatReservationSummary | null = null;
  let bestRemaining = -1;

  for (const reservation of seatReservations) {
    if (!selectedSet.has(reservation.description)) continue;
    const remaining = reservation.maxEnroll - reservation.enrolledCount;
    if (remaining <= 0) continue;
    if (remaining > bestRemaining) {
      best = reservation;
      bestRemaining = remaining;
    }
  }

  return best;
};

/** Prefer open matching group with most remaining; otherwise any selected group. */
export const findBestSelectedMatch = (
  seatReservations: SeatReservationSummary[] | null | undefined,
  selected: string[] | null | undefined
): SeatReservationSummary | null => {
  const openMatch = findBestOpenMatch(seatReservations, selected);
  if (openMatch) return openMatch;

  if (!seatReservations?.length || !selected?.length) return null;
  const selectedSet = new Set(selected);
  let best: SeatReservationSummary | null = null;
  let bestMaxEnroll = -1;

  for (const reservation of seatReservations) {
    if (!selectedSet.has(reservation.description)) continue;
    if (reservation.maxEnroll > bestMaxEnroll) {
      best = reservation;
      bestMaxEnroll = reservation.maxEnroll;
    }
  }

  return best;
};

export const getReservedSeatsRemaining = (
  enrolledCount: number,
  maxEnroll: number
): number => Math.max(0, maxEnroll - enrolledCount);

export const formatReservedSeatsRemaining = (
  enrolledCount: number,
  maxEnroll: number
): string =>
  `${getReservedSeatsRemaining(enrolledCount, maxEnroll).toLocaleString()}/${maxEnroll.toLocaleString()}`;

export const hasOpenMatchForSelected = (
  seatReservations: SeatReservationSummary[] | null | undefined,
  selected: string[] | null | undefined
): boolean => findBestOpenMatch(seatReservations, selected) !== null;
