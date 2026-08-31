"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createQuestAction,
  archiveQuestAction,
  removeQuestAction,
  toggleQuestCompletionAction,
  type QuestFormState,
} from "@/app/actions";
import { useIdentity } from "@/components/identity";
import type { MemberOption } from "@/components/Chrome";

export type QuestWithCompletions = {
  id: string;
  title: string;
  description: string | null;
  completions: { memberId: string; member: { name: string } }[];
};

function QuestCreateForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState<QuestFormState, FormData>(
    createQuestAction,
    {}
  );

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-2 rounded-lg border border-border bg-card p-3">
      <input
        type="text"
        name="title"
        placeholder="Quest title, e.g. “Post on 3 different days this week”"
        required
        maxLength={120}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add quest"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function NewQuestForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5"
      >
        + New quest
      </button>
    );
  }

  return <QuestCreateForm onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />;
}

function QuestRow({ quest, members }: { quest: QuestWithCompletions; members: MemberOption[] }) {
  const { memberId } = useIdentity();
  const [archiving, setArchiving] = useState(false);
  const completedIds = new Set(quest.completions.map((c) => c.memberId));

  async function toggleSelf() {
    if (!memberId) {
      alert("Pick who you are from the dropdown at the top first.");
      return;
    }
    await toggleQuestCompletionAction(quest.id, memberId);
  }

  async function handleArchive() {
    setArchiving(true);
    await archiveQuestAction(quest.id);
  }

  async function handleDelete() {
    if (!confirm("Delete this quest for everyone? This can't be undone.")) return;
    await removeQuestAction(quest.id);
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{quest.title}</div>
          {quest.description && (
            <p className="mt-0.5 text-sm text-muted">{quest.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button onClick={handleArchive} disabled={archiving} className="text-muted underline">
            Archive
          </button>
          <button onClick={handleDelete} className="text-red-600 underline">
            Delete
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const done = completedIds.has(m.id);
          const isYou = m.id === memberId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={isYou ? toggleSelf : undefined}
              disabled={!isYou}
              title={isYou ? "Toggle your completion" : undefined}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                done
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-border text-muted"
              } ${isYou ? "cursor-pointer" : "cursor-default"}`}
            >
              {done ? "✓" : "○"} {m.name}
              {isYou && !done && " (mark done)"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuestsPanel({
  quests,
  members,
}: {
  quests: QuestWithCompletions[];
  members: MemberOption[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Self-reported challenges — no automatic tracking, mark yourself done when you&apos;ve done it.
        </p>
        <NewQuestForm />
      </div>

      {quests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No quests yet. Add one above.
        </p>
      ) : (
        <div className="space-y-2">
          {quests.map((q) => (
            <QuestRow key={q.id} quest={q} members={members} />
          ))}
        </div>
      )}
    </div>
  );
}
