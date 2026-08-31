"use client";

import { useActionState, useState } from "react";
import type { Prisma } from "@prisma/client";
import {
  addReactionAction,
  addCommentAction,
  deletePostAction,
  setPostOfWeekAction,
  type AddCommentState,
} from "@/app/actions";
import { useIdentity } from "@/components/identity";
import { EditPostForm } from "@/components/EditPostForm";
import type { MemberOption } from "@/components/Chrome";
import { avatarColor } from "@/lib/avatarColor";

export type FeedPost = Prisma.PostGetPayload<{
  include: {
    member: true;
    comments: { include: { member: true } };
  };
}>;

const QUICK_EMOJIS = ["👍", "🔥", "❤️", "👀"];

function formatDate(d: Date | string) {
  // Fixed locale (not `undefined`) so server and client render identical
  // text regardless of the host OS's or browser's locale — otherwise this
  // mismatches and triggers a hydration error.
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PostCard({ post, members }: { post: FeedPost; members: MemberOption[] }) {
  const { memberId } = useIdentity();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    await deletePostAction(post.id);
  }

  async function togglePostOfWeek() {
    await setPostOfWeekAction(post.id);
  }

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <EditPostForm post={post} members={members} onDone={() => setIsEditing(false)} />
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        post.isPostOfWeek ? "border-amber-300 bg-amber-50" : "border-border bg-card"
      }`}
    >
      {post.isPostOfWeek && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
          ⭐ Post of the Week
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ backgroundColor: avatarColor(post.member.name) }}
            >
              {post.member.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-semibold">{post.member.name}</span>
            <span className="text-muted">{formatDate(post.postedAt)}</span>
          </div>
          {post.previewText && (
            <p className="mt-1.5 border-l-2 border-border pl-2 text-sm italic text-foreground/80">
              “{post.previewText}”
            </p>
          )}
          {post.note && (
            <p className="mt-1.5 text-sm text-foreground/90">{post.note}</p>
          )}
          <div className="mt-1.5 flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-accent underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={togglePostOfWeek}
              className="text-amber-700 underline"
            >
              {post.isPostOfWeek ? "Unmark Post of the Week" : "Mark as Post of the Week"}
            </button>
          </div>
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
