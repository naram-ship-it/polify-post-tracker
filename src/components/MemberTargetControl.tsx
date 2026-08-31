"use client";

import { useActionState, useEffect, useState } from "react";
import { updateMemberTargetAction, type SettingsState } from "@/app/actions";

function TargetEditForm({
  memberId,
  weeklyTarget,
  defaultTarget,
  onSaved,
  onCancel,
}: {
  memberId: string;
  weeklyTarget: number | null;
  defaultTarget: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateMemberTargetAction.bind(null, memberId),
    {}
  );

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="flex items-center gap-1 text-xs">
      <input
        type="number"
        name="target"
        min={1}
        max={50}
        placeholder={String(defaultTarget)}
        defaultValue={weeklyTarget ?? ""}
        className="w-12 rounded-md border border-border bg-background px-1.5 py-0.5 text-center"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-1.5 py-0.5 hover:bg-black/5"
      >
        Save
      </button>
      <button type="button" onClick={onCancel} className="text-muted hover:text-foreground">
        ✕
      </button>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}

export function MemberTargetControl({
  memberId,
  weeklyTarget,
  defaultTarget,
}: {
  memberId: string;
  weeklyTarget: number | null;
  defaultTarget: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline decoration-dotted"
        title="Set a custom weekly target for this person"
      >
        target: {weeklyTarget ?? defaultTarget}
        {weeklyTarget == null && " (default)"}
      </button>
    );
  }

  return (
    <TargetEditForm
      memberId={memberId}
      weeklyTarget={weeklyTarget}
      defaultTarget={defaultTarget}
      onSaved={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}
