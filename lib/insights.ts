"use server";

import db from "@/db/drizzle";
import { eq, and, gte } from "drizzle-orm";
import { rewardEvents, userProgress, userBoxes, userQuests } from "@/db/schema";
import { getStreakState } from "@/lib/streak";
import { getAvailableBoxCount } from "@/actions/boxes";

/**
 * Date Helper Functions
 */

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function getEndOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function getDateKeysForRange(rangeDays: number): string[] {
  const keys: string[] = [];
  const today = new Date();

  for (let i = rangeDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    keys.push(getDateKeyFromDate(date));
  }

  return keys;
}

export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Level Calculation Functions
 */

export function calculateLevel(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const xpToNextLevel = 100 - xpIntoLevel;

  return {
    level,
    xpIntoLevel,
    xpToNextLevel,
  };
}

/**
 * Main Insights Aggregation
 */

export type InsightsData = {
  todayKey: string;
  economy: {
    hearts: number;
    xp: number;
    coins: number;
  };
  level: {
    level: number;
    xpIntoLevel: number;
    xpToNextLevel: number;
  };
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastActiveDate: string | null;
    freezes: number;
    lastNDays: Array<{
      dateKey: string;
      didLearn: boolean;
      didClaim: boolean;
    }>;
  };
  coins: {
    earnedToday: number;
    earnedLast7Days: number;
    earnedLastNDays: Array<{
      dateKey: string;
      earned: number;
    }>;
  };
  xp: {
    gainedToday: number;
    gainedLast7Days: number;
    gainedLastNDays: Array<{
      dateKey: string;
      gained: number;
    }>;
  };
  boxes: {
    availableCount: number;
    openedToday: number;
    openedLast7Days: number;
    openedByTypeLastNDays: Array<{
      dateKey: string;
      daily: number;
      bronze: number;
      silver: number;
      gold: number;
      unit: number;
      course: number;
      streak: number;
    }>;
  };
  quests: {
    completedToday: number;
    claimedToday: number;
    completionLastNDays: Array<{
      dateKey: string;
      completed: number;
      claimed: number;
    }>;
  };
};

export async function getInsights(
  userId: string,
  rangeDays: number = 14,
): Promise<InsightsData> {
  const todayKey = getTodayDateKey();
  const dateKeys = getDateKeysForRange(rangeDays);

  // Get user progress (economy snapshot)
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!progress) {
    throw new Error("User progress not found");
  }

  // Get streak state
  const streakState = await getStreakState(userId);

  // Calculate level
  const levelInfo = calculateLevel(progress.points);

  // Get reward events for the range
  const startDate = getDaysAgo(rangeDays - 1);
  const events = await db.query.rewardEvents.findMany({
    where: and(
      eq(rewardEvents.userId, userId),
      gte(rewardEvents.createdAt, startDate),
    ),
    orderBy: (rewardEvents, { asc }) => [asc(rewardEvents.createdAt)],
  });

  // Group events by dateKey
  const eventsByDate = new Map<string, typeof events>();
  events.forEach((event) => {
    const dateKey = getDateKeyFromDate(event.createdAt);
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Calculate coins earned per day
  const coinsLastNDays = dateKeys.map((dateKey) => {
    const dayEvents = eventsByDate.get(dateKey) || [];
    const earned = dayEvents
      .filter((e) => e.deltaCoins > 0)
      .reduce((sum, e) => sum + e.deltaCoins, 0);
    return { dateKey, earned };
  });

  const earnedToday =
    coinsLastNDays.find((d) => d.dateKey === todayKey)?.earned || 0;
  const earnedLast7Days = coinsLastNDays
    .slice(-7)
    .reduce((sum, d) => sum + d.earned, 0);

  // Calculate XP gained per day
  const xpLastNDays = dateKeys.map((dateKey) => {
    const dayEvents = eventsByDate.get(dateKey) || [];
    const gained = dayEvents
      .filter((e) => e.deltaXp > 0)
      .reduce((sum, e) => sum + e.deltaXp, 0);
    return { dateKey, gained };
  });

  const gainedToday =
    xpLastNDays.find((d) => d.dateKey === todayKey)?.gained || 0;
  const gainedLast7Days = xpLastNDays
    .slice(-7)
    .reduce((sum, d) => sum + d.gained, 0);

  // Calculate streak history (didLearn, didClaim)
  const streakLastNDays = dateKeys.map((dateKey) => {
    const dayEvents = eventsByDate.get(dateKey) || [];
    const didLearn = dayEvents.some((e) => e.source === "LESSON_COMPLETE");
    const didClaim = dayEvents.some((e) => e.source === "STREAK_CLAIM");
    return { dateKey, didLearn, didClaim };
  });

  // Get boxes data
  const availableCount = await getAvailableBoxCount(userId);

  const boxesInRange = await db.query.userBoxes.findMany({
    where: and(
      eq(userBoxes.userId, userId),
      eq(userBoxes.status, "OPENED"),
      gte(userBoxes.openedAt, startDate),
    ),
  });

  // Group boxes by date and type
  const boxesByDate = new Map<string, typeof boxesInRange>();
  boxesInRange.forEach((box) => {
    if (box.openedAt) {
      const dateKey = getDateKeyFromDate(box.openedAt);
      if (!boxesByDate.has(dateKey)) {
        boxesByDate.set(dateKey, []);
      }
      boxesByDate.get(dateKey)!.push(box);
    }
  });

  const openedByTypeLastNDays = dateKeys.map((dateKey) => {
    const dayBoxes = boxesByDate.get(dateKey) || [];
    return {
      dateKey,
      daily: dayBoxes.filter((b) => b.boxType === "DAILY").length,
      bronze: dayBoxes.filter((b) => b.boxType === "BRONZE").length,
      silver: dayBoxes.filter((b) => b.boxType === "SILVER").length,
      gold: dayBoxes.filter((b) => b.boxType === "GOLD").length,
      unit: dayBoxes.filter((b) => b.boxType === "UNIT").length,
      course: dayBoxes.filter((b) => b.boxType === "COURSE").length,
      streak: dayBoxes.filter((b) => b.boxType === "STREAK").length,
    };
  });

  const todayBoxes = openedByTypeLastNDays.find((d) => d.dateKey === todayKey);
  const openedToday = todayBoxes
    ? todayBoxes.daily +
      todayBoxes.bronze +
      todayBoxes.silver +
      todayBoxes.gold +
      todayBoxes.unit +
      todayBoxes.course +
      todayBoxes.streak
    : 0;

  const openedLast7Days = openedByTypeLastNDays.slice(-7).reduce((sum, d) => {
    return (
      sum +
      d.daily +
      d.bronze +
      d.silver +
      d.gold +
      d.unit +
      d.course +
      d.streak
    );
  }, 0);

  // Get quests data
  const questsInRange = await db.query.userQuests.findMany({
    where: and(
      eq(userQuests.userId, userId),
      gte(userQuests.createdAt, startDate),
    ),
  });

  // Group quests by dateKey
  const questsByDate = new Map<string, typeof questsInRange>();
  questsInRange.forEach((quest) => {
    if (!questsByDate.has(quest.dateKey)) {
      questsByDate.set(quest.dateKey, []);
    }
    questsByDate.get(quest.dateKey)!.push(quest);
  });

  const completionLastNDays = dateKeys.map((dateKey) => {
    const dayQuests = questsByDate.get(dateKey) || [];
    const completed = dayQuests.filter(
      (q) => q.status === "COMPLETED" || q.status === "CLAIMED",
    ).length;
    const claimed = dayQuests.filter((q) => q.status === "CLAIMED").length;
    return { dateKey, completed, claimed };
  });

  const completedToday =
    completionLastNDays.find((d) => d.dateKey === todayKey)?.completed || 0;
  const claimedToday =
    completionLastNDays.find((d) => d.dateKey === todayKey)?.claimed || 0;

  return {
    todayKey,
    economy: {
      hearts: progress.hearts,
      xp: progress.points,
      coins: progress.coins,
    },
    level: levelInfo,
    streak: {
      currentStreak: streakState.currentStreak,
      bestStreak: streakState.bestStreak,
      lastActiveDate: streakState.lastActiveDate,
      freezes: streakState.freezes,
      lastNDays: streakLastNDays,
    },
    coins: {
      earnedToday,
      earnedLast7Days,
      earnedLastNDays: coinsLastNDays,
    },
    xp: {
      gainedToday,
      gainedLast7Days,
      gainedLastNDays: xpLastNDays,
    },
    boxes: {
      availableCount,
      openedToday,
      openedLast7Days,
      openedByTypeLastNDays,
    },
    quests: {
      completedToday,
      claimedToday,
      completionLastNDays,
    },
  };
}
