"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { eq, and } from "drizzle-orm";
import { userQuests } from "@/db/schema";
import { getTodayDateKey } from "@/lib/streak";
import { grantReward } from "@/lib/economy";

export type QuestType =
  | "COMPLETE_LESSONS"
  | "CORRECT_ANSWERS"
  | "EARN_XP"
  | "OPEN_BOX";
export type QuestStatus = "ACTIVE" | "COMPLETED" | "CLAIMED";

export type QuestMeta = {
  ruleVersion?: string;
};

export type Quest = {
  id: number;
  userId: string;
  dateKey: string;
  questType: QuestType;
  target: number;
  progress: number;
  status: QuestStatus;
  rewardCoins: number;
  rewardXp: number;
  rewardHearts: number;
  meta: QuestMeta | null;
  createdAt: Date;
  updatedAt: Date;
};

export const QUEST_RULE_VERSION = "qv1";

/**
 * Quest Templates
 * Define default daily quests with targets and rewards
 */
export const QUEST_TEMPLATES = [
  {
    questType: "COMPLETE_LESSONS" as QuestType,
    target: 2,
    rewardCoins: 30,
    rewardXp: 0,
    rewardHearts: 0,
  },
  {
    questType: "CORRECT_ANSWERS" as QuestType,
    target: 10,
    rewardCoins: 25,
    rewardXp: 0,
    rewardHearts: 0,
  },
];

/**
 * Get quest display name
 */
export function getQuestDisplayName(questType: QuestType): string {
  const names: Record<QuestType, string> = {
    COMPLETE_LESSONS: "Complete Lessons",
    CORRECT_ANSWERS: "Answer Correctly",
    EARN_XP: "Earn XP",
    OPEN_BOX: "Open a Chest",
  };
  return names[questType];
}

/**
 * Get quest description
 */
export function getQuestDescription(
  questType: QuestType,
  target: number,
): string {
  const descriptions: Record<QuestType, string> = {
    COMPLETE_LESSONS: `Complete ${target} lesson${target > 1 ? "s" : ""}`,
    CORRECT_ANSWERS: `Answer ${target} questions correctly`,
    EARN_XP: `Earn ${target} XP`,
    OPEN_BOX: `Open ${target} chest${target > 1 ? "s" : ""}`,
  };
  return descriptions[questType];
}

/**
 * Get quest icon
 */
export function getQuestIcon(questType: QuestType): string {
  const icons: Record<QuestType, string> = {
    COMPLETE_LESSONS: "📚",
    CORRECT_ANSWERS: "✅",
    EARN_XP: "⭐",
    OPEN_BOX: "🎁",
  };
  return icons[questType];
}

/**
 * ensureDailyQuests
 *
 * Generate daily quests for a user if they don't exist for today.
 * Idempotent - only creates quests once per day.
 *
 * Returns today's quests.
 */
export async function ensureDailyQuests(userId: string): Promise<Quest[]> {
  const today = getTodayDateKey();

  // Check if quests already exist for today
  const existingQuests = await db.query.userQuests.findMany({
    where: and(eq(userQuests.userId, userId), eq(userQuests.dateKey, today)),
  });

  if (existingQuests.length > 0) {
    return existingQuests as Quest[];
  }

  // Create new daily quests from templates
  const newQuests = await Promise.all(
    QUEST_TEMPLATES.map(async (template) => {
      const [quest] = await db
        .insert(userQuests)
        .values({
          userId,
          dateKey: today,
          questType: template.questType,
          target: template.target,
          progress: 0,
          status: "ACTIVE",
          rewardCoins: template.rewardCoins,
          rewardXp: template.rewardXp,
          rewardHearts: template.rewardHearts,
          meta: {
            ruleVersion: QUEST_RULE_VERSION,
          },
        })
        .returning();

      return quest as Quest;
    }),
  );

  return newQuests;
}

/**
 * getTodayQuests
 *
 * Get all quests for today (ensures they exist first).
 */
export async function getTodayQuests(userId: string): Promise<Quest[]> {
  return ensureDailyQuests(userId);
}

/**
 * updateQuestProgress
 *
 * Update progress for a specific quest type.
 * Auto-completes quest when progress >= target.
 *
 * Idempotent - safe to call multiple times.
 */
export async function updateQuestProgress(
  userId: string,
  questType: QuestType,
  increment: number = 1,
): Promise<void> {
  const today = getTodayDateKey();

  // Ensure quests exist for today
  await ensureDailyQuests(userId);

  // Find the quest
  const quest = await db.query.userQuests.findFirst({
    where: and(
      eq(userQuests.userId, userId),
      eq(userQuests.dateKey, today),
      eq(userQuests.questType, questType),
    ),
  });

  if (!quest) {
    // Quest doesn't exist for this type (might not be in templates)
    return;
  }

  // Don't update if already completed or claimed
  if (quest.status !== "ACTIVE") {
    return;
  }

  // Update progress
  const newProgress = quest.progress + increment;
  const newStatus = newProgress >= quest.target ? "COMPLETED" : "ACTIVE";

  await db
    .update(userQuests)
    .set({
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(userQuests.id, quest.id));
}

/**
 * claimQuestReward
 *
 * Claim rewards for a completed quest.
 * Idempotent - uses Economy Service idempotency.
 */
export async function claimQuestReward(questId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get quest
  const quest = await db.query.userQuests.findFirst({
    where: and(eq(userQuests.id, questId), eq(userQuests.userId, userId)),
  });

  if (!quest) {
    throw new Error("Quest not found");
  }

  // Verify quest is completed
  if (quest.status !== "COMPLETED") {
    throw new Error("Quest is not completed");
  }

  // Grant rewards via Economy Service (idempotent)
  const idempotencyKey = `quest:claim:${questId}`;
  const economyResult = await grantReward(
    userId,
    {
      coins: quest.rewardCoins,
      xp: quest.rewardXp,
      hearts: quest.rewardHearts,
    },
    "QUEST_CLAIM",
    {
      idempotencyKey,
    },
  );

  // Update quest status to CLAIMED
  await db
    .update(userQuests)
    .set({
      status: "CLAIMED",
      updatedAt: new Date(),
    })
    .where(eq(userQuests.id, questId));

  return {
    questId,
    questType: quest.questType,
    rewards: {
      coins: quest.rewardCoins,
      xp: quest.rewardXp,
      hearts: quest.rewardHearts,
    },
    updatedEconomy: {
      hearts: economyResult.hearts,
      xp: economyResult.points,
      coins: economyResult.coins,
    },
  };
}

/**
 * getQuestStats
 *
 * Get quest statistics for nudges and UI.
 */
export async function getQuestStats(userId: string) {
  const quests = await getTodayQuests(userId);

  const activeQuests = quests.filter((q) => q.status === "ACTIVE");
  const completedQuests = quests.filter((q) => q.status === "COMPLETED");
  const claimedQuests = quests.filter((q) => q.status === "CLAIMED");

  // Find quests that are 1 away from completion
  const almostComplete = activeQuests.filter(
    (q) => q.target - q.progress === 1,
  );

  return {
    total: quests.length,
    active: activeQuests.length,
    completed: completedQuests.length,
    claimed: claimedQuests.length,
    almostComplete: almostComplete.length,
    quests,
  };
}
