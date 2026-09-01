"use client";

import { useActionState, useEffect, useRef } from "react";
import { quickLogPostAction, type QuickLogState } from "@/app/actions";
import { useIdentity } from "@/components/identity";
import { PostingAsBadge } from "@/components/PostingAsBadge";
import type { MemberOption } from "@/components/Chrome";
import type { ActiveQuestJoin } from "@/lib/quests";

export function QuickAddBar({
  members,
  activeQuestsByMemberId,
}: {
  members: MemberOption[];
  activeQuestsByMemberId: Map<string, ActiveQuestJoin[]>;
}) {
  const { memberId } = useIdentity();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<QuickLogState, FormData>(
    quickLogPostAction,
    {}
  );
  const myQuests = memberId ? activeQuestsByMemberId.get(memberId) ?? [] : [];

  useEffect(() => {
    // Depend on `state` itself, not `state.ok` — useActionState returns a
    // new object on every successful submit, but the boolean value stays
    // `true` across repeats, so keying off the primitive would only fire
    // this effect once and silently stop resetting the form after that.
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mb-4">
      <PostingAsBadge members={members} />

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <form ref={formRef} action={action} className="flex flex-wrap gap-2">
          <input type="hidden" name="memberId" value={memberId} />
          <input
            type="url"
            name="url"
            placeholder="Paste your X post link…"
            required
            disabled={!memberId}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || !memberId}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Posting…" : "Post"}
          </button>
          {myQuests.length > 0 && (
            <div className="w-full">
              <label className="mb-1 block text-xs font-semibold text-muted">
                Apply to a quest (optional)
              </label>
              <select
                name="questId"
                defaultValue=""
                className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-1.5 text-xs"
              >
                <option value="">None</option>
                {myQuests.map((q) => (
                  <option key={q.questId} value={q.questId}>
                    {q.title} ({q.progress}/{q.target})
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
        {state.error && <p className="mt-1.5 text-xs text-red-600">{state.error}</p>}
        {state.ok && <p className="mt-1.5 text-xs text-muted">Logged.</p>}
      </div>
    </div>
  );
}
