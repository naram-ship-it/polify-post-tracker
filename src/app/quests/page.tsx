import { getQuestsList } from "@/lib/quests";
import { getActiveMembers } from "@/lib/team";
import { QuestsPanel } from "@/components/QuestsPanel";

// Server components can't read the client-side "posting as" identity
// (localStorage) — this fetches quest data for every member at once, and
// each QuestCard (client) resolves its own eligible/joined/progress state
// from it via useIdentity(), same Map-style pattern as the Dashboard.
export default async function QuestsPage() {
  const [quests, activeMembers] = await Promise.all([
    getQuestsList(),
    getActiveMembers(),
  ]);

  const memberOptions = activeMembers.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div>
      <h1 className="text-xl font-semibold">🎯 Quests</h1>
      <p className="mt-1 text-sm text-muted">
        Challenges the team can join — some open to everyone, some targeted at specific people.
      </p>
      <div className="mt-4">
        <QuestsPanel quests={quests} members={memberOptions} />
      </div>
    </div>
  );
}
