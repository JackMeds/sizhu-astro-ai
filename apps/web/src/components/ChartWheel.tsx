import type { AstroProfile } from "@mingxu/core";
import { motion } from "motion/react";

interface ChartWheelProps {
  profile: AstroProfile;
}

export function ChartWheel({ profile }: ChartWheelProps) {
  const elements = Object.entries(profile.bazi.elementCounts);
  const max = Math.max(...elements.map(([, value]) => value), 1);

  return (
    <section className="chart-stage" aria-label="命盘总览">
      <motion.div
        className="astro-wheel"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
        <div className="palace-ring">
          {Array.from({ length: 12 }).map((_, index) => {
            const palace = profile.ziwei.palaces[index];
            return (
              <span key={index} style={{ "--i": index } as React.CSSProperties}>
                {palace?.name || ["命", "兄", "夫", "子", "财", "疾", "迁", "仆", "官", "田", "福", "父"][index]}
              </span>
            );
          })}
        </div>

        <div className="pillar-core">
          {profile.bazi.pillars.map((pillar, index) => (
            <motion.div
              className="pillar-card"
              key={pillar.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
            >
              <span>{pillar.label}</span>
              <strong>{pillar.stem}</strong>
              <b>{pillar.branch}</b>
              <small>{pillar.tenGod}</small>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="element-flow">
        {elements.map(([element, value], index) => (
          <motion.div
            className="element-row"
            key={element}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + index * 0.06 }}
          >
            <span>{element}</span>
            <div>
              <i style={{ width: `${Math.max(10, (value / max) * 100)}%` }} />
            </div>
            <em>{value}</em>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
