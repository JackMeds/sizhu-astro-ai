export const FIVE_PHASES = ["木", "火", "土", "金", "水"] as const;

export type FivePhase = (typeof FIVE_PHASES)[number];

export interface ElementDistributionRow {
  element: FivePhase;
  value: number;
  percentage: number;
}

/**
 * Derive display-only Five-Phase percentages from the existing chart counts.
 * The calculation deliberately leaves the public AstroProfile shape untouched.
 */
export function buildElementDistribution(
  counts: Partial<Record<string, number>> | null | undefined
): ElementDistributionRow[] {
  const normalize = (value: number | undefined) => {
    const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
    return Math.max(0, numeric);
  };
  const total = FIVE_PHASES.reduce((sum, element) => sum + normalize(counts?.[element]), 0);
  return FIVE_PHASES.map((element) => {
    const value = normalize(counts?.[element]);
    return {
      element,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    };
  });
}
