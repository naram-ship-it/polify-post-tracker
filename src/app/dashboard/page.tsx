import Link from "next/link";
import { getStatsForRange, getTeamWeeklyTotals, getPostingTimeHeatmap, getTopPostsByEngagement } from "@/lib/posts";
import { getStreaks } from "@/lib/streaks";
import { countEngagementForRange } from "@/lib/comments";
import { getQuestProgress } from "@/lib/quests";
import { startOfWeek, endOfWeek, toDateInputValue } from "@/lib/week";
import { StatCards } from "@/components/dashboard/StatCards";
import { BestTimeHeatmap } from "@/components/dashboard/BestTimeHeatmap";
import { TeamShareCard } from "@/components/dashboard/TeamShareCard";
import { DayOfWeekCard } from "@/components/dashboard/DayOfWeekCard";
import { TopPostsTable } from "@/components/dashboard/TopPostsTable";
import { StreaksQuestsRow } from "@/components/dashboard/StreaksQuestsRow";
import { TeamActivityChart } from "@/components/TeamActivityChart";

const CHART_WEEKS = 8;
const TOP_POSTS_LIMIT = 5;

export default async function DashboardPage() {
  const now = new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);

  const [stats, streaks, engagementCount, teamWeeklyTotals, timeHeatmap, topPosts, questProgress] =
    await Promise.all([
      getStatsForRange(start, end),
      getStreaks(),
      countEngagementForRange(start, end),
      getTeamWeeklyTotals(CHART_WEEKS),
      getPostingTimeHeatmap(),
      getTopPostsByEngagement(start, end, TOP_POSTS_LIMIT),
      getQuestProgress(),
    ]);

  const postsThisPeriod = stats.reduce((sum, s) => sum + s.total, 0);
  const activeStreaks = streaks.filter((s) => s.streak > 0).length;

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
          href="/log"
          className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          + Log a post
        </Link>
      </div>

      <div className="mt-5 space-y-4">
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
  );
}
