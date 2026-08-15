import type { CSSProperties } from "react";
import { ExternalLink, HeartHandshake, Star } from "lucide-react";

const orbitBranches = [..."子丑寅卯辰巳午未申酉戌亥"];

export function SponsorPlaceholder() {
  return (
    <section className="sponsor-slot" aria-labelledby="sponsor-title" data-sponsor-slot="primary">
      <div className="sponsor-art" aria-hidden="true">
        <div className="sponsor-orbit sponsor-orbit-outer" />
        <div className="sponsor-orbit sponsor-orbit-inner" />
        <div className="sponsor-seal">命</div>
        {orbitBranches.map((branch, index) => (
          <span
            className="sponsor-branch"
            key={branch}
            style={{ "--branch-index": index } as CSSProperties}
          >
            {branch}
          </span>
        ))}
        <i className="sponsor-star sponsor-star-a">✦</i>
        <i className="sponsor-star sponsor-star-b">✧</i>
        <i className="sponsor-star sponsor-star-c">✦</i>
      </div>

      <div className="sponsor-copy">
        <p className="eyeline"><HeartHandshake size={14} /> Support the project</p>
        <h2 id="sponsor-title">支持这个免费的开源排盘底座</h2>
        <p>
          四柱星盘 AI 不出售命理解读，也不锁定任何 AI 服务。这里未来可以展示与传统文化、AI 工具或开发者生态相关的赞助商 / 广告；当前先作为项目支持位保留。
        </p>
        <div className="sponsor-actions">
          <a href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer">
            <Star size={16} /> GitHub Star <ExternalLink size={14} />
          </a>
          <span>赞助 / 广告合作入口 · 预留</span>
        </div>
        <small>未来接入真实广告时，只替换这个 slot 的内容，不改变命盘、输入与隐私流程。</small>
      </div>
    </section>
  );
}
