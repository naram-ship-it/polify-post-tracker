import Link from "next/link";
import { getAllMembers } from "@/lib/team";
import { getNotificationSettings } from "@/lib/settings";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { NotificationsPanel } from "@/components/settings/NotificationsPanel";

export default async function SettingsPage(props: PageProps<"/settings">) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab === "notifications" ? "notifications" : "members";

  const tabHref = (t: "members" | "notifications") =>
    t === "members" ? "/settings" : "/settings?tab=notifications";

  return (
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="mb-6 mt-4 flex gap-1 text-sm">
        <Link
          href={tabHref("members")}
          className={`rounded-lg px-3 py-1.5 font-medium ${
            tab === "members"
              ? "bg-accent text-white"
              : "border border-border bg-card text-muted hover:bg-black/5"
          }`}
        >
          Members
        </Link>
        <Link
          href={tabHref("notifications")}
          className={`rounded-lg px-3 py-1.5 font-medium ${
            tab === "notifications"
              ? "bg-accent text-white"
              : "border border-border bg-card text-muted hover:bg-black/5"
          }`}
        >
          Notifications
        </Link>
      </div>

      {tab === "notifications" ? (
        <NotificationsSettingsSection />
      ) : (
        <MembersSettingsSection />
      )}
    </div>
  );
}

async function MembersSettingsSection() {
  const members = await getAllMembers();
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Manage your team roster — new members show up in the &quot;posting as&quot; picker instantly.
      </p>
      <MembersPanel
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          xHandle: m.xHandle,
          slackHandle: m.slackHandle,
          active: m.active,
        }))}
      />
    </div>
  );
}

async function NotificationsSettingsSection() {
  const settings = await getNotificationSettings();
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Controls for the Slack notifications Quests can send.
      </p>
      <NotificationsPanel settings={settings} />
    </div>
  );
}
