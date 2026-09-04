import { exportBackup, importBackup, MAX_BACKUP_BYTES } from "./lib/backup";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const picker = document.querySelector<HTMLInputElement>("#backup-file")!;
const importButton = document.querySelector<HTMLButtonElement>("#import")!;
let busy = false;
const showError = () => { status.textContent = "操作失败，原有数据已保留。请确认 JSON 有效、未超过 20 MB，且浏览器允许本地存储。 / Failed; existing data retained. Check the backup format, 20 MB limit and browser storage access."; };

document.querySelector("#export")!.addEventListener("click", () => {
  try {
    const backup = exportBackup(localStorage, location.origin);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mingxu-backup-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "备份已下载，请妥善保存。 / Backup downloaded; keep it private.";
  } catch { showError(); }
});
picker.addEventListener("change", () => { importButton.disabled = busy || !picker.files?.length; });
importButton.addEventListener("click", async () => {
  const file = picker.files?.[0];
  if (!file || busy) return;
  busy = true;
  importButton.disabled = true;
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error("oversized");
    const result = importBackup(localStorage, await file.text());
    status.textContent = `已导入 ${result.imported} 条历史、${result.preferences} 项设置；重复 ${result.duplicates} 条；超出容量 ${result.overflow} 条；旧引擎不兼容 ${result.unsupported} 条。请保留原备份，返回首页查看。\nImported ${result.imported} records and ${result.preferences} preferences; ${result.duplicates} duplicates, ${result.overflow} overflow, ${result.unsupported} older-engine records skipped. Keep the original file and return home.`;
  } catch { showError(); }
  finally { busy = false; importButton.disabled = !picker.files?.length; }
});
