import { prisma } from "@/lib/prisma";
import { Platform, PostSource } from "@prisma/client";

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
  platform: Platform;
  url: string;
  postedAt: Date;
  note?: string | null;
};

async function createPost(input: NewPostInput & { source: PostSource }) {
  return prisma.post.create({
    data: {
      memberId: input.memberId,
      platform: input.platform,
      url: input.url,
      postedAt: input.postedAt,
      note: input.note || null,
      source: input.source,
    },
  });
}

export async function createManualPost(input: NewPostInput) {
  return createPost({ ...input, source: PostSource.MANUAL });
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
    orderBy: { postedAt: "desc" },
  });
}

export type WeeklyStat = {
  memberId: string;
  memberName: string;
  active: boolean;
  xCount: number;
  linkedinCount: number;
  total: number;
};

export async function getStatsForRange(start: Date, end: Date): Promise<WeeklyStat[]> {
  const members = await prisma.teamMember.findMany({
    orderBy: { name: "asc" },
  });

  const posts = await prisma.post.findMany({
    where: { postedAt: { gte: start, lte: end } },
    select: { memberId: true, platform: true },
  });

  const stats = new Map<string, WeeklyStat>();
  for (const m of members) {
    stats.set(m.id, {
      memberId: m.id,
      memberName: m.name,
      active: m.active,
      xCount: 0,
      linkedinCount: 0,
      total: 0,
    });
  }

  for (const p of posts) {
    const s = stats.get(p.memberId);
    if (!s) continue;
    if (p.platform === Platform.X) s.xCount += 1;
    else s.linkedinCount += 1;
    s.total += 1;
  }

  return Array.from(stats.values())
    .filter((s) => s.active || s.total > 0)
    .sort((a, b) => b.total - a.total);
}
