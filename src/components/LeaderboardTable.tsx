"use client";

import { useIdentity } from "@/components/identity";
import { avatarColor } from "@/lib/avatarColor";
import type { WeeklyStat } from "@/lib/posts";
import type { MemberStreak } from "@/lib/streaks";
import type { Badge } from "@/lib/badges";
import { MemberTargetControl } from "@/components/MemberTargetControl";

const MEDALS = ["🥇", "🥈", "🥉"];

function BadgesAndTarget({
  badges,
  showTargetControls,
  memberId,
  targetByMemberId,
  defaultTarget,
}: {
  badges: Badge[];
  showTargetControls: boolean;
  memberId: string;
  targetByMemberId: Map<string, number | null>;
  defaultTarget: number;
}) {
  if (badges.length === 0 && !showTargetControls) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {badges.map((b) => (
        <span
          key={b.label}
          title={b.label}
          className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
        >
          {b.emoji} {b.label}
        </span>
      ))}
      {showTargetControls && (
        <MemberTargetControl
          memberId={memberId}
          weeklyTarget={targetByMemberId.get(memberId) ?? null}
          defaultTarget={defaultTarget}
        />
      )}
    </div>
  );
}

export function LeaderboardTable({
  stats,
  streaksByMemberId,
  badgesByMemberId,
  targetByMemberId,
  defaultTarget,
  valueLabel = "posts",
  pointsPerPost = 1,
  showTargetControls = false,
}: {
  stats: WeeklyStat[];
  streaksByMemberId: Map<string, MemberStreak> | null;
  badgesByMemberId: Map<string, Badge[]>;
  targetByMemberId: Map<string, number | null>;
  defaultTarget: number;
  valueLabel?: "posts" | "points";
  pointsPerPost?: number;
  showTargetControls?: boolean;
}) {
  const { memberId } = useIdentity();
  const values = stats.map((s) => (valueLabel === "points" ? s.total * pointsPerPost : s.total));

  if (stats.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        No team members yet.
      </p>
    );
  }

  const [champion, ...rest] = stats;
  const championValue = values[0];
  const championIsYou = champion.memberId === memberId;
  const championStreak = streaksByMemberId?.get(champion.memberId);
  const championBadges = badgesByMemberId.get(champion.memberId) ?? [];
  const hasChampion = champion.total > 0;

  return (
    <div className="space-y-2">
      {hasChampion && (
        <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="absolute left-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-[#402c00]">
            01
          </div>
          <div
            className="ml-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white"
            style={{ backgroundColor: avatarColor(champion.memberName) }}
          >
            {champion.memberName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg font-extrabold">{champion.memberName}</span>
              {championIsYou && <span className="text-xs font-semibold text-accent">(you)</span>}
            </div>
            <div className="text-xs text-muted">
              {championStreak && championStreak.streak > 0
                ? `🔥 ${championStreak.streak}-week streak`
                : "Leading this period"}
            </div>
            <BadgesAndTarget
              badges={championBadges}
              showTargetControls={showTargetControls}
              memberId={champion.memberId}
              targetByMemberId={targetByMemberId}
              defaultTarget={defaultTarget}
            />
          </div>
          <div className="shrink-0 text-right">
            <div className="text-3xl font-extrabold text-amber-600">{championValue}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {valueLabel}
            </div>
          </div>
        </div>
      )}

      {(hasChampion ? rest : stats).map((s, idx) => {
        const i = hasChampion ? idx + 1 : idx;
        const isYou = s.memberId === memberId;
        const streak = streaksByMemberId?.get(s.memberId);
        const badges = badgesByMemberId.get(s.memberId) ?? [];
        const value = values[i];

        return (
          <div
            key={s.memberId}
            className={`rounded-2xl border p-3 shadow-sm ${
              isYou ? "border-accent/40 bg-accent/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 shrink-0 text-center text-sm font-semibold text-muted">
                {i < 3 && s.total > 0 ? MEDALS[i] : `#${i + 1}`}
              </div>

              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: avatarColor(s.memberName) }}
              >
                {s.memberName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{s.memberName}</span>
                  {isYou && <span className="text-xs text-accent">(you)</span>}
                  {!s.active && <span className="text-xs text-muted">(inactive)</span>}
                  {streak && streak.streak > 0 && (
                    <span className="text-xs text-muted">🔥 {streak.streak}</span>
                  )}
                </div>
                {streak?.closeToMissing && (
                  <span className="mt-1 inline-block rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    ⚠️ needs {streak.target - streak.postsThisWeek} more this week
                  </span>
                )}
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted">{valueLabel}</div>
              </div>
            </div>

            <BadgesAndTarget
              badges={badges}
              showTargetControls={showTargetControls}
              memberId={s.memberId}
              targetByMemberId={targetByMemberId}
              defaultTarget={defaultTarget}
            />
          </div>
        );
      })}
    </div>
  );
}
