"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createQuestAction,
  pushPromotionAction,
  archiveQuestAction,
  removeQuestAction,
  joinQuestAction,
  type QuestFormState,
  type PushPromotionState,
} from "@/app/actions";
import { useIdentity } from "@/components/identity";
import type { MemberOption } from "@/components/Chrome";
import type { QuestListItem } from "@/lib/quests";

function MemberCheckboxes({ members, name }: { members: MemberOption[]; name: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {members.map((m) => (
        <label
          key={m.id}
          className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold has-checked:border-peri has-checked:bg-peri/10 has-checked:text-peri"
        >
          <input type="checkbox" name={name} value={m.id} className="h-3 w-3" />
          {m.name}
        </label>
      ))}
    </div>
  );
}

function CreateQuestForm({ members, onSaved, onCancel }: {
  members: MemberOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState<QuestFormState, FormData>(createQuestAction, {});
  const [type, setType] = useState<"standard" | "promo">("standard");
  const [audience, setAudience] = useState<"everyone" | "specific">("everyone");

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Title</label>
        <input
          type="text"
          name="title"
          placeholder="e.g. Promote new Polify project"
          required
          maxLength={120}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Description</label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Type</label>
        <div className="flex gap-2">
          {(["standard", "promo"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                type === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
              }`}
            >
              {t === "promo" ? "📣 Promotional" : "Standard"}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {type === "promo" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Link to promote</label>
            <input
              type="url"
              name="linkUrl"
              placeholder="https://x.com/…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Button label</label>
            <input
              type="text"
              name="ctaLabel"
              defaultValue="Open post"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Who can participate</label>
        <div className="flex gap-2">
          {(["everyone", "specific"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                audience === a ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
              }`}
            >
              {a === "everyone" ? "Everyone" : "Specific members"}
            </button>
          ))}
        </div>
        <input type="hidden" name="audience" value={audience} />
        {audience === "specific" && <MemberCheckboxes members={members} name="memberIds" />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Points</label>
          <input
            type="number"
            name="points"
            defaultValue={10}
            min={1}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Posts needed</label>
          <input
            type="number"
            name="targetPosts"
            defaultValue={1}
            min={1}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Ends in (days, optional)</label>
        <input
          type="number"
          name="endsInDays"
          min={1}
          placeholder="No deadline"
          className="w-full max-w-[160px] rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted">
        <input type="checkbox" name="notifySlack" defaultChecked className="h-3.5 w-3.5" />
        Notify eligible members on Slack
      </label>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create quest"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PushPromotionForm({ members, onSaved, onCancel }: {
  members: MemberOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState<PushPromotionState, FormData>(pushPromotionAction, {});
  const [audience, setAudience] = useState<"everyone" | "specific">("everyone");

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 shadow-sm">
      <p className="text-xs text-muted">
        Fast path to a promotional quest — same system as Create quest, pre-filled for pushing a link to the team.
      </p>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Paste a link</label>
        <input
          type="url"
          name="linkUrl"
          required
          placeholder="https://x.com/…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Message to the team</label>
        <textarea
          name="message"
          rows={2}
          placeholder="What should they know?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Send to</label>
        <div className="flex gap-2">
          {(["everyone", "specific"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                audience === a ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
              }`}
            >
              {a === "everyone" ? "Everyone" : "Specific members"}
            </button>
          ))}
        </div>
        <input type="hidden" name="audience" value={audience} />
        {audience === "specific" && <MemberCheckboxes members={members} name="memberIds" />}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Points</label>
        <input
          type="number"
          name="points"
          defaultValue={50}
          min={1}
          className="w-full max-w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted">
        <input type="checkbox" name="notifySlack" defaultChecked className="h-3.5 w-3.5" />
        Notify on Slack
      </label>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send to team"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function QuestActions({ members }: { members: MemberOption[] }) {
  const [open, setOpen] = useState<"none" | "create" | "push">("none");

  if (open === "create") return <CreateQuestForm members={members} onSaved={() => setOpen("none")} onCancel={() => setOpen("none")} />;
  if (open === "push") return <PushPromotionForm members={members} onSaved={() => setOpen("none")} onCancel={() => setOpen("none")} />;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setOpen("push")}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold hover:bg-black/5"
      >
        📣 Push promotion
      </button>
      <button
        type="button"
        onClick={() => setOpen("create")}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
      >
        + Create quest
      </button>
    </div>
  );
}

function daysLeftLabel(endsAt: Date | null) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Ends today";
  return `⏳ ${days} day${days === 1 ? "" : "s"} left`;
}

function QuestCard({ quest }: { quest: QuestListItem }) {
  const { memberId } = useIdentity();
  const [joining, setJoining] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const eligible = quest.everyone || (memberId ? quest.participantIds.includes(memberId) : false);
  const myJoin = memberId ? quest.joins.find((j) => j.memberId === memberId) : undefined;
  const joined = Boolean(myJoin);
  const completed = Boolean(myJoin?.completedAt);
  const progress = memberId ? quest.progressByMember[memberId] ?? 0 : 0;

  async function handleJoin() {
    if (!memberId) {
      alert("Pick who you are from the dropdown at the top first.");
      return;
    }
    setJoining(true);
    const result = await joinQuestAction(quest.id, memberId);
    setJoining(false);
    if (result?.error) alert(result.error);
  }

  async function handleArchive() {
    setArchiving(true);
    await archiveQuestAction(quest.id);
  }

  async function handleDelete() {
    if (!confirm("Delete this quest for everyone? This can't be undone.")) return;
    await removeQuestAction(quest.id);
  }

  const deadline = daysLeftLabel(quest.endsAt);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {quest.type === "PROMO" && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Promote
              </span>
            )}
            <span className="rounded-full bg-peri/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-peri">
              {quest.everyone ? "Everyone" : quest.participantNames.join(", ") || "No one yet"}
            </span>
            {completed ? (
              <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                ✓ Completed
              </span>
            ) : joined ? (
              <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                Active
              </span>
            ) : memberId && !eligible ? (
              <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                Not for you
              </span>
            ) : null}
          </div>
          <h4 className="font-bold">{quest.title}</h4>
          {quest.description && <p className="mt-0.5 text-sm text-muted">{quest.description}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-mono text-xs font-bold text-gold">
            {completed ? `+${quest.points} earned` : `+${quest.points} pts`}
          </span>
          <div className="flex gap-2 text-[11px]">
            <button onClick={handleArchive} disabled={archiving} className="text-muted underline">
              Archive
            </button>
            <button onClick={handleDelete} className="text-red-600 underline">
              Delete
            </button>
          </div>
        </div>
      </div>

      {quest.linkUrl && (
        <a
          href={quest.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-black/5"
        >
          {quest.ctaLabel || "Open link"} ↗
        </a>
      )}

      {(deadline || joined) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          {deadline && <span>{deadline}</span>}
          {joined && (
            <span>
              <b className="font-mono text-foreground">
                {progress}/{quest.targetPosts}
              </b>{" "}
              posts
            </span>
          )}
        </div>
      )}
      {joined && !completed && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
            style={{ width: `${Math.min(100, Math.round((progress / quest.targetPosts) * 100))}%` }}
          />
        </div>
      )}

      {!joined && eligible && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join quest"}
        </button>
      )}
    </div>
  );
}

export function QuestsPanel({ quests, members }: { quests: QuestListItem[]; members: MemberOption[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Self-reported — join what applies to you, then apply posts to it from the Feed.
        </p>
        <QuestActions members={members} />
      </div>

      {quests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No quests yet. Create one above.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      )}
    </div>
  );
}
