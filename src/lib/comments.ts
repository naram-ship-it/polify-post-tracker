import { prisma } from "@/lib/prisma";
import { ReactionType } from "@prisma/client";

export type NewCommentInput = {
  postId: string;
  memberId: string;
  type: ReactionType;
  emoji?: string;
  text?: string;
};

export async function addComment(input: NewCommentInput) {
  return prisma.comment.create({
    data: {
      postId: input.postId,
      memberId: input.memberId,
      type: input.type,
      emoji: input.emoji || null,
      text: input.text || null,
    },
  });
}

export async function countEngagementForRange(start: Date, end: Date): Promise<number> {
  return prisma.comment.count({ where: { createdAt: { gte: start, lte: end } } });
}
