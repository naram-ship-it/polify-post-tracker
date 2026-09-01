import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getStreaks } from "@/lib/streaks";
import { sendSlackMessage, appUrl } from "@/lib/slack";
import { getNotificationSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Runs Wednesday: nudges anyone who hasn't hit their weekly target yet.
// Says nothing if everyone's already on track (no news is good news).
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getNotificationSettings();
  if (!settings.notifyWeeklyQuota) {
    return NextResponse.json({ ok: true, sent: false, reason: "weekly quota reminders are off" });
  }

  const streaks = await getStreaks();
  const behind = streaks.filter((s) => !s.qualifiesThisWeek);

  if (behind.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "everyone on track" });
  }

  const members = await prisma.teamMember.findMany({
    where: { id: { in: behind.map((s) => s.memberId) } },
    select: { id: true, slackHandle: true },
  });
  const handleByMemberId = new Map(members.map((m) => [m.id, m.slackHandle]));

  const lines = [
    "⏰ *Midweek check-in* — these folks still need posts to hit this week's goal:",
    "",
    ...behind.map((s) => {
      const who = handleByMemberId.get(s.memberId) || s.memberName;
      return `${who} — you're currently at ${s.postsThisWeek}/${s.target} posts this week. ${
        s.target - s.postsThisWeek
      } more needed. ${appUrl("/dashboard")}`;
    }),
  ];

  await sendSlackMessage(lines.join("\n"));

  return NextResponse.json({ ok: true, sent: true, behind: behind.map((s) => s.memberName) });
}
