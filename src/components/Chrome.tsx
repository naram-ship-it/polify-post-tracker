"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { IdentityProvider, useIdentity } from "@/components/identity";

export type MemberOption = { id: string; name: string };

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "Feed" },
  { href: "/log", label: "Log a post" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
];

function IdentitySelector({ members }: { members: MemberOption[] }) {
  const { memberId, setMemberId } = useIdentity();
  const selected = members.find((m) => m.id === memberId);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-full border-2 py-1.5 pl-1.5 pr-4 ${
        selected ? "border-accent/35 bg-accent/5" : "border-accent/50 bg-accent/10"
      }`}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: selected ? "var(--peri)" : "var(--accent)" }}
      >
        {selected ? selected.name.charAt(0).toUpperCase() : "?"}
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={`text-[9px] font-bold uppercase tracking-wide ${
            selected ? "text-muted" : "text-accent"
          }`}
        >
          {selected ? "Posting as" : "Who are you?"}
        </span>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className={`bg-transparent text-sm font-extrabold outline-none ${
            selected ? "" : "text-accent"
          }`}
          aria-label="Posting as"
        >
          <option value="">Select…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isQuestsTab = pathname === "/leaderboard" && searchParams.get("tab") === "quests";

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card p-4 sm:flex">
      <Link href="/" className="flex items-center gap-2 px-1.5 text-[15px] font-extrabold tracking-tight">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}
        >
          🏆
        </span>
        Polify
      </Link>

      <nav className="mt-6 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href && !isQuestsTab;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-2.5 py-2 text-sm font-medium ${
                active ? "bg-accent/10 font-bold text-accent" : "text-muted hover:bg-black/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/leaderboard?tab=quests"
          className={`rounded-lg px-2.5 py-1.5 pl-8 text-xs ${
            isQuestsTab ? "font-bold text-accent" : "text-muted hover:bg-black/5"
          }`}
        >
          🎯 Quests
        </Link>
      </nav>

      <div
        className="mt-auto rounded-2xl p-4 text-white"
        style={{ background: "linear-gradient(160deg, #1f1b29, #322b40)" }}
      >
        <h4 className="text-[13px] font-semibold">Connect X API</h4>
        <p className="mt-1 text-[11px] leading-relaxed text-white/70">
          Once you have X API access, posts will auto-pull reach, likes & comments —
          no more manual logging.
        </p>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 sm:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              active ? "bg-accent/10 font-bold text-accent" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
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
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:justify-end sm:px-6">
            <Link href="/" className="text-sm font-extrabold sm:hidden">
              🏆 Polify
            </Link>
            <IdentitySelector members={members} />
          </header>
          <MobileNav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </IdentityProvider>
  );
}
