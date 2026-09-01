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

export type NotificationSettings = {
  notifyNewQuest: boolean;
  notifyPromotion: boolean;
  notifyWeeklyQuota: boolean;
  notifyQuestDeadline: boolean;
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const s = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return {
    notifyNewQuest: s.notifyNewQuest,
    notifyPromotion: s.notifyPromotion,
    notifyWeeklyQuota: s.notifyWeeklyQuota,
    notifyQuestDeadline: s.notifyQuestDeadline,
  };
}

export async function setNotificationSetting(
  key: keyof NotificationSettings,
  value: boolean
): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { [key]: value },
    create: { id: 1, [key]: value },
  });
}
