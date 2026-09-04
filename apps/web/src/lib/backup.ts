import { draftSchema, historyItemSchema } from "./backupSchemas";

export const BACKUP_KEYS = {
  history: "sizhu-ai-history-v1",
  draft: "sizhu-ai-form-draft-v1",
  theme: "sizhu-theme",
  locale: "astrocopy-locale-v1"
} as const;
export const HISTORY_LIMIT = 12;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
type Field = keyof typeof BACKUP_KEYS;
const fields = Object.keys(BACKUP_KEYS) as Field[];
export interface Backup {
  format: "mingxu-browser-backup";
  version: 1;
  exportedAt: string;
  origin: string;
  // Raw strings preserve every original record, including older engine versions
  // and malformed local data that may require manual recovery.
  data: Record<Field, string | null>;
}
export type BackupStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function exportBackup(storage: BackupStorage, origin: string, now = new Date()): Backup {
  return {
    format: "mingxu-browser-backup", version: 1, exportedAt: now.toISOString(), origin,
    data: Object.fromEntries(fields.map((field) => [field, storage.getItem(BACKUP_KEYS[field])])) as Backup["data"]
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseBackup(source: string): Backup {
  if (new TextEncoder().encode(source).length > MAX_BACKUP_BYTES) throw new Error("Backup exceeds 20 MB. / 备份超过 20 MB。");
  const value: unknown = JSON.parse(source);
  if (!record(value) || value.format !== "mingxu-browser-backup" || value.version !== 1 ||
      typeof value.exportedAt !== "string" || !Number.isFinite(Date.parse(value.exportedAt)) ||
      typeof value.origin !== "string" || !record(value.data) ||
      fields.some((field) => value.data && (value.data as Record<string, unknown>)[field] !== null && typeof (value.data as Record<string, unknown>)[field] !== "string")) {
    throw new Error("Unsupported or damaged backup. / 备份格式不支持或已损坏。");
  }
  return value as unknown as Backup;
}

function history(raw: string | null): { items: Array<{ id: string; [key: string]: unknown }>; unsupported: number } {
  if (raw === null) return { items: [], unsupported: 0 };
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Invalid history. / 历史记录已损坏。");
  const items: Array<{ id: string; [key: string]: unknown }> = [];
  let unsupported = 0;
  for (const item of parsed) {
    if (record(item) && record(item.profile) && record(item.profile.time) &&
        typeof item.profile.time.engine === "string" && item.profile.time.engine !== "sizhu-time-v2") {
      unsupported++;
      continue;
    }
    if (!historyItemSchema.safeParse(item).success) throw new Error("Damaged history record; nothing imported. / 历史记录已损坏，未导入。");
    items.push(item);
  }
  return { items, unsupported };
}

function validatePreference(field: Exclude<Field, "history">, value: string | null) {
  if (value === null) return;
  const valid = field === "draft" ? draftSchema.safeParse(JSON.parse(value)).success
    : field === "theme" ? ["system", "light", "dark", "modern", "classical"].includes(value)
    : ["zh-CN", "en-US"].includes(value);
  if (!valid) throw new Error(`Invalid ${field}; nothing imported. / 备份内容已损坏，未导入。`);
}

export function importBackup(storage: BackupStorage, source: string) {
  const incoming = parseBackup(source);
  const current = exportBackup(storage, "local");
  const oldHistory = history(current.data.history);
  const importedHistory = history(incoming.data.history);
  for (const field of ["draft", "theme", "locale"] as const) validatePreference(field, incoming.data[field]);
  const merged = new Map(oldHistory.items.map((item) => [item.id, item]));
  let added = 0;
  for (const item of importedHistory.items) {
    if (!merged.has(item.id)) { merged.set(item.id, item); added++; }
  }
  const all = [...merged.values()];
  const updates: Array<[Field, string]> = [];
  const retainedExisting = Math.min(new Set(oldHistory.items.map((item) => item.id)).size, HISTORY_LIMIT);
  const imported = Math.max(0, Math.min(all.length, HISTORY_LIMIT) - retainedExisting);
  if (added > 0 && oldHistory.unsupported === 0 && all.length > retainedExisting) {
    // Existing records win both ID conflicts and capacity; overflow remains in
    // the user's original backup file. Never silently erase legacy local data.
    updates.push(["history", JSON.stringify(all.slice(0, HISTORY_LIMIT))]);
  } else if (oldHistory.unsupported > 0 && added > 0) {
    throw new Error("Export and review older local history before importing. / 请先导出并检查旧版本本地历史。");
  }
  for (const field of ["draft", "theme", "locale"] as const) {
    if (current.data[field] === null && incoming.data[field] !== null) updates.push([field, incoming.data[field]]);
  }
  const applied: Field[] = [];
  try {
    for (const [field, value] of updates) {
      storage.setItem(BACKUP_KEYS[field], value);
      applied.push(field);
    }
  } catch (error) {
    for (const field of applied.reverse()) {
      const previous = current.data[field];
      if (previous === null) storage.removeItem(BACKUP_KEYS[field]);
      else storage.setItem(BACKUP_KEYS[field], previous);
    }
    throw error;
  }
  return { imported, duplicates: importedHistory.items.length - added, overflow: Math.max(0, added - imported), unsupported: importedHistory.unsupported, preferences: updates.filter(([field]) => field !== "history").length };
}
