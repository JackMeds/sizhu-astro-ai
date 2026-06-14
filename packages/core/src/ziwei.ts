import { astro } from "iztro";
import type { AstroInput, ZiweiPalace, ZiweiProfile } from "./types.js";
import { getEffectiveBirthDate } from "./time.js";

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function starNames(value: unknown): string[] {
  return asArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const star = item as Record<string, unknown>;
        return String(star.name ?? star.label ?? star.type ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

export function createZiweiProfile(input: AstroInput): ZiweiProfile {
  try {
    const date = getEffectiveBirthDate(input);
    const dateText = date.toISOString().slice(0, 10);
    const timeIndex = Math.floor((date.getHours() + 1) / 2) % 12;
    const astrolabe = astro.bySolar(dateText, timeIndex, input.gender === "male" ? "男" : "女", true);
    const palaces: ZiweiPalace[] = asArray((astrolabe as { palaces?: unknown[] }).palaces).map((palace) => {
      const item = palace as Record<string, unknown>;
      return {
        name: String(item.name ?? item.label ?? ""),
        earthlyBranch: String(item.earthlyBranch ?? item.branch ?? ""),
        heavenlyStem: String(item.heavenlyStem ?? item.stem ?? ""),
        majorStars: starNames(item.majorStars),
        minorStars: starNames(item.minorStars),
        raw: item
      };
    });

    return {
      engine: "iztro",
      available: palaces.length > 0,
      palaces,
      raw: astrolabe
    };
  } catch (error) {
    return {
      engine: "iztro",
      available: false,
      palaces: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
