"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logPostAction, type LogPostState } from "@/app/actions";
import { useIdentity } from "@/components/identity";
import { PostingAsBadge } from "@/components/PostingAsBadge";
import type { MemberOption } from "@/components/Chrome";

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function LogPostForm({ members }: { members: MemberOption[] }) {
  const { memberId } = useIdentity();
  const router = useRouter();
  const [state, action, pending] = useActionState<LogPostState, FormData>(
    logPostAction,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="memberId" value={memberId} />
      <PostingAsBadge members={members} />

      <div>
        <label className="mb-1 block text-sm font-medium">Post URL</label>
        <input
          type="url"
          name="url"
          placeholder="https://x.com/..."
          required
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Date</label>
        <input
          type="date"
          name="postedAt"
          defaultValue={todayInputValue()}
          required
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Note (optional)</label>
        <textarea
          name="note"
          rows={2}
          placeholder="Short caption or context…"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !memberId}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log post"}
      </button>
    </form>
  );
}
