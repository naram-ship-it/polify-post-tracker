import Link from "next/link";
import { getFeedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export default async function FeedPage() {
  const posts = await getFeedPosts();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Feed</h1>
        <Link
          href="/log"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Log a post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No posts logged yet. Be the first —{" "}
          <Link href="/log" className="text-accent underline">
            log one
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
