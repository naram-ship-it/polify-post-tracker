// Fetches a tweet's text via X's public oEmbed endpoint. No API key needed,
// but also no engagement metrics (views/likes) — those require the paid X
// API, which is what the future X_API source is for.

function stripEmbedHtml(html: string): string | null {
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  const raw = paragraph ? paragraph[1] : html;
  const withoutTags = raw.replace(/<[^>]+>/g, "");
  const decoded = withoutTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return decoded || null;
}

export async function fetchTweetText(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { html?: unknown };
    if (typeof data.html !== "string") return null;
    return stripEmbedHtml(data.html);
  } catch (err) {
    console.error("fetchTweetText failed:", err);
    return null;
  }
}
