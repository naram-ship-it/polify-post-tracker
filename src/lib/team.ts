import { prisma } from "@/lib/prisma";

export async function getActiveMembers() {
  return prisma.teamMember.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

// All members (active and inactive) for the Settings page.
export async function getAllMembers() {
  return prisma.teamMember.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}
