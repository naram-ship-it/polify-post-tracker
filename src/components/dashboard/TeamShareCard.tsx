import { avatarColor } from "@/lib/avatarColor";
import type { WeeklyStat } from "@/lib/posts";

export function TeamShareCard({ stats }: { stats: WeeklyStat[] }) {
  const total = stats.reduce((sum, s) => sum + s.total, 0);
  const withShare = stats
    .map((s) => ({ ...s, pct: total > 0 ? Math.round((s.total / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">Team share</h3>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">No posts logged this period yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {withShare.map((s) => (
            <div key={s.memberId}>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: avatarColor(s.memberName) }}
                />
                <span className="flex-1 truncate">{s.memberName}</span>
                <span className="font-bold">{s.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, backgroundColor: avatarColor(s.memberName) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
