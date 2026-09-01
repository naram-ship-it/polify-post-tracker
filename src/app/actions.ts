"use server";

import { revalidatePath } from "next/cache";
import { ReactionType } from "@prisma/client";
import { createManualPost, isXUrl } from "@/lib/posts";
import { addComment } from "@/lib/comments";
import { prisma } from "@/lib/prisma";
import { fetchTweetText } from "@/lib/xEmbed";
import { setDefaultWeeklyTarget } from "@/lib/settings";
import { sendSlackMessage } from "@/lib/slack";
import { createQuest, setQuestActive, deleteQuest, toggleQuestCompletion } from "@/lib/quests";

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

export type LogPostState = { error?: string; ok?: boolean };

export async function logPostAction(
  _prev: LogPostState,
  formData: FormData
): Promise<LogPostState> {
  const parsed = parsePostFields(formData);
  if ("error" in parsed) return parsed;

  const member = await prisma.teamMember.findUnique({ where: { id: parsed.memberId } });
  if (!member || !member.active) return { error: "Unknown team member." };

  const previewText = await fetchTweetText(parsed.url);

  await createManualPost({ ...parsed, previewText });
  await notifyNewPost(member.name, parsed.url, parsed.note);

  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { ok: true };
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

  if (!memberId) return { error: "Pick who you are from the dropdown at the top first." };
  if (!isXUrl(url)) {
    return { error: "That doesn't look like an X (twitter.com/x.com) link." };
  }

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || !member.active) return { error: "Unknown team member." };

  const previewText = await fetchTweetText(url);

  await createManualPost({
    memberId,
    url,
    postedAt: new Date(),
    note: null,
    previewText,
  });
  await notifyNewPost(member.name, url);

  revalidatePath("/");
  revalidatePath("/leaderboard");

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

export async function createQuestAction(
  _prev: QuestFormState,
  formData: FormData
): Promise<QuestFormState> {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) return { error: "Give the quest a title." };
  if (title.length > 120) return { error: "Keep the title under 120 characters." };

  await createQuest(title, description || null);
  revalidatePath("/leaderboard");

  return { ok: true };
}

export async function archiveQuestAction(questId: string) {
  if (!questId) return;
  await setQuestActive(questId, false);
  revalidatePath("/leaderboard");
}

export async function removeQuestAction(questId: string) {
  if (!questId) return;
  await deleteQuest(questId);
  revalidatePath("/leaderboard");
}

export async function toggleQuestCompletionAction(questId: string, memberId: string) {
  if (!questId || !memberId) return;
  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) return;

  await toggleQuestCompletion(questId, memberId);
  revalidatePath("/leaderboard");
}
