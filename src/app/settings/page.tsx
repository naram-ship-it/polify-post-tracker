import { getAllMembers } from "@/lib/team";
import { MembersPanel } from "@/components/settings/MembersPanel";

export default async function SettingsPage() {
  const members = await getAllMembers();

  return (
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your team roster — new members show up in the &quot;posting as&quot; picker instantly.
      </p>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold">Members</h2>
        <MembersPanel
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            xHandle: m.xHandle,
            active: m.active,
          }))}
        />
      </div>
    </div>
  );
}
