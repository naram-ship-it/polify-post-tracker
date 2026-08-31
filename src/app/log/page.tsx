import { getActiveMembers } from "@/lib/team";
import { LogPostForm } from "@/components/LogPostForm";

export default async function LogPage() {
  const members = await getActiveMembers();

  return (
    <div>
      <h1 className="text-xl font-semibold">Log a post</h1>
      <p className="mt-1 text-sm text-muted">
        Backdate a post, or add a note — the feed&apos;s quick-add covers the common case.
      </p>
      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-border bg-card p-5 shadow-sm">
        <LogPostForm members={members.map((m) => ({ id: m.id, name: m.name }))} />
      </div>
    </div>
  );
}
