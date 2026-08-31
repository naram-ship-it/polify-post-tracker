import { prisma } from "@/lib/prisma";

export async function getActiveMembers() {
  return prisma.teamMember.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}
