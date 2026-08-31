// Thin wrapper around a Slack incoming webhook. No-ops (with a console
// warning) when SLACK_WEBHOOK_URL isn't set, so the app works before the
// team sets one up and never breaks post-logging if Slack is down.

export async function sendSlackMessage(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn("SLACK_WEBHOOK_URL not set — skipping Slack message:", text);
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("Slack webhook returned", res.status, await res.text());
    }
  } catch (err) {
    console.error("Failed to send Slack message:", err);
  }
}
