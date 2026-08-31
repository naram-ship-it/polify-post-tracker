import { prisma } from "@/lib/prisma";

export async function getActiveQuests() {
  return prisma.quest.findMany({
    where: { active: true },
    include: { completions: { include: { member: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// { completedByMember, total } — total is the same for everyone (count of
// active quests); completedByMember only has entries for members with at
// least one completion, so callers should default missing lookups to 0.
export async function getQuestProgress(): Promise<{
  completedByMember: Map<string, number>;
  total: number;
}> {
  const quests = await getActiveQuests();
  const completedByMember = new Map<string, number>();

  for (const q of quests) {
    for (const c of q.completions) {
      completedByMember.set(c.memberId, (completedByMember.get(c.memberId) ?? 0) + 1);
    }
  }

  return { completedByMember, total: quests.length };
}

export async function createQuest(title: string, description: string | null) {
  return prisma.quest.create({ data: { title, description: description || null } });
}

export async function setQuestActive(questId: string, active: boolean) {
  await prisma.quest.update({ where: { id: questId }, data: { active } });
}

export async function deleteQuest(questId: string) {
  await prisma.quest.delete({ where: { id: questId } }).catch(() => {});
}

export async function toggleQuestCompletion(questId: string, memberId: string) {
  const existing = await prisma.questCompletion.findUnique({
    where: { questId_memberId: { questId, memberId } },
  });

  if (existing) {
    await prisma.questCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.questCompletion.create({ data: { questId, memberId } });
  }
}
