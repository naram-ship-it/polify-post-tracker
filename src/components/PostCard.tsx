"use client";

import { useActionState, useState } from "react";
import type { Prisma } from "@prisma/client";
import { addReactionAction, addCommentAction, type AddCommentState } from "@/app/actions";
import { useIdentity } from "@/components/identity";

export type FeedPost = Prisma.PostGetPayload<{
  include: {
    member: true;
    comments: { include: { member: true } };
  };
}>;

const QUICK_EMOJIS = ["👍", "🔥", "❤️", "👀"];

function platformLabel(platform: string) {
  return platform === "X" ? "X" : "LinkedIn";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PostCard({ post }: { post: FeedPost }) {
  const { memberId } = useIdentity();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentState, commentAction, commentPending] = useActionState<
    AddCommentState,
    FormData
  >(addCommentAction.bind(null, post.id), {});

  const emojiComments = post.comments.filter((c) => c.type === "EMOJI");
  const textComments = post.comments.filter((c) => c.type === "TEXT");

  const emojiCounts = new Map<string, number>();
  for (const c of emojiComments) {
    if (!c.emoji) continue;
    emojiCounts.set(c.emoji, (emojiCounts.get(c.emoji) || 0) + 1);
  }

  async function react(emoji: string) {
    if (!memberId) {
      alert("Pick who you are from the dropdown at the top first.");
      return;
    }
    await addReactionAction(post.id, memberId, emoji);
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{post.member.name}</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {platformLabel(post.platform)}
            </span>
            <span className="text-muted">{formatDate(post.postedAt)}</span>
          </div>
          {post.note && (
            <p className="mt-1.5 text-sm text-foreground/90">{post.note}</p>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          View post ↗
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => react(emoji)}
            className="rounded-full border border-border px-2.5 py-1 text-sm hover:bg-black/5"
            title="React"
          >
            {emoji}
            {emojiCounts.get(emoji) ? (
              <span className="ml-1 text-xs text-muted">{emojiCounts.get(emoji)}</span>
            ) : null}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCommentBox((s) => !s)}
          className="ml-auto rounded-full border border-border px-2.5 py-1 text-sm hover:bg-black/5"
        >
          💬 Comment{textComments.length ? ` (${textComments.length})` : ""}
        </button>
      </div>

      {textComments.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {textComments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.member.name}:</span>{" "}
              <span className="text-foreground/90">{c.text}</span>
            </li>
          ))}
        </ul>
      )}

      {showCommentBox && (
        <form action={commentAction} className="mt-3 flex gap-2 border-t border-border pt-3">
          <input type="hidden" name="memberId" value={memberId} />
          <input
            type="text"
            name="text"
            placeholder="Quick comment, e.g. “engaged”"
            maxLength={280}
            required
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={commentPending || !memberId}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Post
          </button>
        </form>
      )}
      {showCommentBox && !memberId && (
        <p className="mt-1.5 text-xs text-muted">
          Pick who you are from the dropdown at the top to comment.
        </p>
      )}
      {showCommentBox && commentState.error && (
        <p className="mt-1.5 text-xs text-red-600">{commentState.error}</p>
      )}
    </article>
  );
}
