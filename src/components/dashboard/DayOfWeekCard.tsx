const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// `timeHeatmap` is the 7 (day) x N (time bucket) grid from
// getPostingTimeHeatmap — summing each row gives posts per day of week.
export function DayOfWeekCard({ timeHeatmap }: { timeHeatmap: number[][] }) {
  const totals = timeHeatmap.map((row) => row.reduce((sum, n) => sum + n, 0));
  const max = Math.max(1, ...totals);
  const hasData = totals.some((n) => n > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">Posts by day of week</h3>
      {!hasData ? (
        <p className="mt-3 text-sm text-muted">No posts logged yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {DAY_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 text-muted">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${(totals[i] / max) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right font-mono font-semibold">
                {totals[i]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
