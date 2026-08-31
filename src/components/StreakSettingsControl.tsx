"use client";

import { useActionState } from "react";
import { updateDefaultWeeklyTargetAction, type SettingsState } from "@/app/actions";

export function StreakSettingsControl({ defaultTarget }: { defaultTarget: number }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateDefaultWeeklyTargetAction,
    {}
  );

  return (
    <form action={action} className="flex items-center gap-2 text-xs text-muted">
      <span>Default target = </span>
      <input
        type="number"
        name="target"
        min={1}
        max={50}
        defaultValue={defaultTarget}
        className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-foreground"
      />
      <span>post(s)/week</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-2 py-1 hover:bg-black/5 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.ok && <span className="text-green-600">Saved</span>}
      {state.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}
