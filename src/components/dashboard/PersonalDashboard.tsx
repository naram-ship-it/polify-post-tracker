"use client";

import Link from "next/link";
import { useIdentity } from "@/components/identity";
import { avatarColor } from "@/lib/avatarColor";
import { exampleReach, formatCompact } from "@/lib/exampleMetrics";
import { POINTS_PER_POST, type TopPost } from "@/lib/posts";
import type { MemberStreak } from "@/lib/streaks";
import type { ActiveQuestJoin } from "@/lib/quests";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysLeftLabel(endsAt: Date | null) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Ends today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function PersonalDashboard({
  postsThisWeekByMemberId,
  streaksByMemberId,
  recentPostsByMemberId,
  daysPostedByMemberId,
  activeQuestsByMemberId,
}: {
  postsThisWeekByMemberId: Map<string, number>;
  streaksByMemberId: Map<string, MemberStreak>;
  recentPostsByMemberId: Map<string, TopPost[]>;
  daysPostedByMemberId: Map<string, boolean[]>;
  activeQuestsByMemberId: Map<string, ActiveQuestJoin[]>;
}) {
  const { memberId } = useIdentity();

  if (!memberId) {
    return (
      <div className="mb-2 rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-5 text-center">
        <p className="text-sm font-bold text-accent">
          Pick who you are (top right) to see your personal stats
        </p>
      </div>
    );
  }

  const streak = streaksByMemberId.get(memberId);
  const memberName = streak?.memberName ?? "";
  const postsThisWeek = postsThisWeekByMemberId.get(memberId) ?? 0;
  const target = streak?.target ?? 1;
  const qualifies = streak?.qualifiesThisWeek ?? false;
  const closeToMissing = streak?.closeToMissing ?? false;
  const streakWeeks = streak?.streak ?? 0;
  const recentPosts = recentPostsByMemberId.get(memberId) ?? [];
  const activeQuests = activeQuestsByMemberId.get(memberId) ?? [];
  const daysPosted = daysPostedByMemberId.get(memberId) ?? Array(7).fill(false);
  const progressPct = Math.min(100, Math.round((postsThisWeek / Math.max(1, target)) * 100));
  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  return (
    <div>
      {/* Welcome banner */}
      <div
        className="mb-2 flex items-center gap-4 rounded-[20px] p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${avatarColor(memberName)}, var(--peri))` }}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold">
          {memberName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs font-semibold opacity-85">Welcome back</div>
          <div className="text-xl font-extrabold">{memberName}</div>
          <div className="mt-0.5 text-xs opacity-90">Here&apos;s how your week&apos;s going</div>
        </div>
      </div>

      {/* Your performance */}
      <h3 className="mb-2.5 mt-5 text-[15px] font-extrabold">📈 Your performance — this week</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-muted">Your posts</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-sm">📝</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold">{postsThisWeek}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-muted">Your points</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-sm">⭐</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold">{postsThisWeek * POINTS_PER_POST}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-muted">Your streak</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-sm">🔥</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold">{streakWeeks}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-muted">Your reach*</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-peri/15 text-sm">👁</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold">
            {formatCompact(exampleReach(memberId + "-week"))}
          </div>
        </div>
      </div>

      {/* Weekly progress */}
      <h3 className="mb-2.5 mt-5 text-[15px] font-extrabold">🎯 Your weekly progress</h3>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[15px] font-extrabold">
            {postsThisWeek} of {target} post{target === 1 ? "" : "s"} this week
          </span>
          {qualifies ? (
            <span className="text-sm font-bold text-green-600">✓ Goal hit</span>
          ) : closeToMissing ? (
            <span className="text-sm font-bold text-accent">⚠️ {target - postsThisWeek} more needed</span>
          ) : (
            <span className="text-sm font-bold text-muted">{target - postsThisWeek} to go</span>
          )}
        </div>
        <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-4 flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="mb-1 text-[10px] text-muted">{label}</div>
              <div
                className={`h-2 w-full rounded ${
                  daysPosted[i]
                    ? "bg-teal"
                    : i === todayIndex
                      ? "bg-accent ring-2 ring-accent/25"
                      : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Active quests */}
      <h3 className="mb-2.5 mt-5 text-[15px] font-extrabold">🎯 Active Quests</h3>
      {activeQuests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          No active quests yet — join one on the{" "}
          <Link href="/quests" className="font-bold text-accent">
            Quests page
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {activeQuests.map((q) => {
            const deadline = daysLeftLabel(q.endsAt);
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            return (
              <div key={q.questId} className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold">{q.title}</h4>
                  <span className="shrink-0 font-mono text-xs font-bold text-gold">+{q.points} pts</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {deadline && <span>⏳ {deadline}</span>}
                  <span>
                    Progress:{" "}
                    <b className="font-mono text-foreground">
                      {q.progress}/{q.target}
                    </b>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <Link href="/quests" className="mt-2.5 inline-block text-xs font-bold text-accent">
                  View quest →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent posts */}
      <h3 className="mb-2.5 mt-5 text-[15px] font-extrabold">🗂️ Your recent posts</h3>
      {recentPosts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          You haven&apos;t logged any posts yet.
        </p>
      ) : (
        <div className="space-y-2">
          {recentPosts.map((p) => {
            const d = new Date(p.postedAt);
            return (
              <div
                key={p.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm"
              >
                <div className="w-12 shrink-0 text-center">
                  <div className="text-base font-extrabold leading-none">{d.getDate()}</div>
                  <div className="text-[10px] uppercase text-muted">
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                </div>
                <div className="w-px self-stretch bg-border" />
                <div className="min-w-0 flex-1 text-sm text-foreground/85">
                  <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
                    <span>💬 {p.engagement} comment{p.engagement === 1 ? "" : "s"}</span>
                    <span>👁 {exampleReach(p.id).toLocaleString()} reach*</span>
                    <span className="text-muted">· {formatDate(p.postedAt)}</span>
                  </div>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 self-center text-xs font-bold text-accent"
                >
                  View ↗
                </a>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">*Reach is example data until X is connected.</p>
    </div>
  );
}
