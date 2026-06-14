import type { AstroInput } from "./types.js";

const BEIJING_STANDARD_LONGITUDE = 120;
const MINUTES_PER_LONGITUDE_DEGREE = 4;

export function getLongitudeCorrectionMinutes(input: AstroInput): number | null {
  const longitude = input.location?.longitude;
  if (input.trueSolarTime !== "longitude" || typeof longitude !== "number" || !Number.isFinite(longitude)) {
    return null;
  }
  return (longitude - BEIJING_STANDARD_LONGITUDE) * MINUTES_PER_LONGITUDE_DEGREE;
}

export function getEffectiveBirthDate(input: AstroInput): Date {
  const date = new Date(input.birthDateTime);
  const correctionMinutes = getLongitudeCorrectionMinutes(input);
  if (correctionMinutes == null) return date;
  return new Date(date.getTime() + correctionMinutes * 60_000);
}
