import { zonedLocalDateTimeToOffset } from "@sizhu/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function localDateTimeToOffset(value: string, timezone = "Asia/Shanghai") {
  if (!value) return new Date().toISOString();
  return zonedLocalDateTimeToOffset(value, timezone);
}

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(content: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("复制失败，请手动选中预览框内容复制。");
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片生成失败"));
    image.src = src;
  });
}

export async function copySvgAsPng(svg: string) {
  const clipboardItem = window.ClipboardItem;
  if (!navigator.clipboard?.write || !clipboardItem) {
    return false;
  }

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 1080;
    canvas.height = image.naturalHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.drawImage(image, 0, 0);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) return false;
    await navigator.clipboard.write([new clipboardItem({ "image/png": pngBlob })]);
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}
