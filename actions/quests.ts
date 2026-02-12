"use server";

import { auth } from "@clerk/nextjs/server";
import { ensureDailyQuests as ensureDailyQuestsLib, getTodayQuests as getTodayQuestsLib, claimQuestReward as claimQuestRewardLib, getQuestStats as getQuestStatsLib } from "@/lib/quests";

/**
 * Server action wrapper for ensureDailyQuests
 * Automatically gets userId from auth
 */
export async function ensureDailyQuests() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return ensureDailyQuestsLib(userId);
}

/**
 * Server action wrapper for getTodayQuests
 * Automatically gets userId from auth
 */
export async function getTodayQuests() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getTodayQuestsLib(userId);
}

/**
 * Server action wrapper for claimQuestReward
 * Automatically gets userId from auth (already in lib function)
 */
export async function claimQuestReward(questId: number) {
  return claimQuestRewardLib(questId);
}

/**
 * Server action wrapper for getQuestStats
 * Automatically gets userId from auth
 */
export async function getQuestStats() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getQuestStatsLib(userId);
}
