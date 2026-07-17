import { useMemo } from "react";

import { MetricName } from "@repo/shared";
import { Tooltip } from "@repo/theme";

import { getStatusColor } from "@/components/Class/Ratings/metricsUtil";

import styles from "./AverageRating.module.scss";

interface AverageRatingProps {
  /** Rate My Professor average (1–5). Null/undefined shows N/A when showNA. */
  rating?: number | null;
  /** When true, render "N/A" instead of hiding when rating is missing. */
  showNA?: boolean;
  style?: React.CSSProperties;
}

function getRatingTextColor(average: number): string {
  const colorName = getStatusColor(MetricName.Usefulness, average);
  return `var(--${colorName}-500)`;
}

export function AverageRating({
  rating,
  showNA = false,
  style,
}: AverageRatingProps) {
  const average =
    typeof rating === "number" && Number.isFinite(rating) && rating > 0
      ? rating
      : null;

  const color = useMemo(
    () => (average == null ? undefined : getRatingTextColor(average)),
    [average]
  );

  const text = useMemo(() => {
    if (average == null) return showNA ? "N/A" : "";
    return average.toFixed(1);
  }, [average, showNA]);

  if (!text) return null;

  return (
    <Tooltip
      trigger={
        <div
          className={styles.trigger}
          style={{
            color: average == null ? "var(--label-color)" : color,
            ...style,
          }}
        >
          {text}
        </div>
      }
      title="Rate My Professor"
      description={
        average == null ? (
          <>No Rate My Professor rating available for this instructor.</>
        ) : (
          <>
            <span style={{ color }}>{text}</span> on Rate My Professor
            {average < 5 ? " (out of 5)" : ""}.
          </>
        )
      }
    />
  );
}
