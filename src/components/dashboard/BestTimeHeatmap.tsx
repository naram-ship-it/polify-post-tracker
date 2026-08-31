import { TIME_BUCKET_LABELS } from "@/lib/posts";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function levelClass(count: number, max: number): string {
  if (count === 0) return "bg-border";
  const ratio = count / Math.max(1, max);
  if (ratio > 0.75) return "bg-[var(--gold)]";
  if (ratio > 0.5) return "bg-accent";
  if (ratio > 0.25) return "bg-accent/65";
  return "bg-accent/35";
}

export function BestTimeHeatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const hasAnyData = grid.some((row) => row.some((c) => c > 0));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">Best time to post</h3>
      {!hasAnyData ? (
        <p className="mt-3 text-sm text-muted">
          Not enough posts logged yet to see a pattern — check back after a few weeks.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="border-separate" style={{ borderSpacing: "3px" }}>
            <thead>
              <tr>
                <th></th>
                {TIME_BUCKET_LABELS.map((l) => (
                  <th
                    key={l}
                    className="pb-1 text-center font-mono text-[10px] font-normal text-muted"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_LABELS.map((day, row) => (
                <tr key={day}>
                  <th className="pr-2 text-left font-mono text-[10px] font-normal text-muted">
                    {day}
                  </th>
                  {grid[row].map((count, col) => (
                    <td key={col}>
                      <div
                        title={`${day} ${TIME_BUCKET_LABELS[col]}: ${count} post${count === 1 ? "" : "s"}`}
                        className={`h-[18px] w-[26px] rounded ${levelClass(count, max)}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
