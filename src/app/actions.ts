"use server";

import { revalidatePath } from "next/cache";
import { Platform, ReactionType } from "@prisma/client";
import { createManualPost } from "@/lib/posts";
import { addComment } from "@/lib/comments";
import { prisma } from "@/lib/prisma";

export type LogPostState = { error?: string; ok?: boolean };

export async function logPostAction(
  _prev: LogPostState,
  formData: FormData
): Promise<LogPostState> {
  const memberId = String(formData.get("memberId") || "");
  const platform = String(formData.get("platform") || "");
  const url = String(formData.get("url") || "").trim();
  const dateStr = String(formData.get("postedAt") || "");
  const note = String(formData.get("note") || "").trim();

  if (!memberId) return { error: "Pick who you are." };
  if (platform !== "X" && platform !== "LINKEDIN") {
    return { error: "Pick a platform." };
  }
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { error: "Paste a valid post URL (starting with http:// or https://)." };
  }
  if (!dateStr) return { error: "Pick a date." };
  const postedAt = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(postedAt.getTime())) return { error: "Invalid date." };

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || !member.active) return { error: "Unknown team member." };

  await createManualPost({
    memberId,
    platform: platform as Platform,
    url,
    postedAt,
    note: note || null,
  });

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
