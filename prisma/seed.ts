import { PrismaClient } from "@prisma/client";
import { team } from "../data/team";

const prisma = new PrismaClient();

async function main() {
  const configuredHandles = new Set(
    team.map((m) => m.xHandle).filter((h): h is string => !!h)
  );

  for (const member of team) {
    if (member.xHandle) {
      await prisma.teamMember.upsert({
        where: { xHandle: member.xHandle },
        update: {
          name: member.name,
          linkedinUrl: member.linkedinUrl || null,
          active: true,
        },
        create: {
          name: member.name,
          xHandle: member.xHandle,
          linkedinUrl: member.linkedinUrl || null,
          active: true,
        },
      });
    } else {
      // No xHandle to key on — match by name instead.
      const existing = await prisma.teamMember.findFirst({
        where: { name: member.name, xHandle: null },
      });
      if (existing) {
        await prisma.teamMember.update({
          where: { id: existing.id },
          data: { linkedinUrl: member.linkedinUrl || null, active: true },
        });
      } else {
        await prisma.teamMember.create({
          data: {
            name: member.name,
            linkedinUrl: member.linkedinUrl || null,
            active: true,
          },
        });
      }
    }
  }

  // Deactivate (don't delete) anyone removed from the config, so their
  // historical posts/comments stay intact.
  const allWithHandles = await prisma.teamMember.findMany({
    where: { xHandle: { not: null } },
  });
  for (const m of allWithHandles) {
    if (m.xHandle && !configuredHandles.has(m.xHandle) && m.active) {
      await prisma.teamMember.update({
        where: { id: m.id },
        data: { active: false },
      });
    }
  }

  console.log(`Seeded ${team.length} team member(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
