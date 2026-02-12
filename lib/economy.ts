"use server";

import { eq, and, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { userProgress, rewardEvents } from "@/db/schema";
import { MAX_HEARTS } from "@/constants";

export type RewardSource =
  | "LESSON_COMPLETE"
  | "CHALLENGE_SUCCESS"
  | "CHALLENGE_FAIL"
  | "PRACTICE"
  | "SHOP_PURCHASE"
  | "SYSTEM_ADJUST"
  | "MIGRATION"
  | "STREAK_CLAIM"
  | "BOX_OPEN"
  | "QUEST_CLAIM";

export interface RewardPayload {
  hearts?: number;
  xp?: number;
  coins?: number;
}

export interface RewardMeta {
  courseId?: number;
  lessonId?: number;
  unitId?: number;
  challengeId?: number;
  reason?: string;
  idempotencyKey?: string;
  itemId?: string;
  orderId?: string;
  attemptId?: string;
  streak?: number;
}

export interface EconomyResult {
  userId: string;
  hearts: number;
  points: number;
  coins: number;
}

function clampValue(value: number, min: number, max?: number): number {
  let clamped = Math.max(min, value);
  if (max !== undefined) {
    clamped = Math.min(clamped, max);
  }
  return clamped;
}

function logEconomyEvent(
  source: RewardSource,
  userId: string,
  deltaHearts: number,
  deltaXp: number,
  deltaCoins: number,
  meta?: RewardMeta,
) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[ECONOMY] source=${source} userId=${userId} deltaHearts=${deltaHearts} deltaXp=${deltaXp} deltaCoins=${deltaCoins}`,
      meta ? `meta=${JSON.stringify(meta)}` : "",
    );
  }
}

export async function grantReward(
  userId: string,
  payload: RewardPayload,
  source: RewardSource,
  meta?: RewardMeta,
): Promise<EconomyResult> {
  return await db.transaction(async (tx) => {
    if (meta?.idempotencyKey) {
      const existing = await tx
        .select()
        .from(rewardEvents)
        .where(
          and(
            eq(rewardEvents.userId, userId),
            sql`${rewardEvents.meta}->>'idempotencyKey' = ${meta.idempotencyKey}`,
          ),
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const currentProgress = await tx.query.userProgress.findFirst({
          where: eq(userProgress.userId, userId),
        });

        if (!currentProgress) {
          throw new Error("User progress not found");
        }

        return {
          userId: currentProgress.userId,
          hearts: currentProgress.hearts,
          points: currentProgress.points,
          coins: currentProgress.coins,
        };
      }
    }

    const currentProgress = await tx.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (!currentProgress) {
      throw new Error("User progress not found");
    }

    const deltaHearts = payload.hearts ?? 0;
    const deltaXp = payload.xp ?? 0;
    const deltaCoins = payload.coins ?? 0;

    const beforeHearts = currentProgress.hearts;
    const beforeXp = currentProgress.points;
    const beforeCoins = currentProgress.coins;

    const afterHearts = clampValue(beforeHearts + deltaHearts, 0, MAX_HEARTS);
    const afterXp = clampValue(beforeXp + deltaXp, 0);
    const afterCoins = clampValue(beforeCoins + deltaCoins, 0);

    await tx
      .update(userProgress)
      .set({
        hearts: afterHearts,
        points: afterXp,
        coins: afterCoins,
      })
      .where(eq(userProgress.userId, userId));

    await tx.insert(rewardEvents).values({
      userId,
      source,
      deltaHearts,
      deltaXp,
      deltaCoins,
      beforeHearts,
      afterHearts,
      beforeXp,
      afterXp,
      beforeCoins,
      afterCoins,
      meta: meta ? (meta as unknown as Record<string, unknown>) : null,
    });

    logEconomyEvent(source, userId, deltaHearts, deltaXp, deltaCoins, meta);

    return {
      userId,
      hearts: afterHearts,
      points: afterXp,
      coins: afterCoins,
    };
  });
}

export async function spendCoins(
  userId: string,
  amount: number,
  source: RewardSource,
  meta?: RewardMeta,
): Promise<EconomyResult> {
  return await db.transaction(async (tx) => {
    if (meta?.idempotencyKey) {
      const existing = await tx
        .select()
        .from(rewardEvents)
        .where(
          and(
            eq(rewardEvents.userId, userId),
            sql`${rewardEvents.meta}->>'idempotencyKey' = ${meta.idempotencyKey}`,
          ),
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const currentProgress = await tx.query.userProgress.findFirst({
          where: eq(userProgress.userId, userId),
        });

        if (!currentProgress) {
          throw new Error("User progress not found");
        }

        return {
          userId: currentProgress.userId,
          hearts: currentProgress.hearts,
          points: currentProgress.points,
          coins: currentProgress.coins,
        };
      }
    }

    const currentProgress = await tx.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (!currentProgress) {
      throw new Error("User progress not found");
    }

    if (currentProgress.coins < amount) {
      throw new Error("Insufficient coins");
    }

    const beforeHearts = currentProgress.hearts;
    const beforeXp = currentProgress.points;
    const beforeCoins = currentProgress.coins;

    const afterCoins = beforeCoins - amount;

    await tx
      .update(userProgress)
      .set({
        coins: afterCoins,
      })
      .where(eq(userProgress.userId, userId));

    await tx.insert(rewardEvents).values({
      userId,
      source,
      deltaHearts: 0,
      deltaXp: 0,
      deltaCoins: -amount,
      beforeHearts,
      afterHearts: beforeHearts,
      beforeXp,
      afterXp: beforeXp,
      beforeCoins,
      afterCoins,
      meta: meta ? (meta as unknown as Record<string, unknown>) : null,
    });

    logEconomyEvent(source, userId, 0, 0, -amount, meta);

    return {
      userId,
      hearts: beforeHearts,
      points: beforeXp,
      coins: afterCoins,
    };
  });
}

export async function setEconomy(
  userId: string,
  nextValues: RewardPayload,
  source: RewardSource = "SYSTEM_ADJUST",
  meta?: RewardMeta,
): Promise<EconomyResult> {
  return await db.transaction(async (tx) => {
    if (meta?.idempotencyKey) {
      const existing = await tx
        .select()
        .from(rewardEvents)
        .where(
          and(
            eq(rewardEvents.userId, userId),
            sql`${rewardEvents.meta}->>'idempotencyKey' = ${meta.idempotencyKey}`,
          ),
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const currentProgress = await tx.query.userProgress.findFirst({
          where: eq(userProgress.userId, userId),
        });

        if (!currentProgress) {
          throw new Error("User progress not found");
        }

        return {
          userId: currentProgress.userId,
          hearts: currentProgress.hearts,
          points: currentProgress.points,
          coins: currentProgress.coins,
        };
      }
    }

    const currentProgress = await tx.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (!currentProgress) {
      throw new Error("User progress not found");
    }

    const beforeHearts = currentProgress.hearts;
    const beforeXp = currentProgress.points;
    const beforeCoins = currentProgress.coins;

    const afterHearts =
      nextValues.hearts !== undefined
        ? clampValue(nextValues.hearts, 0, MAX_HEARTS)
        : beforeHearts;
    const afterXp =
      nextValues.xp !== undefined ? clampValue(nextValues.xp, 0) : beforeXp;
    const afterCoins =
      nextValues.coins !== undefined
        ? clampValue(nextValues.coins, 0)
        : beforeCoins;

    const deltaHearts = afterHearts - beforeHearts;
    const deltaXp = afterXp - beforeXp;
    const deltaCoins = afterCoins - beforeCoins;

    await tx
      .update(userProgress)
      .set({
        hearts: afterHearts,
        points: afterXp,
        coins: afterCoins,
      })
      .where(eq(userProgress.userId, userId));

    await tx.insert(rewardEvents).values({
      userId,
      source,
      deltaHearts,
      deltaXp,
      deltaCoins,
      beforeHearts,
      afterHearts,
      beforeXp,
      afterXp,
      beforeCoins,
      afterCoins,
      meta: meta ? (meta as unknown as Record<string, unknown>) : null,
    });

    logEconomyEvent(source, userId, deltaHearts, deltaXp, deltaCoins, meta);

    return {
      userId,
      hearts: afterHearts,
      points: afterXp,
      coins: afterCoins,
    };
  });
}
