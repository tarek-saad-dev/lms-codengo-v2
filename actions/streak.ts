"use server";

import { auth } from "@clerk/nextjs/server";
import { getStreakState as getStreakStateLib, claimDailyStreakReward as claimDailyStreakRewardLib } from "@/lib/streak";

/**
 * Server action wrapper for getStreakState
 * Automatically gets userId from auth
 */
export async function getStreakState() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getStreakStateLib(userId);
}

/**
 * Server action wrapper for claimDailyStreakReward
 * Automatically gets userId from auth
 */
export async function claimDailyStreakReward() {
  return claimDailyStreakRewardLib();
}
