"use client";

import { useActionState, useEffect } from "react";
import { updatePostAction, type EditPostState } from "@/app/actions";
import { toDateInputValue } from "@/lib/week";
import type { FeedPost } from "@/components/PostCard";
import type { MemberOption } from "@/components/Chrome";

export function EditPostForm({
  post,
  members,
  onDone,
}: {
  post: FeedPost;
  members: MemberOption[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<EditPostState, FormData>(
    updatePostAction.bind(null, post.id),
    {}
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted">Posted by</label>
        <select
          name="memberId"
          defaultValue={post.memberId}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="url"
        name="url"
        defaultValue={post.url}
        required
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />

      <input
        type="date"
        name="postedAt"
        defaultValue={toDateInputValue(post.postedAt)}
        required
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />

      <textarea
        name="note"
        rows={2}
        defaultValue={post.note ?? ""}
        placeholder="Note (optional)"
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
