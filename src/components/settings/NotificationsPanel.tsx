"use client";

import { useState, useTransition } from "react";
import { updateNotificationSettingAction } from "@/app/actions";
import type { NotificationSettings } from "@/lib/settings";

const TOGGLES: { key: keyof NotificationSettings; title: string; description: string }[] = [
  {
    key: "notifyNewQuest",
    title: "New quest notifications",
    description: "Post to Slack when a quest becomes available",
  },
  {
    key: "notifyPromotion",
    title: "Promotion notifications",
    description: "Post when something is pushed for the team to share",
  },
  {
    key: "notifyWeeklyQuota",
    title: "Weekly quota reminders",
    description: "Midweek nudge for anyone behind their posting target",
  },
  {
    key: "notifyQuestDeadline",
    title: "Quest deadline reminders",
    description: "Nudge members with an active quest closing soon — not automated yet",
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
        checked ? "bg-teal" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationsPanel({ settings }: { settings: NotificationSettings }) {
  const [state, setState] = useState(settings);
  const [, startTransition] = useTransition();

  function handleToggle(key: keyof NotificationSettings, value: boolean) {
    setState((s) => ({ ...s, [key]: value }));
    startTransition(() => {
      updateNotificationSettingAction(key, value);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal" />
        <div>
          <div className="text-sm font-bold">Slack webhook connected</div>
          <div className="text-xs text-muted">Set via SLACK_WEBHOOK_URL — configured by an admin</div>
        </div>
      </div>
      {TOGGLES.map((t) => (
        <div key={t.key} className="flex items-center justify-between gap-4 border-b border-border p-4 last:border-b-0">
          <div>
            <div className="text-sm font-semibold">{t.title}</div>
            <div className="text-xs text-muted">{t.description}</div>
          </div>
          <Toggle checked={state[t.key]} onChange={(v) => handleToggle(t.key, v)} />
        </div>
      ))}
    </div>
  );
}
