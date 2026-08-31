import { exampleTotalReach, formatCompact } from "@/lib/exampleMetrics";

export function StatCards({
  postsThisPeriod,
  activeStreaks,
  engagementCount,
  periodKey,
}: {
  postsThisPeriod: number;
  activeStreaks: number;
  engagementCount: number;
  periodKey: string;
}) {
  const reach = exampleTotalReach(periodKey);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-2xl bg-gradient-to-br from-accent to-[#ff7a5c] p-4 text-[#1a0e0e] shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[100px] text-xs text-[#1a0e0e]/75">Total posts</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1a0e0e]/15 text-base">
            📝
          </div>
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tabular-nums">{postsThisPeriod}</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[100px] text-xs text-muted">Total reach*</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-peri/15 text-base">
            👁
          </div>
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tabular-nums">{formatCompact(reach)}</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[100px] text-xs text-muted">Total comments</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal/15 text-base">
            💬
          </div>
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tabular-nums">{engagementCount}</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[100px] text-xs text-muted">Active streaks</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gold/15 text-base">
            🔥
          </div>
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tabular-nums">{activeStreaks}</div>
      </div>
      <p className="col-span-2 -mt-1 text-[11px] text-muted sm:col-span-4">
        *Reach is example data until X is connected.
      </p>
    </div>
  );
}
