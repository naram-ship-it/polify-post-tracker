import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getStreaks } from "@/lib/streaks";
import { sendSlackMessage } from "@/lib/slack";

export const dynamic = "force-dynamic";

// Runs Wednesday: nudges anyone who hasn't hit their weekly target yet.
// Says nothing if everyone's already on track (no news is good news).
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const streaks = await getStreaks();
  const behind = streaks.filter((s) => !s.qualifiesThisWeek);

  if (behind.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "everyone on track" });
  }

  const lines = [
    "⏰ *Midweek check-in* — these folks still need posts to hit this week's goal:",
    "",
    ...behind.map(
      (s) =>
        `• ${s.memberName}: ${s.postsThisWeek}/${s.target} (${s.target - s.postsThisWeek} more needed)`
    ),
  ];

  await sendSlackMessage(lines.join("\n"));

  return NextResponse.json({ ok: true, sent: true, behind: behind.map((s) => s.memberName) });
}
