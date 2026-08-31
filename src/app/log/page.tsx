import { getActiveMembers } from "@/lib/team";
import { LogPostForm } from "@/components/LogPostForm";

export default async function LogPage() {
  const members = await getActiveMembers();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Log a post</h1>
      <div className="rounded-lg border border-border bg-card p-4">
        <LogPostForm members={members.map((m) => ({ id: m.id, name: m.name }))} />
      </div>
    </div>
  );
}
