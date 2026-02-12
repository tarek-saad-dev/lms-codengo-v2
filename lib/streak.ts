"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userStreak } from "@/db/schema";
import { grantReward } from "@/lib/economy";
import { awardMilestoneBox } from "@/actions/boxes";

export type StreakState = {
  todayKey: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  freezes: number;
  canClaimToday: boolean;
  isAtRisk: boolean;
  daysSinceActive: number;
  lastClaimDate: string | null;
};

/**
 * getTodayDateKey
 *
 * Returns today's date in YYYY-MM-DD format based on server timezone.
 * This ensures consistent date handling across all streak operations.
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * getYesterdayDateKey
 *
 * Returns yesterday's date in YYYY-MM-DD format.
 */
function getYesterdayDateKey(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * getDaysDifference
 *
 * Calculate the number of days between two date strings.
 */
function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * getOrCreateUserStreak
 *
 * Get user's streak record or create a new one if it doesn't exist.
 */
async function getOrCreateUserStreak(userId: string) {
  let streak = await db.query.userStreak.findFirst({
    where: eq(userStreak.userId, userId),
  });

  if (!streak) {
    // Create new streak record with 1 freeze token
    const [newStreak] = await db
      .insert(userStreak)
      .values({
        userId,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        lastClaimDate: null,
        freezes: 1,
      })
      .returning();

    streak = newStreak;
  }

  return streak;
}

/**
 * updateStreakOnLearning
 *
 * Called when user completes a lesson successfully.
 * Updates streak based on activity pattern and freeze tokens.
 *
 * Rules:
 * - First time: streak = 1
 * - Same day: no change
 * - Consecutive day: streak += 1
 * - Gap with freeze: consume freeze, streak += 1
 * - Gap without freeze: reset to 1
 *
 * Returns updated streak state.
 */
export async function updateStreakOnLearning(
  userId: string,
): Promise<StreakState> {
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();

  // Get or create streak record
  const streak = await getOrCreateUserStreak(userId);

  // If already active today, no update needed
  if (streak.lastActiveDate === today) {
    return getStreakState(userId);
  }

  let newCurrentStreak = streak.currentStreak;
  let newBestStreak = streak.bestStreak;
  let newFreezes = streak.freezes;

  // Determine streak update logic
  if (!streak.lastActiveDate) {
    // First time learning
    newCurrentStreak = 1;
    newBestStreak = Math.max(newBestStreak, 1);
  } else if (streak.lastActiveDate === yesterday) {
    // Consecutive day - increment streak
    newCurrentStreak += 1;
    newBestStreak = Math.max(newBestStreak, newCurrentStreak);
  } else {
    // Gap detected
    const daysSinceActive = getDaysDifference(streak.lastActiveDate, today);

    if (daysSinceActive >= 2) {
      // Gap of 2+ days
      if (newFreezes > 0) {
        // Use freeze to maintain streak
        newFreezes -= 1;
        newCurrentStreak += 1;
        newBestStreak = Math.max(newBestStreak, newCurrentStreak);
      } else {
        // No freeze - reset streak
        newCurrentStreak = 1;
        newBestStreak = Math.max(newBestStreak, 1);
      }
    }
  }

  // Check for milestone: streak 7 grants +1 freeze (max 2)
  if (newCurrentStreak === 7 && newFreezes < 2) {
    newFreezes += 1;
  }

  // Update database
  await db
    .update(userStreak)
    .set({
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastActiveDate: today,
      freezes: newFreezes,
      updatedAt: new Date(),
    })
    .where(eq(userStreak.userId, userId));

  // Award streak milestone box at streak 7 (Phase U4)
  if (newCurrentStreak === 7) {
    await awardMilestoneBox(userId, "STREAK", "STREAK_7", {
      streakDay: 7,
      idempotencyKey: `box:streak:7:${today}`,
    });
  }

  return getStreakState(userId);
}

/**
 * getStreakState
 *
 * Get current streak state for a user.
 *
 * Returns:
 * - Current and best streak
 * - Whether user can claim today's reward
 * - Whether streak is at risk
 * - Days since last activity
 */
export async function getStreakState(userId: string): Promise<StreakState> {
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();

  const streak = await getOrCreateUserStreak(userId);

  // Calculate derived state
  const canClaimToday =
    streak.lastActiveDate === today && streak.lastClaimDate !== today;

  const isAtRisk =
    streak.lastActiveDate === yesterday && streak.lastActiveDate !== today;

  const daysSinceActive = streak.lastActiveDate
    ? getDaysDifference(streak.lastActiveDate, today)
    : 0;

  return {
    todayKey: today,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    lastActiveDate: streak.lastActiveDate,
    lastClaimDate: streak.lastClaimDate,
    freezes: streak.freezes,
    canClaimToday,
    isAtRisk,
    daysSinceActive,
  };
}

/**
 * claimDailyStreakReward
 *
 * Claim daily streak reward.
 *
 * Rules:
 * - Can only claim if active today
 * - Can only claim once per day
 * - Reward scales with streak (capped at 60 coins)
 *
 * Returns reward details or error.
 */
export async function claimDailyStreakReward() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const today = getTodayDateKey();
  const streak = await getOrCreateUserStreak(userId);

  // Validate claim eligibility
  if (streak.lastActiveDate !== today) {
    throw new Error("You must complete a lesson today to claim your reward");
  }

  if (streak.lastClaimDate === today) {
    throw new Error("You've already claimed your reward today");
  }

  // Calculate reward (scales with streak, capped at 60)
  const coinsReward = Math.min(10 + streak.currentStreak * 2, 60);

  // Grant reward via Economy Service (idempotent)
  const idempotencyKey = `streak:claim:${today}:${userId}`;

  await grantReward(
    userId,
    {
      coins: coinsReward,
      xp: 0,
      hearts: 0,
    },
    "STREAK_CLAIM",
    {
      streak: streak.currentStreak,
      idempotencyKey,
    },
  );

  // Update last claim date
  await db
    .update(userStreak)
    .set({
      lastClaimDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStreak.userId, userId));

  return {
    claimed: true,
    coinsGained: coinsReward,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    freezes: streak.freezes,
  };
}
