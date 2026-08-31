"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { quickLogPostAction, type QuickLogState } from "@/app/actions";
import { useIdentity } from "@/components/identity";

export function QuickAddBar() {
  const { memberId } = useIdentity();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<QuickLogState, FormData>(
    quickLogPostAction,
    {}
  );

  useEffect(() => {
    // Depend on `state` itself, not `state.ok` — useActionState returns a
    // new object on every successful submit, but the boolean value stays
    // `true` across repeats, so keying off the primitive would only fire
    // this effect once and silently stop resetting the form after that.
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <form ref={formRef} action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="memberId" value={memberId} />
        <input
          type="url"
          name="url"
          placeholder="Paste your X post link…"
          required
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending || !memberId}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </form>
      {!memberId && (
        <p className="mt-1.5 text-xs text-muted">
          Pick who you are from the dropdown at the top first.
        </p>
      )}
      {state.error && <p className="mt-1.5 text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="mt-1.5 text-xs text-muted">
          Logged. Want to backdate it or add a note?{" "}
          <Link href="/log" className="text-accent underline">
            Use the full form
          </Link>
          .
        </p>
      )}
    </div>
  );
}
