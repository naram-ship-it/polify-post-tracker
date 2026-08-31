import Link from "next/link";
import { getStatsForRange } from "@/lib/posts";
import { startOfWeek, endOfWeek, shiftWeek, toDateInputValue } from "@/lib/week";

function formatRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

export default async function LeaderboardPage(
  props: PageProps<"/leaderboard">
) {
  const searchParams = await props.searchParams;
  const startParam = typeof searchParams.start === "string" ? searchParams.start : undefined;
  const endParam = typeof searchParams.end === "string" ? searchParams.end : undefined;
  const weekOffsetParam = typeof searchParams.weekOffset === "string" ? searchParams.weekOffset : "0";

  const customRange = Boolean(startParam && endParam);

  let start: Date;
  let end: Date;
  const weekOffset = Number.parseInt(weekOffsetParam, 10) || 0;

  if (customRange && startParam && endParam) {
    start = new Date(startParam + "T00:00:00");
    end = new Date(endParam + "T23:59:59");
  } else {
    const base = shiftWeek(new Date(), weekOffset);
    start = startOfWeek(base);
    end = endOfWeek(base);
  }

  const stats = await getStatsForRange(start, end);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Leaderboard</h1>
      <p className="mb-4 text-sm text-muted">{formatRange(start, end)}</p>

      {!customRange && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link
            href={`/leaderboard?weekOffset=${weekOffset - 1}`}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
          >
            ← Previous week
          </Link>
          {weekOffset !== 0 && (
            <Link
              href="/leaderboard"
              className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
            >
              This week
            </Link>
          )}
          <Link
            href={`/leaderboard?weekOffset=${weekOffset + 1}`}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
          >
            Next week →
          </Link>
        </div>
      )}
      {customRange && (
        <div className="mb-4">
          <Link href="/leaderboard" className="text-sm text-accent underline">
            ← Back to weekly view
          </Link>
        </div>
      )}

      <details className="mb-4 rounded-lg border border-border bg-card p-3" open={customRange}>
        <summary className="cursor-pointer text-sm font-medium">
          Custom date range
        </summary>
        <form className="mt-3 flex flex-wrap items-end gap-3" action="/leaderboard">
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <input
              type="date"
              name="start"
              defaultValue={toDateInputValue(start)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <input
              type="date"
              name="end"
              defaultValue={toDateInputValue(end)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            View range
          </button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium text-right">X</th>
              <th className="px-4 py-2 font-medium text-right">LinkedIn</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No team members yet.
                </td>
              </tr>
            )}
            {stats.map((s, i) => (
              <tr
                key={s.memberId}
                className={i !== stats.length - 1 ? "border-b border-border" : ""}
              >
                <td className="px-4 py-2 text-muted">{i + 1}</td>
                <td className="px-4 py-2 font-medium">
                  {s.memberName}
                  {!s.active && (
                    <span className="ml-1.5 text-xs text-muted">(inactive)</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">{s.xCount}</td>
                <td className="px-4 py-2 text-right">{s.linkedinCount}</td>
                <td className="px-4 py-2 text-right font-semibold">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
