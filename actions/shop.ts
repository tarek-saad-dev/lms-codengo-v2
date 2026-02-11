"use server";

import { getUserProgress } from "@/db/queries";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { spendCoins, grantReward } from "@/lib/economy";

export const buyHeartsAction = async (amount: number, price: number) => {
  const { userId } = await auth();
  const progress = await getUserProgress();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!progress) {
    return { success: false, error: "User progress not found" };
  }

  if (progress.coins < price) {
    return { success: false, error: "Not enough coins" };
  }

  try {
    const orderId = `${userId}:${Date.now()}`;

    await spendCoins(userId, price, "SHOP_PURCHASE", {
      itemId: `hearts:${amount}`,
      orderId,
      idempotencyKey: `shop:hearts:${orderId}:spend`,
    });

    const result = await grantReward(
      userId,
      { hearts: amount },
      "SHOP_PURCHASE",
      {
        itemId: `hearts:${amount}`,
        orderId,
        idempotencyKey: `shop:hearts:${orderId}:grant`,
      },
    );

    revalidateTag(`user-progress:${userId}`);
    if (progress.activeCourseId) {
      revalidateTag(`course-progress:${userId}:${progress.activeCourseId}`);
    }

    return {
      success: true,
      data: {
        coins: result.coins,
        hearts: result.hearts,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to purchase hearts" };
  }
};

export const spinWheelAction = async () => {
  const { userId } = await auth();
  const progress = await getUserProgress();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!progress) {
    return { success: false, error: "User progress not found" };
  }

  if (progress.coins < 10) {
    return { success: false, error: "Not enough coins" };
  }

  try {
    const spinId = `${userId}:${Date.now()}`;

    await spendCoins(userId, 10, "SHOP_PURCHASE", {
      itemId: "wheel-spin",
      orderId: spinId,
      idempotencyKey: `shop:wheel:${spinId}:spend`,
    });

    const prizes = [
      { name: "10 Coins", value: 10, type: "coins" },
      { name: "1 Heart", value: 1, type: "hearts" },
      { name: "2 Hearts", value: 2, type: "hearts" },
      { name: "Premium Avatar", value: 0, type: "avatar" },
      { name: "Lesson Skip", value: 1, type: "skip" },
      { name: "XP Boost", value: 1, type: "boost" },
    ];

    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    let result = {
      coins: progress.coins - 10,
      hearts: progress.hearts,
      points: progress.points,
    };

    if (prize.type === "coins") {
      result = await grantReward(
        userId,
        { coins: prize.value },
        "SHOP_PURCHASE",
        {
          itemId: "wheel-spin",
          orderId: spinId,
          reason: prize.name,
          idempotencyKey: `shop:wheel:${spinId}:grant`,
        },
      );
    } else if (prize.type === "hearts") {
      result = await grantReward(
        userId,
        { hearts: prize.value },
        "SHOP_PURCHASE",
        {
          itemId: "wheel-spin",
          orderId: spinId,
          reason: prize.name,
          idempotencyKey: `shop:wheel:${spinId}:grant`,
        },
      );
    }

    revalidateTag(`user-progress:${userId}`);
    if (progress.activeCourseId) {
      revalidateTag(`course-progress:${userId}:${progress.activeCourseId}`);
    }

    return {
      success: true,
      data: {
        prize: prize.name,
        type: prize.type,
        value: prize.value,
        currentCoins: result.coins,
        currentHearts: result.hearts,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to spin wheel" };
  }
};

export const getShopData = async () => {
  const progress = await getUserProgress();

  if (!progress) {
    return null;
  }

  return {
    coins: progress.coins,
    hearts: progress.hearts,
  };
};
