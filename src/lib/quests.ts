import { prisma } from "@/lib/prisma";
import { QuestType } from "@prisma/client";

// --- Data access layer for Quests ------------------------------------------
// A quest is eligible for a member either because it's open to everyone
// (no QuestParticipant rows) or because they're named in QuestParticipant.
// Eligibility alone never puts a quest on anyone's Dashboard — only an
// explicit QuestJoin does that. Progress is the count of a member's own
// QuestPost rows (posts they've linked to the quest), and a join completes
// itself once that count reaches Quest.targetPosts.

// Raw per-quest data for every member at once — identity is client-side
// only (localStorage), so eligibility/joined/progress can't be resolved to
// a single viewer on the server. QuestCard (client) picks its own state out
// of `participantIds` / `joins` / `progressByMember` using useIdentity().
export type QuestListItem = {
  id: string;
  title: string;
  description: string | null;
  type: QuestType;
  linkUrl: string | null;
  ctaLabel: string | null;
  points: number;
  targetPosts: number;
  endsAt: Date | null;
  everyone: boolean;
  participantIds: string[];
  participantNames: string[];
  joins: { memberId: string; completedAt: Date | null }[];
  progressByMember: Record<string, number>;
};

export async function getQuestsList(): Promise<QuestListItem[]> {
  const quests = await prisma.quest.findMany({
    where: { active: true },
    include: {
      participants: { include: { member: true } },
      joins: true,
      questPosts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return quests.map((q) => {
    const progressByMember: Record<string, number> = {};
    for (const qp of q.questPosts) {
      progressByMember[qp.memberId] = (progressByMember[qp.memberId] ?? 0) + 1;
    }

    return {
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      linkUrl: q.linkUrl,
      ctaLabel: q.ctaLabel,
      points: q.points,
      targetPosts: q.targetPosts,
      endsAt: q.endsAt,
      everyone: q.participants.length === 0,
      participantIds: q.participants.map((p) => p.memberId),
      participantNames: q.participants.map((p) => p.member.name),
      joins: q.joins.map((j) => ({ memberId: j.memberId, completedAt: j.completedAt })),
      progressByMember,
    };
  });
}

export type ActiveQuestJoin = {
  questId: string;
  title: string;
  points: number;
  progress: number;
  target: number;
  endsAt: Date | null;
};

// Every member's currently-joined, not-yet-completed quests, in one query —
// used by both the Dashboard's "Active Quests" section and the Feed's
// "apply to a quest" picker, same Map-per-member pattern as posts.ts.
export async function getActiveQuestJoinsByMemberMap(): Promise<Map<string, ActiveQuestJoin[]>> {
  const joins = await prisma.questJoin.findMany({
    where: { completedAt: null, quest: { active: true } },
    include: { quest: true },
    orderBy: { joinedAt: "asc" },
  });

  const counts = await prisma.questPost.groupBy({
    by: ["questId", "memberId"],
    _count: { _all: true },
  });
  const countByKey = new Map<string, number>();
  for (const c of counts) {
    countByKey.set(`${c.questId}:${c.memberId}`, c._count._all);
  }

  const byMember = new Map<string, ActiveQuestJoin[]>();
  for (const j of joins) {
    const list = byMember.get(j.memberId) ?? [];
    list.push({
      questId: j.questId,
      title: j.quest.title,
      points: j.quest.points,
      progress: countByKey.get(`${j.questId}:${j.memberId}`) ?? 0,
      target: j.quest.targetPosts,
      endsAt: j.quest.endsAt,
    });
    byMember.set(j.memberId, list);
  }
  return byMember;
}

// { completedByMember, total } for the Dashboard's "Streaks & quests" row —
// total is the count of currently-active quests (same for everyone),
// completedByMember only has entries for members with at least one
// completed join, so callers should default missing lookups to 0.
export async function getQuestProgress(): Promise<{
  completedByMember: Map<string, number>;
  total: number;
}> {
  const [total, completions] = await Promise.all([
    prisma.quest.count({ where: { active: true } }),
    prisma.questJoin.findMany({
      where: { completedAt: { not: null }, quest: { active: true } },
      select: { memberId: true },
    }),
  ]);

  const completedByMember = new Map<string, number>();
  for (const c of completions) {
    completedByMember.set(c.memberId, (completedByMember.get(c.memberId) ?? 0) + 1);
  }

  return { completedByMember, total };
}

export type CreateQuestInput = {
  title: string;
  description: string | null;
  type: QuestType;
  linkUrl: string | null;
  ctaLabel: string | null;
  points: number;
  targetPosts: number;
  endsInDays: number | null;
  memberIds: string[];
};

export async function createQuest(input: CreateQuestInput) {
  const endsAt = input.endsInDays ? new Date(Date.now() + input.endsInDays * 24 * 60 * 60 * 1000) : null;

  return prisma.quest.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      linkUrl: input.linkUrl,
      ctaLabel: input.ctaLabel,
      points: input.points,
      targetPosts: input.targetPosts,
      endsAt,
      participants: input.memberIds.length
        ? { create: input.memberIds.map((memberId) => ({ memberId })) }
        : undefined,
    },
    include: { participants: { include: { member: true } } },
  });
}

export async function setQuestActive(questId: string, active: boolean) {
  await prisma.quest.update({ where: { id: questId }, data: { active } });
}

export async function deleteQuest(questId: string) {
  await prisma.quest.delete({ where: { id: questId } }).catch(() => {});
}

export async function joinQuest(questId: string, memberId: string): Promise<{ error?: string }> {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { participants: true },
  });
  if (!quest || !quest.active) return { error: "Quest not found." };

  const everyone = quest.participants.length === 0;
  const eligible = everyone || quest.participants.some((p) => p.memberId === memberId);
  if (!eligible) return { error: "This quest isn't open to you." };

  await prisma.questJoin.upsert({
    where: { questId_memberId: { questId, memberId } },
    update: {},
    create: { questId, memberId },
  });
  return {};
}

// Links a logged post to a quest the member has already joined. Silently
// no-ops on a duplicate link (same post applied twice) rather than erroring
// — the caller doesn't need to handle that as a failure case.
export async function attachPostToQuest(
  postId: string,
  memberId: string,
  questId: string
): Promise<{ error?: string; completed?: boolean }> {
  const join = await prisma.questJoin.findUnique({
    where: { questId_memberId: { questId, memberId } },
  });
  if (!join) return { error: "Join the quest before applying a post to it." };
  if (join.completedAt) return {};

  try {
    await prisma.questPost.create({ data: { questId, memberId, postId } });
  } catch {
    return {};
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return {};

  const count = await prisma.questPost.count({ where: { questId, memberId } });
  if (count >= quest.targetPosts) {
    await prisma.questJoin.update({ where: { id: join.id }, data: { completedAt: new Date() } });
    return { completed: true };
  }
  return {};
}
