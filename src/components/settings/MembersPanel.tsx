"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createMemberAction,
  updateMemberAction,
  setMemberActiveAction,
  type MemberFormState,
} from "@/app/actions";
import { avatarColor } from "@/lib/avatarColor";

export type Member = {
  id: string;
  name: string;
  xHandle: string | null;
  active: boolean;
};

function AddMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<MemberFormState, FormData>(
    createMemberAction,
    {}
  );

  useEffect(() => {
    // Depend on `state` itself, not `state.ok` — see QuickAddBar for why.
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-muted">Name</label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Jordan"
          required
          maxLength={60}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-muted">X handle (optional)</label>
        <input
          type="text"
          name="xHandle"
          placeholder="@jordan"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
      >
        {pending ? "Adding…" : "+ Add member"}
      </button>
    </form>
  );
}

function EditMemberForm({ member, onDone }: { member: Member; onDone: () => void }) {
  const [state, action, pending] = useActionState<MemberFormState, FormData>(
    updateMemberAction.bind(null, member.id),
    {}
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
        style={{ backgroundColor: avatarColor(member.name) }}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-[140px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-muted">Name</label>
        <input
          type="text"
          name="name"
          defaultValue={member.name}
          required
          maxLength={60}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-[140px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-muted">X handle</label>
        <input
          type="text"
          name="xHandle"
          defaultValue={member.xHandle ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <div className="flex shrink-0 gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MemberRow({ member }: { member: Member }) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggleActive() {
    setPending(true);
    await setMemberActiveAction(member.id, !member.active);
  }

  if (isEditing) {
    return <EditMemberForm member={member} onDone={() => setIsEditing(false)} />;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm ${
        member.active ? "" : "opacity-55"
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
        style={{ backgroundColor: avatarColor(member.name) }}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{member.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              member.active ? "bg-green-50 text-green-700" : "bg-black/5 text-muted"
            }`}
          >
            {member.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="text-xs text-muted">{member.xHandle ? `@${member.xHandle}` : "No X handle"}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
            member.active
              ? "border-accent/30 text-accent hover:bg-accent/5"
              : "border-teal/30 text-teal hover:bg-teal/5"
          }`}
        >
          {member.active ? "Remove" : "Reactivate"}
        </button>
      </div>
    </div>
  );
}

export function MembersPanel({ members }: { members: Member[] }) {
  return (
    <div>
      <AddMemberForm />
      <div className="space-y-2">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Removing a member keeps their past posts and stats intact — they just drop out of the
        &quot;posting as&quot; picker until reactivated.
      </p>
    </div>
  );
}
