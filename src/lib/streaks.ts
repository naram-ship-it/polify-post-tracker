import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, shiftWeek, toDateInputValue } from "@/lib/week";
import { getDefaultWeeklyTarget } from "@/lib/settings";

export type MemberStreak = {
  memberId: string;
  memberName: string;
  streak: number;
  postsThisWeek: number;
  target: number;
  qualifiesThisWeek: boolean;
  // True when the week is nearly over (<=2 days left) and the target
  // hasn't been hit yet — a nudge to post before the week resets.
  closeToMissing: boolean;
};

// A "streak week" is a Monday–Sunday week where a member logged at least
// their weekly target (TeamMember.weeklyTarget, falling back to
// AppSettings.defaultWeeklyTarget). The current week counts toward the
// streak once it hits the target; until then it's tracked separately via
// `postsThisWeek`/`qualifiesThisWeek` so a nudge can call it out without
// prematurely zeroing someone's streak before their week is over.
export async function getStreaks(): Promise<MemberStreak[]> {
  const [members, defaultTarget] = await Promise.all([
    prisma.teamMember.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getDefaultWeeklyTarget(),
  ]);

  const posts = await prisma.post.findMany({ select: { memberId: true, postedAt: true } });

  const countsByMember = new Map<string, Map<string, number>>();
  for (const p of posts) {
    const key = toDateInputValue(startOfWeek(p.postedAt));
    if (!countsByMember.has(p.memberId)) countsByMember.set(p.memberId, new Map());
    const weekCounts = countsByMember.get(p.memberId)!;
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }

  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const thisWeekKey = toDateInputValue(thisWeekStart);
  const thisWeekEnd = endOfWeek(now);
  const daysLeftInWeek = (thisWeekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  return members.map((m) => {
    const target = m.weeklyTarget ?? defaultTarget;
    const weekCounts = countsByMember.get(m.id) ?? new Map<string, number>();
    const postsThisWeek = weekCounts.get(thisWeekKey) ?? 0;
    const qualifiesThisWeek = postsThisWeek >= target;
    const closeToMissing = !qualifiesThisWeek && daysLeftInWeek <= 2;

    let streak = 0;
    let cursor = qualifiesThisWeek ? thisWeekStart : shiftWeek(thisWeekStart, -1);
    while ((weekCounts.get(toDateInputValue(cursor)) ?? 0) >= target) {
      streak++;
      cursor = shiftWeek(cursor, -1);
    }

    return {
      memberId: m.id,
      memberName: m.name,
      streak,
      postsThisWeek,
      target,
      qualifiesThisWeek,
      closeToMissing,
    };
  });
}
