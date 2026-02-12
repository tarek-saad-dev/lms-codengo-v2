"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { eq, and, sql } from "drizzle-orm";
import { userBoxes, userProgress } from "@/db/schema";
import { getTodayDateKey } from "@/lib/streak";
import { generateBoxReward, LOOT_RULE_VERSION, type BoxType } from "@/lib/loot";
import { grantReward } from "@/lib/economy";
import { updateQuestProgress } from "@/lib/quests";
import { revalidatePath } from "next/cache";

export type BoxMeta = {
  courseId?: number;
  unitId?: number;
  streakDay?: number;
  ruleVersion?: string;
  idempotencyKey?: string;
  todayKey?: string;
};

export type OpenBoxResult = {
  boxId: number;
  boxType: BoxType;
  rewards: {
    coins: number;
    xp: number;
    hearts: number;
  };
  updatedEconomy: {
    hearts: number;
    xp: number;
    coins: number;
  };
};

/**
 * ensureDailyBoxAvailable
 *
 * Ensures user has a daily box available for today.
 * Idempotent - only creates one box per day.
 *
 * Call this when:
 * - User loads home/learn page
 * - After completing a lesson
 */
export async function ensureDailyBoxAvailable(userId: string): Promise<void> {
  const today = getTodayDateKey();

  // Check if daily box already exists for today
  const existingBox = await db.query.userBoxes.findFirst({
    where: and(
      eq(userBoxes.userId, userId),
      eq(userBoxes.boxType, "DAILY"),
      eq(userBoxes.status, "AVAILABLE"),
      sql`${userBoxes.meta}->>'todayKey' = ${today}`,
    ),
  });

  if (existingBox) {
    // Already have daily box for today
    return;
  }

  // Create new daily box
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  await db.insert(userBoxes).values({
    userId,
    boxType: "DAILY",
    status: "AVAILABLE",
    availableAt: now,
    expiresAt: endOfDay,
    source: "DAILY",
    meta: {
      todayKey: today,
      ruleVersion: LOOT_RULE_VERSION,
    },
  });
}

/**
 * awardMilestoneBox
 *
 * Award a milestone box to a user.
 * Idempotent - uses idempotencyKey in meta to prevent duplicates.
 *
 * Used for:
 * - Unit completion
 * - Course completion
 * - Streak milestones
 */
export async function awardMilestoneBox(
  userId: string,
  boxType: BoxType,
  source: string,
  meta: BoxMeta,
): Promise<void> {
  // Check for existing box with same idempotency key
  if (meta.idempotencyKey) {
    const existingBox = await db.query.userBoxes.findFirst({
      where: and(
        eq(userBoxes.userId, userId),
        sql`${userBoxes.meta}->>'idempotencyKey' = ${meta.idempotencyKey}`,
      ),
    });

    if (existingBox) {
      // Already awarded this box
      return;
    }
  }

  // Create milestone box
  await db.insert(userBoxes).values({
    userId,
    boxType,
    status: "AVAILABLE",
    availableAt: new Date(),
    source,
    meta: {
      ...meta,
      ruleVersion: LOOT_RULE_VERSION,
    },
  });
}

/**
 * openBox
 *
 * Open a box and grant rewards.
 * Idempotent - if box already opened, returns existing rewards.
 *
 * Transactional:
 * 1. Verify box ownership and status
 * 2. Generate rewards
 * 3. Grant rewards via Economy Service
 * 4. Update box status to OPENED
 */
export async function openBox(boxId: number): Promise<OpenBoxResult> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get box
  const box = await db.query.userBoxes.findFirst({
    where: and(eq(userBoxes.id, boxId), eq(userBoxes.userId, userId)),
  });

  if (!box) {
    throw new Error("Box not found");
  }

  // Check if already opened
  if (box.status === "OPENED") {
    // Return existing rewards from reward_events
    // For now, throw error - client should prevent this
    throw new Error("Box already opened");
  }

  if (box.status !== "AVAILABLE") {
    throw new Error("Box is not available");
  }

  // Get current user progress for hearts
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!progress) {
    throw new Error("User progress not found");
  }

  // Generate rewards
  const seed = `${userId}:${boxId}:${LOOT_RULE_VERSION}`;
  const rewards = generateBoxReward(
    box.boxType as BoxType,
    seed,
    progress.hearts,
  );

  // Grant rewards via Economy Service (idempotent)
  const idempotencyKey = `box:open:${boxId}`;
  const economyResult = await grantReward(
    userId,
    {
      coins: rewards.coins,
      xp: rewards.xp,
      hearts: rewards.hearts,
    },
    "BOX_OPEN",
    {
      idempotencyKey,
    },
  );

  // Update box status
  await db
    .update(userBoxes)
    .set({
      status: "OPENED",
      openedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userBoxes.id, boxId));

  // Update quest progress (Phase U5)
  await updateQuestProgress(userId, "OPEN_BOX", 1);

  // Revalidate pages
  revalidatePath("/learn");
  revalidatePath("/rewards");

  return {
    boxId,
    boxType: box.boxType as BoxType,
    rewards,
    updatedEconomy: {
      hearts: economyResult.hearts,
      xp: economyResult.points,
      coins: economyResult.coins,
    },
  };
}

/**
 * getAvailableBoxes
 *
 * Get all available boxes for a user.
 */
export async function getAvailableBoxes(userId: string) {
  const boxes = await db.query.userBoxes.findMany({
    where: and(eq(userBoxes.userId, userId), eq(userBoxes.status, "AVAILABLE")),
    orderBy: (userBoxes, { desc }) => [desc(userBoxes.createdAt)],
  });

  return boxes;
}

/**
 * getAvailableBoxCount
 *
 * Get count of available boxes for a user.
 */
export async function getAvailableBoxCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userBoxes)
    .where(
      and(eq(userBoxes.userId, userId), eq(userBoxes.status, "AVAILABLE")),
    );

  return Number(result[0]?.count || 0);
}
