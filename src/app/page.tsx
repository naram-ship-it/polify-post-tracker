import Link from "next/link";
import { getFeedPosts } from "@/lib/posts";
import { getStreaks } from "@/lib/streaks";
import { getActiveMembers } from "@/lib/team";
import { PostCard } from "@/components/PostCard";
import { QuickAddBar } from "@/components/QuickAddBar";
import { StreakBar } from "@/components/StreakBar";

export default async function FeedPage() {
  const [posts, streaks, members] = await Promise.all([
    getFeedPosts(),
    getStreaks(),
    getActiveMembers(),
  ]);
  const memberOptions = members.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Feed</h1>
          <p className="mt-1 text-sm text-muted">
            See what the team&apos;s been posting — newest first.
          </p>
        </div>
        <Link
          href="/log"
          className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold shadow-sm"
        >
          Full form ↗
        </Link>
      </div>

      <StreakBar streaks={streaks} />

      <QuickAddBar members={memberOptions} />

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No posts logged yet. Be the first — drop a link above.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} members={memberOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
