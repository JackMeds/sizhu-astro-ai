import type { AstroProfile } from "@sizhu/core";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

export function renderAstroSvg(profile: AstroProfile): string {
  const size = 1080;
  const cx = size / 2;
  const cy = size / 2;
  const palaceLabels = profile.ziwei.palaces.slice(0, 12);
  const palaceText = palaceLabels
    .map((palace, index) => {
      const [x, y] = polar(cx, cy, 390, index * 30);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="palace">${escapeXml(
        palace.name || "-"
      )}</text>`;
    })
    .join("");
  const pillarText = profile.bazi.pillars
    .map((pillar, index) => {
      const x = 280 + index * 175;
      return `<g transform="translate(${x} 478)">
        <rect x="-52" y="-96" width="104" height="192" rx="24" class="pillarBox"/>
        <text y="-38" text-anchor="middle" class="pillarStem">${escapeXml(pillar.stem)}</text>
        <text y="38" text-anchor="middle" class="pillarBranch">${escapeXml(pillar.branch)}</text>
        <text y="78" text-anchor="middle" class="pillarLabel">${escapeXml(pillar.label)}</text>
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#19372f"/>
      <stop offset="48%" stop-color="#0d1716"/>
      <stop offset="100%" stop-color="#050706"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" x2="100%">
      <stop offset="0%" stop-color="#a9772b"/>
      <stop offset="50%" stop-color="#f4d28a"/>
      <stop offset="100%" stop-color="#9a6423"/>
    </linearGradient>
    <style>
      .title{font:700 44px serif;fill:#f4d28a;letter-spacing:2px}
      .sub{font:500 22px sans-serif;fill:#b8c8bd}
      .ring{fill:none;stroke:url(#gold);stroke-width:2.2;opacity:.74}
      .orbit{fill:none;stroke:#a83e32;stroke-width:1.4;opacity:.42;stroke-dasharray:10 16}
      .pillarBox{fill:rgba(245,210,138,.08);stroke:#d8a94e;stroke-width:1.4}
      .pillarStem{font:700 54px serif;fill:#f4d28a}
      .pillarBranch{font:700 54px serif;fill:#e05b49}
      .pillarLabel{font:500 18px sans-serif;fill:#9fb3a7}
      .palace{font:600 20px serif;fill:#d9c7a2}
      .note{font:500 20px sans-serif;fill:#b8c8bd}
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="440" class="ring"/>
  <circle cx="${cx}" cy="${cy}" r="332" class="orbit"/>
  <circle cx="${cx}" cy="${cy}" r="230" class="ring"/>
  ${palaceText}
  ${pillarText}
  <text x="${cx}" y="132" text-anchor="middle" class="title">${escapeXml(profile.input.name)} AI 命盘</text>
  <text x="${cx}" y="172" text-anchor="middle" class="sub">${escapeXml(profile.bazi.solarText)} · 日主 ${escapeXml(
    profile.bazi.dayMaster
  )}</text>
  <text x="${cx}" y="760" text-anchor="middle" class="note">${escapeXml(profile.ai.summary.slice(0, 56))}</text>
  <text x="${cx}" y="810" text-anchor="middle" class="note">五行：${escapeXml(
    Object.entries(profile.bazi.elementCounts)
      .map(([key, value]) => `${key}${value}`)
      .join("  ")
  )}</text>
</svg>`;
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
