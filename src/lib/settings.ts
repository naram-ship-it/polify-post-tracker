import { prisma } from "@/lib/prisma";

export async function getDefaultWeeklyTarget(): Promise<number> {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return settings.defaultWeeklyTarget;
}

export async function setDefaultWeeklyTarget(target: number): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { defaultWeeklyTarget: target },
    create: { id: 1, defaultWeeklyTarget: target },
  });
}
