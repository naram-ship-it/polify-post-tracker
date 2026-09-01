"use client";

import { useIdentity } from "@/components/identity";
import { avatarColor } from "@/lib/avatarColor";
import type { MemberOption } from "@/components/Chrome";

export function PostingAsBadge({ members }: { members: MemberOption[] }) {
  const { memberId, setMemberId } = useIdentity();
  const selected = members.find((m) => m.id === memberId);

  return (
    <div
      className={`mb-3 flex items-center gap-3 rounded-2xl p-3 shadow-sm ${
        selected
          ? "border border-border bg-card"
          : "border-2 border-dashed border-accent/40 bg-accent/5"
      }`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: selected ? avatarColor(selected.name) : "var(--accent)" }}
      >
        {selected ? selected.name.charAt(0).toUpperCase() : "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[10px] font-bold uppercase tracking-wide ${
            selected ? "text-muted" : "text-accent"
          }`}
        >
          {selected ? "Posting as" : "Who are you?"}
        </div>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          aria-label="Posting as"
          className={`w-full bg-transparent text-sm font-bold outline-none ${
            selected ? "" : "text-accent"
          }`}
        >
          <option value="">Pick your name to start posting…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
