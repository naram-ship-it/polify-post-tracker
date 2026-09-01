import Link from "next/link";
import { getStatsForRange, POINTS_PER_POST, getLifetimePostCounts } from "@/lib/posts";
import { getStreaks } from "@/lib/streaks";
import { getDefaultWeeklyTarget } from "@/lib/settings";
import { startOfWeek, endOfWeek, shiftWeek, toDateInputValue } from "@/lib/week";
import { prisma } from "@/lib/prisma";
import { computeBadges, type Badge } from "@/lib/badges";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { StreakSettingsControl } from "@/components/StreakSettingsControl";

function formatRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

export default async function LeaderboardPage(
  props: PageProps<"/leaderboard">
) {
  const searchParams = await props.searchParams;
  const startParam = typeof searchParams.start === "string" ? searchParams.start : undefined;
  const endParam = typeof searchParams.end === "string" ? searchParams.end : undefined;
  const weekOffsetParam = typeof searchParams.weekOffset === "string" ? searchParams.weekOffset : "0";
  const view = searchParams.view === "points" ? "points" : "posts";

  const customRange = Boolean(startParam && endParam);

  let start: Date;
  let end: Date;
  const weekOffset = Number.parseInt(weekOffsetParam, 10) || 0;

  if (customRange && startParam && endParam) {
    start = new Date(startParam + "T00:00:00");
    end = new Date(endParam + "T23:59:59");
  } else {
    const base = shiftWeek(new Date(), weekOffset);
    start = startOfWeek(base);
    end = endOfWeek(base);
  }

  const isCurrentWeek = !customRange && weekOffset === 0;

  const [stats, streaks, defaultTarget, lifetimeCounts, members] = await Promise.all([
    getStatsForRange(start, end),
    getStreaks(),
    getDefaultWeeklyTarget(),
    getLifetimePostCounts(),
    prisma.teamMember.findMany({ select: { id: true, weeklyTarget: true } }),
  ]);

  const streaksByMemberId = new Map(streaks.map((s) => [s.memberId, s]));
  const targetByMemberId = new Map(members.map((m) => [m.id, m.weeklyTarget]));

  const badgesByMemberId = new Map<string, Badge[]>(
    stats.map((s) => {
      const streak = streaksByMemberId.get(s.memberId)?.streak ?? 0;
      const lifetime = lifetimeCounts.get(s.memberId) ?? 0;
      return [s.memberId, computeBadges(lifetime, streak)];
    })
  );

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted">{formatRange(start, end)}</p>
        </div>
        <StreakSettingsControl defaultTarget={defaultTarget} />
      </div>

      {!customRange && (
        <div className="mb-4 mt-4 flex items-center gap-2 text-sm">
          <Link
            href={`/leaderboard?weekOffset=${weekOffset - 1}`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-black/5"
          >
            ← Previous week
          </Link>
          {weekOffset !== 0 && (
            <Link
              href="/leaderboard"
              className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-black/5"
            >
              This week
            </Link>
          )}
          <Link
            href={`/leaderboard?weekOffset=${weekOffset + 1}`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-black/5"
          >
            Next week →
          </Link>
        </div>
      )}
      {customRange && (
        <div className="mb-4 mt-4">
          <Link href="/leaderboard" className="text-sm text-accent underline">
            ← Back to weekly view
          </Link>
        </div>
      )}

      <details className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm" open={customRange}>
        <summary className="cursor-pointer text-sm font-medium">
          Custom date range
        </summary>
        <form className="mt-3 flex flex-wrap items-end gap-3" action="/leaderboard">
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <input
              type="date"
              name="start"
              defaultValue={toDateInputValue(start)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <input
              type="date"
              name="end"
              defaultValue={toDateInputValue(end)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            View range
          </button>
        </form>
      </details>

      <div className="mb-3 flex gap-1 text-sm">
        {(["posts", "points"] as const).map((v) => {
          const params = new URLSearchParams();
          if (weekOffset) params.set("weekOffset", String(weekOffset));
          if (startParam) params.set("start", startParam);
          if (endParam) params.set("end", endParam);
          if (v === "points") params.set("view", "points");
          const href = `/leaderboard${params.toString() ? `?${params}` : ""}`;
          return (
            <Link
              key={v}
              href={href}
              className={`rounded-lg px-3 py-1 ${
                view === v
                  ? "bg-accent text-white"
                  : "border border-border bg-card text-muted hover:bg-black/5"
              }`}
            >
              By {v}
            </Link>
          );
        })}
      </div>

      <LeaderboardTable
        stats={stats}
        streaksByMemberId={isCurrentWeek ? streaksByMemberId : null}
        badgesByMemberId={badgesByMemberId}
        targetByMemberId={targetByMemberId}
        defaultTarget={defaultTarget}
        valueLabel={view}
        pointsPerPost={POINTS_PER_POST}
        showTargetControls={isCurrentWeek}
      />
    </div>
  );
}
