// Illustrative numbers for metrics that need the X API (reach, impressions)
// which isn't connected yet. These are deterministic (seeded from a stable
// key, not Math.random()) so they don't visibly change on every reload —
// but they are NOT real data. Every place these are used is labeled
// "example" in the UI so nobody mistakes them for live analytics.

function seededInt(key: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

export function exampleReach(key: string): number {
  return seededInt(key, 200, 4200);
}

export function exampleTotalReach(key: string): number {
  return seededInt(key, 8000, 42000);
}

export function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
