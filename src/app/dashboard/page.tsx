import Link from "next/link";
import {
  getStatsForRange,
  getTeamWeeklyTotals,
  getPostingTimeHeatmap,
  getTopPostsByEngagement,
  getRecentPostsByMemberMap,
  getDaysPostedThisWeekByMember,
} from "@/lib/posts";
import { getStreaks } from "@/lib/streaks";
import { getActiveQuestJoinsByMemberMap, getQuestProgress } from "@/lib/quests";
import { countEngagementForRange } from "@/lib/comments";
import { startOfWeek, endOfWeek, toDateInputValue } from "@/lib/week";
import { PersonalDashboard } from "@/components/dashboard/PersonalDashboard";
import { StatCards } from "@/components/dashboard/StatCards";
import { BestTimeHeatmap } from "@/components/dashboard/BestTimeHeatmap";
import { TeamShareCard } from "@/components/dashboard/TeamShareCard";
import { DayOfWeekCard } from "@/components/dashboard/DayOfWeekCard";
import { TopPostsTable } from "@/components/dashboard/TopPostsTable";
import { StreaksQuestsRow } from "@/components/dashboard/StreaksQuestsRow";
import { TeamActivityChart } from "@/components/TeamActivityChart";

const CHART_WEEKS = 8;
const TOP_POSTS_LIMIT = 5;
const RECENT_POSTS_PER_MEMBER = 3;

export default async function DashboardPage() {
  const now = new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);

  const [
    stats,
    streaks,
    engagementCount,
    teamWeeklyTotals,
    timeHeatmap,
    topPosts,
    questProgress,
    recentPostsByMemberId,
    daysPostedByMemberId,
    activeQuestsByMemberId,
  ] = await Promise.all([
    getStatsForRange(start, end),
    getStreaks(),
    countEngagementForRange(start, end),
    getTeamWeeklyTotals(CHART_WEEKS),
    getPostingTimeHeatmap(),
    getTopPostsByEngagement(start, end, TOP_POSTS_LIMIT),
    getQuestProgress(),
    getRecentPostsByMemberMap(RECENT_POSTS_PER_MEMBER),
    getDaysPostedThisWeekByMember(),
    getActiveQuestJoinsByMemberMap(),
  ]);

  const postsThisPeriod = stats.reduce((sum, s) => sum + s.total, 0);
  const activeStreaks = streaks.filter((s) => s.streak > 0).length;

  const streaksByMemberId = new Map(streaks.map((s) => [s.memberId, s]));
  const postsThisWeekByMemberId = new Map(stats.map((s) => [s.memberId, s.total]));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Whole-team posting activity — {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" – "}
            {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          + Log a post
        </Link>
      </div>

      <div className="mt-5">
        <PersonalDashboard
          postsThisWeekByMemberId={postsThisWeekByMemberId}
          streaksByMemberId={streaksByMemberId}
          recentPostsByMemberId={recentPostsByMemberId}
          daysPostedByMemberId={daysPostedByMemberId}
          activeQuestsByMemberId={activeQuestsByMemberId}
        />

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
            🌍 Whole team
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-4">
          <StatCards
            postsThisPeriod={postsThisPeriod}
            activeStreaks={activeStreaks}
            engagementCount={engagementCount}
            periodKey={toDateInputValue(start)}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TeamActivityChart data={teamWeeklyTotals} />
            <TeamShareCard stats={stats} />
            <DayOfWeekCard timeHeatmap={timeHeatmap} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <TopPostsTable posts={topPosts} />
            <BestTimeHeatmap grid={timeHeatmap} />
          </div>

          <StreaksQuestsRow
            streaks={streaks}
            questTotal={questProgress.total}
            completedByMember={questProgress.completedByMember}
          />
        </div>
      </div>
    </div>
  );
}
