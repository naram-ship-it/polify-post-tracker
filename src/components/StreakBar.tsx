import type { MemberStreak } from "@/lib/streaks";

export function StreakBar({ streaks }: { streaks: MemberStreak[] }) {
  if (streaks.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {streaks.map((s) => (
        <div
          key={s.memberId}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
            s.closeToMissing
              ? "border-red-300 bg-red-50"
              : "border-border bg-card"
          }`}
        >
          <span
            className={s.qualifiesThisWeek ? "text-green-600" : "text-muted"}
            title={
              s.qualifiesThisWeek
                ? "Hit this week's goal"
                : `${s.postsThisWeek}/${s.target} this week`
            }
          >
            {s.qualifiesThisWeek ? "✓" : `${s.postsThisWeek}/${s.target}`}
          </span>
          <span className="font-medium">{s.memberName}</span>
          {s.streak > 0 && (
            <span className="text-muted">
              🔥 {s.streak} {s.streak === 1 ? "week" : "weeks"}
            </span>
          )}
          {s.closeToMissing && (
            <span className="font-medium text-red-700">
              ⚠️ {s.target - s.postsThisWeek} more needed
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
