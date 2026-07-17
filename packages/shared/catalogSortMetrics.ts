import { MetricName } from "./metrics";

export type CatalogRatingMetric = {
  metricName: string;
  count: number;
  weightedAverage: number;
};

/**
 * Berkeleytime "average rating" for catalog sorting.
 * Uses Usefulness when available; otherwise averages available rating metrics
 * with Difficulty/Workload inverted onto a higher-is-better 1–5 scale.
 */
export function getBerkeleytimeAverageRating(
  metrics: readonly CatalogRatingMetric[] | null | undefined
): number | null {
  if (!metrics?.length) return null;

  const usefulness = metrics.find(
    (metric) => metric.metricName === MetricName.Usefulness
  );
  if (
    usefulness &&
    usefulness.count > 0 &&
    Number.isFinite(usefulness.weightedAverage)
  ) {
    return usefulness.weightedAverage;
  }

  const scores: number[] = [];
  for (const metric of metrics) {
    if (!metric.count || !Number.isFinite(metric.weightedAverage)) continue;
    if (metric.metricName === MetricName.Difficulty) {
      scores.push(6 - metric.weightedAverage);
    } else if (metric.metricName === MetricName.Workload) {
      scores.push(6 - metric.weightedAverage);
    } else if (metric.metricName === MetricName.Usefulness) {
      scores.push(metric.weightedAverage);
    }
  }

  if (scores.length === 0) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

/** Max metric count, matching ClassCard rating-count display. */
export function getBerkeleytimeRatingCount(
  metrics: readonly CatalogRatingMetric[] | null | undefined
): number {
  if (!metrics?.length) return 0;
  return Math.max(0, ...metrics.map((metric) => metric.count ?? 0));
}
