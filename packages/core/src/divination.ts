import type { DivinationProfile } from "./types.js";

export function createDivinationProfile(): DivinationProfile {
  return {
    liuren: {
      available: false,
      source: "pending",
      summary: "大六壬适配点已预留，v1 优先接入本机 liuren-ts-lib CLI 输出。"
    },
    liuyao: {
      available: false,
      source: "pending",
      summary: "六爻适配点已预留，v1 后续验证 iching-shifa 或 divicast 后接入。"
    }
  };
}
