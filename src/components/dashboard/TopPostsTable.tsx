import type { TopPost } from "@/lib/posts";
import { exampleReach } from "@/lib/exampleMetrics";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TopPostsTable({ posts }: { posts: TopPost[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">Top posts by engagement</h3>
      {posts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No posts logged this period yet.</p>
      ) : (
        <>
          <table className="mt-4 w-full min-w-[380px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-border pb-2 text-left font-mono text-[10px] font-normal uppercase tracking-wide text-muted">
                  Person
                </th>
                <th className="border-b border-border pb-2 text-left font-mono text-[10px] font-normal uppercase tracking-wide text-muted">
                  Date
                </th>
                <th className="border-b border-border pb-2 text-right font-mono text-[10px] font-normal uppercase tracking-wide text-muted">
                  Reach*
                </th>
                <th className="border-b border-border pb-2 text-right font-mono text-[10px] font-normal uppercase tracking-wide text-muted">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="border-b border-border/60 py-2.5 text-sm font-medium">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {p.memberName}
                    </a>
                  </td>
                  <td className="border-b border-border/60 py-2.5 text-sm text-muted">
                    {formatDate(p.postedAt)}
                  </td>
                  <td className="border-b border-border/60 py-2.5 text-right font-mono text-sm tabular-nums text-muted">
                    {exampleReach(p.id).toLocaleString()}
                  </td>
                  <td className="border-b border-border/60 py-2.5 text-right font-mono text-sm font-semibold tabular-nums">
                    {p.engagement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            *Reach is example data until X is connected — sorting switches to real reach automatically once it is.
          </p>
        </>
      )}
    </div>
  );
}
