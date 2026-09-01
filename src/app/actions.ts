"use server";

import { revalidatePath } from "next/cache";
import { ReactionType, QuestType } from "@prisma/client";
import { createManualPost, isXUrl } from "@/lib/posts";
import { addComment } from "@/lib/comments";
import { prisma } from "@/lib/prisma";
import { fetchTweetText } from "@/lib/xEmbed";
import { setDefaultWeeklyTarget, setNotificationSetting, getNotificationSettings, type NotificationSettings } from "@/lib/settings";
import { sendSlackMessage, appUrl } from "@/lib/slack";
import {
  createQuest,
  setQuestActive,
  deleteQuest,
  joinQuest,
  attachPostToQuest,
  type CreateQuestInput,
} from "@/lib/quests";

function parsePostFields(formData: FormData) {
  const memberId = String(formData.get("memberId") || "");
  const url = String(formData.get("url") || "").trim();
  const dateStr = String(formData.get("postedAt") || "");
  const note = String(formData.get("note") || "").trim();

  if (!memberId) return { error: "Pick who posted it." } as const;
  if (!isXUrl(url)) {
    return { error: "Paste a valid x.com (or twitter.com) post URL." } as const;
  }
  if (!dateStr) return { error: "Pick a date." } as const;
  const postedAt = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(postedAt.getTime())) return { error: "Invalid date." } as const;

  return { memberId, url, postedAt, note: note || null } as const;
}

function notifyNewPost(memberName: string, url: string, note?: string | null) {
  // <!channel> is Slack's actual ping syntax — a literal "@channel" in the
  // text does not notify anyone.
  const lines = [`<!channel> 📣 *${memberName}* just logged a new post on X!`, url];
  if (note) lines.push(`_"${note}"_`);
  return sendSlackMessage(lines.join("\n"));
}

export type EditPostState = { error?: string; ok?: boolean };

// Anyone can edit or delete any post — this app has no real login, so
// attribution is just a convenience label, and edit needs to be able to fix
// exactly that label (e.g. a link logged under the wrong person).
export async function updatePostAction(
  postId: string,
  _prev: EditPostState,
  formData: FormData
): Promise<EditPostState> {
  const parsed = parsePostFields(formData);
  if ("error" in parsed) return parsed;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { error: "Post not found." };

  const member = await prisma.teamMember.findUnique({ where: { id: parsed.memberId } });
  if (!member) return { error: "Unknown team member." };

  const previewText =
    parsed.url === post.url ? post.previewText : await fetchTweetText(parsed.url);

  await prisma.post.update({
    where: { id: postId },
    data: {
      memberId: parsed.memberId,
      url: parsed.url,
      postedAt: parsed.postedAt,
      note: parsed.note,
      previewText,
    },
  });

  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { ok: true };
}

export async function deletePostAction(postId: string) {
  if (!postId) return;
  await prisma.post.delete({ where: { id: postId } }).catch(() => {});

  revalidatePath("/");
  revalidatePath("/leaderboard");
}

export async function setPostOfWeekAction(postId: string) {
  if (!postId) return;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;

  await prisma.$transaction([
    prisma.post.updateMany({
      where: { isPostOfWeek: true },
      data: { isPostOfWeek: false },
    }),
    ...(post.isPostOfWeek
      ? []
      : [
          prisma.post.update({
            where: { id: postId },
            data: { isPostOfWeek: true },
          }),
        ]),
  ]);

  revalidatePath("/");
}

export type QuickLogState = { error?: string; ok?: boolean };

export async function quickLogPostAction(
  _prev: QuickLogState,
  formData: FormData
): Promise<QuickLogState> {
  const memberId = String(formData.get("memberId") || "");
  const url = String(formData.get("url") || "").trim();
  const questId = String(formData.get("questId") || "").trim();

  if (!memberId) return { error: "Pick who you are from the dropdown at the top first." };
  if (!isXUrl(url)) {
    return { error: "That doesn't look like an X (twitter.com/x.com) link." };
  }

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || !member.active) return { error: "Unknown team member." };

  const previewText = await fetchTweetText(url);

  const post = await createManualPost({
    memberId,
    url,
    postedAt: new Date(),
    note: null,
    previewText,
  });
  await notifyNewPost(member.name, url);

  if (questId) {
    await attachPostToQuest(post.id, memberId, questId);
  }

  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/quests");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function addReactionAction(
  postId: string,
  memberId: string,
  emoji: string
) {
  if (!postId || !memberId || !emoji) return;
  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) return;

  await addComment({ postId, memberId, type: ReactionType.EMOJI, emoji });
  revalidatePath("/");
}

export type AddCommentState = { error?: string; ok?: boolean };

export async function addCommentAction(
  postId: string,
  _prev: AddCommentState,
  formData: FormData
): Promise<AddCommentState> {
  const memberId = String(formData.get("memberId") || "");
  const text = String(formData.get("text") || "").trim();

  if (!memberId) return { error: "Pick who you are." };
  if (!text) return { error: "Comment can't be empty." };
  if (text.length > 280) return { error: "Keep it under 280 characters." };

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) return { error: "Unknown team member." };

  await addComment({ postId, memberId, type: ReactionType.TEXT, text });
  revalidatePath("/");

  return { ok: true };
}

export type SettingsState = { error?: string; ok?: boolean };

export async function updateDefaultWeeklyTargetAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const raw = String(formData.get("target") || "");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    return { error: "Enter a number between 1 and 50." };
  }

  await setDefaultWeeklyTarget(n);
  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { ok: true };
}

export async function updateMemberTargetAction(
  memberId: string,
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const raw = String(formData.get("target") || "").trim();

  if (raw === "") {
    await prisma.teamMember.update({ where: { id: memberId }, data: { weeklyTarget: null } });
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { ok: true };
  }

  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    return { error: "Enter a number between 1 and 50, or leave blank to use the default." };
  }

  await prisma.teamMember.update({ where: { id: memberId }, data: { weeklyTarget: n } });
  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { ok: true };
}

export type QuestFormState = { error?: string; ok?: boolean };

function questSlackMessage(quest: {
  title: string;
  description: string | null;
  type: QuestType;
  points: number;
  linkUrl: string | null;
  ctaLabel: string | null;
}, audienceHandles: string[]) {
  const lines: string[] = [];
  if (quest.type === QuestType.PROMO) {
    lines.push("📣 *New post to support*");
    if (quest.description) lines.push(quest.description);
    if (quest.linkUrl) lines.push(`${quest.ctaLabel || "Open post"}: ${quest.linkUrl}`);
  } else {
    lines.push("🎯 *New Polify Quest*");
    lines.push(quest.title);
  }
  lines.push(`+${quest.points} points`);
  if (audienceHandles.length) lines.push(`For: ${audienceHandles.join(" ")}`);
  lines.push(`Open in Polify: ${appUrl("/quests")}`);
  return lines.join("\n");
}

async function notifyQuestCreated(
  quest: {
    title: string;
    description: string | null;
    type: QuestType;
    points: number;
    linkUrl: string | null;
    ctaLabel: string | null;
  },
  memberIds: string[]
) {
  let audienceHandles: string[] = [];
  if (memberIds.length) {
    const members = await prisma.teamMember.findMany({ where: { id: { in: memberIds } } });
    audienceHandles = members.map((m) => (m.slackHandle ? `*${m.slackHandle}*` : `*${m.name}*`));
  }
  await sendSlackMessage(questSlackMessage(quest, audienceHandles));
}

function parseQuestFields(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const type = formData.get("type") === "promo" ? QuestType.PROMO : QuestType.STANDARD;
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  const ctaLabel = String(formData.get("ctaLabel") || "").trim();
  const pointsRaw = Number.parseInt(String(formData.get("points") || ""), 10);
  const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 10;
  const targetRaw = Number.parseInt(String(formData.get("targetPosts") || ""), 10);
  const targetPosts = Number.isFinite(targetRaw) && targetRaw > 0 ? targetRaw : 1;
  const daysRaw = Number.parseInt(String(formData.get("endsInDays") || ""), 10);
  const endsInDays = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : null;
  const audience = formData.get("audience") === "specific" ? "specific" : "everyone";
  const memberIds = audience === "specific" ? formData.getAll("memberIds").map(String).filter(Boolean) : [];
  const notifySlack = formData.get("notifySlack") === "on";

  if (!title) return { error: "Give the quest a title." } as const;
  if (title.length > 120) return { error: "Keep the title under 120 characters." } as const;
  if (audience === "specific" && memberIds.length === 0) {
    return { error: "Pick at least one member, or choose Everyone." } as const;
  }
  if (type === QuestType.PROMO && !linkUrl) {
    return { error: "Promotional quests need a link to attach." } as const;
  }

  return {
    input: {
      title,
      description: description || null,
      type,
      linkUrl: linkUrl || null,
      ctaLabel: ctaLabel || null,
      points,
      targetPosts,
      endsInDays,
      memberIds,
    } satisfies CreateQuestInput,
    notifySlack,
  } as const;
}

export async function createQuestAction(
  _prev: QuestFormState,
  formData: FormData
): Promise<QuestFormState> {
  const parsed = parseQuestFields(formData);
  if ("error" in parsed) return parsed;

  const quest = await createQuest(parsed.input);

  if (parsed.notifySlack) {
    const settings = await getNotificationSettings();
    const setting: keyof NotificationSettings =
      quest.type === QuestType.PROMO ? "notifyPromotion" : "notifyNewQuest";
    if (settings[setting]) {
      await notifyQuestCreated(quest, parsed.input.memberIds);
    }
  }

  revalidatePath("/quests");
  revalidatePath("/dashboard");

  return { ok: true };
}

export type PushPromotionState = { error?: string; ok?: boolean };

// Push Promotion is a fast path into the same quest system — it creates a
// PROMO-type quest with Slack notify on by default, so there's one engine
// and one place quests live, rather than a parallel feature.
export async function pushPromotionAction(
  _prev: PushPromotionState,
  formData: FormData
): Promise<PushPromotionState> {
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const pointsRaw = Number.parseInt(String(formData.get("points") || ""), 10);
  const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 50;
  const audience = formData.get("audience") === "specific" ? "specific" : "everyone";
  const memberIds = audience === "specific" ? formData.getAll("memberIds").map(String).filter(Boolean) : [];
  const notifySlack = formData.get("notifySlack") !== "off";

  if (!linkUrl) return { error: "Paste a link to promote." };
  if (audience === "specific" && memberIds.length === 0) {
    return { error: "Pick at least one member, or choose Everyone." };
  }

  const quest = await createQuest({
    title: "Promote this post",
    description: message || null,
    type: QuestType.PROMO,
    linkUrl,
    ctaLabel: "Open post",
    points,
    targetPosts: 1,
    endsInDays: null,
    memberIds,
  });

  if (notifySlack) {
    const settings = await getNotificationSettings();
    if (settings.notifyPromotion) {
      await notifyQuestCreated(quest, memberIds);
    }
  }

  revalidatePath("/quests");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function archiveQuestAction(questId: string) {
  if (!questId) return;
  await setQuestActive(questId, false);
  revalidatePath("/quests");
}

export async function removeQuestAction(questId: string) {
  if (!questId) return;
  await deleteQuest(questId);
  revalidatePath("/quests");
}

export type JoinQuestState = { error?: string; ok?: boolean };

export async function joinQuestAction(
  questId: string,
  memberId: string
): Promise<JoinQuestState> {
  if (!questId || !memberId) return {};
  const result = await joinQuest(questId, memberId);
  if (result.error) return result;

  revalidatePath("/quests");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateNotificationSettingAction(
  key: keyof NotificationSettings,
  value: boolean
) {
  await setNotificationSetting(key, value);
  revalidatePath("/settings");
}

export type MemberFormState = { error?: string; ok?: boolean };

function parseMemberFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const xHandle = String(formData.get("xHandle") || "").trim().replace(/^@/, "");
  const slackHandleRaw = String(formData.get("slackHandle") || "").trim();
  const slackHandle = slackHandleRaw ? `@${slackHandleRaw.replace(/^@/, "")}` : null;

  if (!name) return { error: "Name is required." } as const;
  if (name.length > 60) return { error: "Keep the name under 60 characters." } as const;

  return { name, xHandle: xHandle || null, slackHandle } as const;
}

export async function createMemberAction(
  _prev: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseMemberFields(formData);
  if ("error" in parsed) return parsed;

  try {
    await prisma.teamMember.create({ data: parsed });
  } catch {
    return { error: "That X handle is already used by another member." };
  }

  revalidatePath("/settings");
  revalidatePath("/");

  return { ok: true };
}

export async function updateMemberAction(
  memberId: string,
  _prev: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseMemberFields(formData);
  if ("error" in parsed) return parsed;

  try {
    await prisma.teamMember.update({ where: { id: memberId }, data: parsed });
  } catch {
    return { error: "That X handle is already used by another member." };
  }

  revalidatePath("/settings");
  revalidatePath("/");

  return { ok: true };
}

// Members are never hard-deleted — "removing" one sets active: false so
// their past posts, reactions, and streak history stay intact. Toggling
// back to true "reactivates" them, same as the original data/team.ts seed
// script's semantics.
export async function setMemberActiveAction(memberId: string, active: boolean) {
  if (!memberId) return;
  await prisma.teamMember.update({ where: { id: memberId }, data: { active } });

  revalidatePath("/settings");
  revalidatePath("/");
}
