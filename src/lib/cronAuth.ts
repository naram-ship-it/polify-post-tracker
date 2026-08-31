import type { NextRequest } from "next/server";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when
// CRON_SECRET is set as an env var. If it isn't set yet (e.g. before first
// deploy), the route is left open rather than permanently broken — set
// CRON_SECRET in Vercel once the cron jobs are live.
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
