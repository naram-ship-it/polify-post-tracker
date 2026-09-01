import { prisma } from "@/lib/prisma";
import { PostSource } from "@prisma/client";
import { startOfWeek, shiftWeek, toDateInputValue } from "@/lib/week";

// --- Data access layer ---------------------------------------------------
// Everything that reads or writes Post rows lives here, kept separate from
// the UI (app/**/page.tsx) and separate from *how* a post enters the system.
//
// Today the only writer is `createManualPost`, called from the manual log
// form. Later, an automatic X API puller can call the lower-level
// `createPost` with `source: "X_API"` from a cron job / route handler and
// write into this same table — the feed and leaderboard queries below don't
// know or care where a row came from, so no schema or UI change is needed.

export type NewPostInput = {
  memberId: string;
  url: string;
  postedAt: Date;
  note?: string | null;
  previewText?: string | null;
};

async function createPost(input: NewPostInput & { source: PostSource }) {
  return prisma.post.create({
    data: {
      memberId: input.memberId,
      url: input.url,
      postedAt: input.postedAt,
      note: input.note || null,
      previewText: input.previewText || null,
      source: input.source,
    },
  });
}

export async function createManualPost(input: NewPostInput) {
  return createPost({ ...input, source: PostSource.MANUAL });
}

export function isXUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host === "twitter.com" ||
    host.endsWith(".twitter.com")
  );
}

const feedInclude = {
  member: true,
  comments: {
    include: { member: true },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getFeedPosts() {
  return prisma.post.findMany({
    include: feedInclude,
    // The Post of the Week (at most one) is always pinned to the top,
    // regardless of when it was posted.
    orderBy: [{ isPostOfWeek: "desc" }, { postedAt: "desc" }],
  });
}

export async function getPost(id: string) {
  return prisma.post.findUnique({ where: { id } });
}

export type TopPost = {
  id: string;
  memberName: string;
  url: string;
  postedAt: Date;
  engagement: number;
};

// Ranked by engagement (reactions + comments) we actually track today —
// real "reach" needs the X API, so it isn't used for sorting here.
export async function getTopPostsByEngagement(
  start: Date,
  end: Date,
  limit: number
): Promise<TopPost[]> {
  const posts = await prisma.post.findMany({
    where: { postedAt: { gte: start, lte: end } },
    include: { member: true, _count: { select: { comments: true } } },
    orderBy: { postedAt: "desc" },
  });

  return posts
    .map((p) => ({
      id: p.id,
      memberName: p.member.name,
      url: p.url,
      postedAt: p.postedAt,
      engagement: p._count.comments,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

// 1 point per post today (flat). Kept as a named constant, not inlined, so a
// future weighting scheme (streak bonuses, engagement) only needs to change
// this one spot.
export const POINTS_PER_POST = 1;

export async function getLifetimePostCounts(): Promise<Map<string, number>> {
  const rows = await prisma.post.groupBy({
    by: ["memberId"],
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.memberId, r._count._all]));
}

export type WeeklyStat = {
  memberId: string;
  memberName: string;
  active: boolean;
  total: number;
};

export async function getStatsForRange(start: Date, end: Date): Promise<WeeklyStat[]> {
  const members = await prisma.teamMember.findMany({
    orderBy: { name: "asc" },
  });

  const posts = await prisma.post.findMany({
    where: { postedAt: { gte: start, lte: end } },
    select: { memberId: true },
  });

  const stats = new Map<string, WeeklyStat>();
  for (const m of members) {
    stats.set(m.id, { memberId: m.id, memberName: m.name, active: m.active, total: 0 });
  }

  for (const p of posts) {
    const s = stats.get(p.memberId);
    if (!s) continue;
    s.total += 1;
  }

  return Array.from(stats.values())
    .filter((s) => s.active || s.total > 0)
    .sort((a, b) => b.total - a.total);
}

export type WeeklyTeamTotal = { weekStart: string; label: string; total: number };

// Team-wide post counts for the last `weeks` Monday–Sunday weeks (oldest
// first), for the leaderboard's activity chart.
export async function getTeamWeeklyTotals(weeks: number): Promise<WeeklyTeamTotal[]> {
  const thisWeekStart = startOfWeek(new Date());
  const rangeStart = shiftWeek(thisWeekStart, -(weeks - 1));

  const posts = await prisma.post.findMany({
    where: { postedAt: { gte: rangeStart } },
    select: { postedAt: true },
  });

  const countByWeek = new Map<string, number>();
  for (const p of posts) {
    const key = toDateInputValue(startOfWeek(p.postedAt));
    countByWeek.set(key, (countByWeek.get(key) ?? 0) + 1);
  }

  const result: WeeklyTeamTotal[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = shiftWeek(rangeStart, i);
    const key = toDateInputValue(weekStart);
    result.push({
      weekStart: key,
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: countByWeek.get(key) ?? 0,
    });
  }
  return result;
}

// Each active member's most recent posts (up to `limit`), for the personal
// "Your recent posts" dashboard section. One query for the whole team
// rather than one per member.
export async function getRecentPostsByMemberMap(
  limit: number
): Promise<Map<string, TopPost[]>> {
  const posts = await prisma.post.findMany({
    include: { member: true, _count: { select: { comments: true } } },
    orderBy: { postedAt: "desc" },
    take: 200,
  });

  const byMember = new Map<string, TopPost[]>();
  for (const p of posts) {
    const list = byMember.get(p.memberId) ?? [];
    if (list.length >= limit) continue;
    list.push({
      id: p.id,
      memberName: p.member.name,
      url: p.url,
      postedAt: p.postedAt,
      engagement: p._count.comments,
    });
    byMember.set(p.memberId, list);
  }
  return byMember;
}

// Which days (Mon..Sun) each member posted on, for the current week — the
// day-by-day tracker in "Your weekly progress".
export async function getDaysPostedThisWeekByMember(): Promise<Map<string, boolean[]>> {
  const start = startOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const posts = await prisma.post.findMany({
    where: { postedAt: { gte: start, lt: end } },
    select: { memberId: true, postedAt: true },
  });

  const byMember = new Map<string, boolean[]>();
  for (const p of posts) {
    const days = byMember.get(p.memberId) ?? Array(7).fill(false);
    const jsDay = new Date(p.postedAt).getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0 = Monday .. 6 = Sunday
    days[dayIndex] = true;
    byMember.set(p.memberId, days);
  }
  return byMember;
}

export const TIME_BUCKET_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

// 7 (Mon..Sun) x 8 (3-hour bucket) grid of post counts, all-time — for the
// "best time to post" heatmap.
export async function getPostingTimeHeatmap(): Promise<number[][]> {
  const posts = await prisma.post.findMany({ select: { postedAt: true } });
  const grid = Array.from({ length: 7 }, () => Array(8).fill(0) as number[]);

  for (const p of posts) {
    const d = new Date(p.postedAt);
    const jsDay = d.getDay(); // 0 = Sunday
    const row = jsDay === 0 ? 6 : jsDay - 1; // 0 = Monday .. 6 = Sunday
    const bucket = Math.floor(d.getHours() / 3);
    grid[row][bucket] += 1;
  }

  return grid;
}
