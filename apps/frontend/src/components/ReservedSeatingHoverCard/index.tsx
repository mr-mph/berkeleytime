import classNames from "classnames";
import { SleeperChair } from "iconoir-react";
import { HoverCard } from "radix-ui";

import { Badge, Color } from "@repo/theme";

import useUser from "@/hooks/useUser";
import {
  findBestOpenMatch,
  findBestSelectedMatch,
  formatReservedSeatsRemaining,
} from "@/lib/reservedSeatGroups";

import styles from "./ReservedSeatingHoverCard.module.scss";

interface SeatReservation {
  enrolledCount: number;
  maxEnroll: number;
  requirementGroup: {
    description: string;
  };
  isValid: boolean;
}

interface ReservedSeatingHoverCardProps {
  seatReservationCount: SeatReservation[];
  /** Override selected groups; defaults to the signed-in profile. */
  highlightedDescriptions?: string[];
}

export function ReservedSeatingHoverCard({
  seatReservationCount,
  highlightedDescriptions,
}: ReservedSeatingHoverCardProps) {
  const { user } = useUser();
  const selected =
    highlightedDescriptions ?? user?.reservedSeatGroups ?? [];
  const selectedSet = new Set(selected);

  const validReservations = seatReservationCount
    .filter((r) => r.isValid)
    .sort((a, b) => {
      const aFull = a.enrolledCount >= a.maxEnroll;
      const bFull = b.enrolledCount >= b.maxEnroll;

      // First, sort by full status (not full first, then full)
      if (aFull !== bFull) {
        return aFull ? 1 : -1;
      }

      // Within each group, sort by maxEnroll descending
      return b.maxEnroll - a.maxEnroll;
    });

  const hasOpenHighlight =
    findBestOpenMatch(
      validReservations.map((r) => ({
        description: r.requirementGroup.description,
        enrolledCount: r.enrolledCount,
        maxEnroll: r.maxEnroll,
      })),
      selected
    ) !== null;

  const hasFullHighlight =
    !hasOpenHighlight &&
    findBestSelectedMatch(
      validReservations.map((r) => ({
        description: r.requirementGroup.description,
        enrolledCount: r.enrolledCount,
        maxEnroll: r.maxEnroll,
      })),
      selected
    ) !== null;

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className={classNames(styles.trigger, {
            [styles.triggerHighlight]: hasOpenHighlight,
            [styles.triggerFullHighlight]: hasFullHighlight,
          })}
        >
          <SleeperChair width={14} height={14} />
          <span>Reserved Seating</span>
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className={styles.card}
        >
          <div className={styles.header}>This class has reserved seating</div>
          <div className={styles.content}>
            {validReservations.map((reservation, index) => {
              const isFull = reservation.enrolledCount >= reservation.maxEnroll;
              const isSelected = selectedSet.has(
                reservation.requirementGroup.description
              );
              const isOpenMatch = isSelected && !isFull;
              const isFullMatch = isSelected && isFull;

              return (
                <div key={index} className={styles.group}>
                  <span className={styles.description}>
                    {reservation.requirementGroup.description}
                  </span>
                  <div className={styles.badgeContainer}>
                    <Badge
                      label={formatReservedSeatsRemaining(
                        reservation.enrolledCount,
                        reservation.maxEnroll
                      )}
                      color={
                        isOpenMatch
                          ? Color.Green
                          : isFullMatch || isFull
                            ? Color.Rose
                            : Color.Gray
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
