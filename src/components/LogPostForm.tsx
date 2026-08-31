"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logPostAction, type LogPostState } from "@/app/actions";
import { useIdentity } from "@/components/identity";
import type { MemberOption } from "@/components/Chrome";

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function LogPostForm({ members }: { members: MemberOption[] }) {
  const { memberId, setMemberId } = useIdentity();
  const router = useRouter();
  const [state, action, pending] = useActionState<LogPostState, FormData>(
    logPostAction,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/");
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Who are you?</label>
        <select
          name="memberId"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select your name…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Platform</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="platform" value="X" defaultChecked required />
            X
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="platform" value="LINKEDIN" required />
            LinkedIn
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Post URL</label>
        <input
          type="url"
          name="url"
          placeholder="https://x.com/... or https://www.linkedin.com/..."
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
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log post"}
      </button>
    </form>
  );
}
