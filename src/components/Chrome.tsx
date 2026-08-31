"use client";

import Link from "next/link";
import { IdentityProvider, useIdentity } from "@/components/identity";

export type MemberOption = { id: string; name: string };

function IdentitySelector({ members }: { members: MemberOption[] }) {
  const { memberId, setMemberId } = useIdentity();

  return (
    <select
      value={memberId}
      onChange={(e) => setMemberId(e.target.value)}
      className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
      aria-label="I am"
    >
      <option value="">I am…</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

export function Chrome({
  members,
  children,
}: {
  members: MemberOption[];
  children: React.ReactNode;
}) {
  return (
    <IdentityProvider>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Polify Post Tracker
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-1 text-sm font-medium">
              <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-black/5">
                Feed
              </Link>
              <Link href="/log" className="rounded-md px-3 py-1.5 hover:bg-black/5">
                Log a post
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-md px-3 py-1.5 hover:bg-black/5"
              >
                Leaderboard
              </Link>
            </nav>
            <IdentitySelector members={members} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </IdentityProvider>
  );
}
