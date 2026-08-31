import { avatarColor } from "@/lib/avatarColor";
import type { MemberStreak } from "@/lib/streaks";

export function StreaksQuestsRow({
  streaks,
  questTotal,
  completedByMember,
}: {
  streaks: MemberStreak[];
  questTotal: number;
  completedByMember: Map<string, number>;
}) {
  if (streaks.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2.5 mt-6 text-[15px] font-bold">Streaks & quests</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {streaks.map((s) => {
          const completed = completedByMember.get(s.memberId) ?? 0;
          return (
            <div
              key={s.memberId}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white"
                style={{ backgroundColor: avatarColor(s.memberName) }}
              >
                {s.memberName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold">{s.memberName}</div>
                <div className="text-xs text-muted">
                  {s.streak > 0 ? `🔥 ${s.streak}-week streak` : "No active streak"}
                </div>
                {questTotal > 0 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10.5px] font-bold text-green-700">
                    ✓ {completed} of {questTotal} quests
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
