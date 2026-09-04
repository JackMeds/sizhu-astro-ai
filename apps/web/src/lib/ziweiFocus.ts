import type { ZiweiPalace } from "@mingxu/core";

export const ZIWEI_FOCUS_IDS = [
  "ziwei-palace-life",
  "ziwei-palace-body",
  "ziwei-palace-siblings",
  "ziwei-palace-partner",
  "ziwei-palace-children",
  "ziwei-palace-wealth",
  "ziwei-palace-health",
  "ziwei-palace-travel",
  "ziwei-palace-network",
  "ziwei-palace-career",
  "ziwei-palace-property",
  "ziwei-palace-wellbeing",
  "ziwei-palace-parents"
] as const;

export type ZiweiFocusId = typeof ZIWEI_FOCUS_IDS[number];

const focusIdSet = new Set<string>(ZIWEI_FOCUS_IDS);

const palaceFocusIdByName: Record<string, ZiweiFocusId> = {
  命宫: "ziwei-palace-life",
  兄弟: "ziwei-palace-siblings",
  夫妻: "ziwei-palace-partner",
  子女: "ziwei-palace-children",
  财帛: "ziwei-palace-wealth",
  疾厄: "ziwei-palace-health",
  迁移: "ziwei-palace-travel",
  仆役: "ziwei-palace-network",
  交友: "ziwei-palace-network",
  官禄: "ziwei-palace-career",
  事业: "ziwei-palace-career",
  田宅: "ziwei-palace-property",
  福德: "ziwei-palace-wellbeing",
  父母: "ziwei-palace-parents"
};

export function isZiweiFocusId(value: unknown): value is ZiweiFocusId {
  return typeof value === "string" && focusIdSet.has(value);
}

export function normalizeZiweiFocusIds(values: readonly ZiweiFocusId[]): ZiweiFocusId[] {
  return Array.from(new Set(values)).slice(0, 4);
}

export function getZiweiPalaceFocusIds(palace: Pick<ZiweiPalace, "name" | "isBodyPalace">): ZiweiFocusId[] {
  const ids: ZiweiFocusId[] = [];
  const palaceId = palaceFocusIdByName[palace.name];
  if (palaceId) ids.push(palaceId);
  if (palace.isBodyPalace) ids.push("ziwei-palace-body");
  return Array.from(new Set(ids));
}
