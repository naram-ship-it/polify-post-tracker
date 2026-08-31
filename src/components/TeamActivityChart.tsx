"use client";

import { useState } from "react";
import type { WeeklyTeamTotal } from "@/lib/posts";

const WIDTH = 640;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 24;
const PAD_BOTTOM = 24;
const BAR_GAP = 8;
const BAR_MAX_THICKNESS = 32;

export function TeamActivityChart({ data }: { data: WeeklyTeamTotal[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxTotal = Math.max(1, ...data.map((d) => d.total));

  const slot = plotWidth / data.length;
  const barWidth = Math.min(BAR_MAX_THICKNESS, slot - BAR_GAP);

  if (data.every((d) => d.total === 0)) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        No posts yet — the team&apos;s weekly activity will show up here.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-2 font-semibold">Team activity — last {data.length} weeks</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Team posts per week, last ${data.length} weeks`}
      >
        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = (d.total / maxTotal) * plotHeight;
          const slotX = PAD_LEFT + i * slot;
          const barX = slotX + (slot - barWidth) / 2;
          const barY = HEIGHT - PAD_BOTTOM - barHeight;
          const isHover = hover === i;

          return (
            <g
              key={d.weekStart}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            >
              <rect
                x={slotX}
                y={PAD_TOP}
                width={slot}
                height={plotHeight}
                fill="transparent"
              />
              {d.total > 0 && (
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={4}
                  fill="var(--accent)"
                  opacity={isHover ? 1 : 0.85}
                />
              )}
              <text
                x={slotX + slot / 2}
                y={barY - 6}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={11}
                fontWeight={isHover ? 700 : 500}
              >
                {d.total > 0 ? d.total : ""}
              </text>
              <text
                x={slotX + slot / 2}
                y={HEIGHT - PAD_BOTTOM + 14}
                textAnchor="middle"
                className="fill-muted"
                fontSize={10}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
