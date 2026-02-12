"use server";

import { auth } from "@clerk/nextjs/server";
import { getInsights as getInsightsLib } from "@/lib/insights";

/**
 * Server action wrapper for getInsights
 * Automatically gets userId from auth
 */
export async function getInsights(rangeDays: number = 14) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getInsightsLib(userId, rangeDays);
}
