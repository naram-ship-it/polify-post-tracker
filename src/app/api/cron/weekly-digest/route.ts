import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getStatsForRange } from "@/lib/posts";
import { startOfWeek, endOfWeek, shiftWeek } from "@/lib/week";
import { sendSlackMessage } from "@/lib/slack";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

// Runs Monday morning: summarizes the week that just ended (Mon–Sun).
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lastWeekAnchor = shiftWeek(new Date(), -1);
  const start = startOfWeek(lastWeekAnchor);
  const end = endOfWeek(lastWeekAnchor);

  const stats = await getStatsForRange(start, end);
  const active = stats.filter((s) => s.active);
  const posted = active.filter((s) => s.total > 0);

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const lines = [
    `📊 *Weekly Polify post digest — ${fmt(start)} to ${fmt(end)}*`,
    "",
  ];

  if (active.length === 0) {
    lines.push("No team members configured.");
  } else if (posted.length === 0) {
    lines.push("Nobody logged a post last week 👀");
  } else {
    active.forEach((s, i) => {
      const medal = i < 3 && s.total > 0 ? MEDALS[i] : `${i + 1}.`;
      lines.push(`${medal} ${s.memberName} — ${s.total} post${s.total === 1 ? "" : "s"}`);
    });
  }

  await sendSlackMessage(lines.join("\n"));

  return NextResponse.json({ ok: true, weekStart: start.toISOString(), stats });
}
