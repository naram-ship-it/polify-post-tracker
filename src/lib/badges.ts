// Badges reflect current status, not permanent achievements: a streak badge
// disappears if the streak breaks, and a post-count badge would disappear
// if posts were deleted back below the threshold. Computed live from
// existing data — no separate table to keep in sync.

export type Badge = { emoji: string; label: string };

const POST_COUNT_MILESTONES: { count: number; badge: Badge }[] = [
  { count: 1, badge: { emoji: "🎉", label: "First post" } },
  { count: 5, badge: { emoji: "✋", label: "5 posts" } },
];

const STREAK_MILESTONES: { weeks: number; badge: Badge }[] = [
  { weeks: 4, badge: { emoji: "🔥", label: "4-week streak" } },
  { weeks: 10, badge: { emoji: "🚀", label: "10-week streak" } },
];

export function computeBadges(lifetimePosts: number, streak: number): Badge[] {
  const badges: Badge[] = [];
  for (const m of POST_COUNT_MILESTONES) {
    if (lifetimePosts >= m.count) badges.push(m.badge);
  }
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.weeks) badges.push(m.badge);
  }
  return badges;
}
