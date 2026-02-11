"use server";

import { getUserProgress, updateUserProgress } from "@/db/queries";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export const buyHeartsAction = async (amount: number, price: number) => {
  const { userId } = await auth();
  const progress = await getUserProgress();

  if (!progress) {
    return { success: false, error: "User progress not found" };
  }

  if (progress.coins < price) {
    return { success: false, error: "Not enough coins" };
  }

  const success = await updateUserProgress({
    coins: progress.coins - price,
    hearts: progress.hearts + amount,
  });

  if (success) {
    // Phase 3: Invalidate user progress cache
    if (userId) {
      revalidateTag(`user-progress:${userId}`);
      if (progress.activeCourseId) {
        revalidateTag(`course-progress:${userId}:${progress.activeCourseId}`);
      }
    }
    return {
      success: true,
      data: {
        coins: progress.coins - price,
        hearts: progress.hearts + amount,
      },
    };
  }

  return { success: false, error: "Failed to purchase hearts" };
};

export const spinWheelAction = async () => {
  const { userId } = await auth();
  const progress = await getUserProgress();

  if (!progress) {
    return { success: false, error: "User progress not found" };
  }

  if (progress.coins < 10) {
    return { success: false, error: "Not enough coins" };
  }

  // Deduct coins first
  const deductSuccess = await updateUserProgress({
    coins: progress.coins - 10,
  });

  if (!deductSuccess) {
    return { success: false, error: "Failed to deduct coins" };
  }

  const prizes = [
    { name: "10 Coins", value: 10, type: "coins" },
    { name: "1 Heart", value: 1, type: "hearts" },
    { name: "2 Hearts", value: 2, type: "hearts" },
    { name: "Premium Avatar", value: 0, type: "avatar" },
    { name: "Lesson Skip", value: 1, type: "skip" },
    { name: "XP Boost", value: 1, type: "boost" },
  ];

  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  if (prize.type === "coins") {
    await updateUserProgress({
      coins: progress.coins - 10 + prize.value,
    });
  } else if (prize.type === "hearts") {
    await updateUserProgress({
      hearts: progress.hearts + prize.value,
    });
  }

  // Phase 3: Invalidate user progress cache
  if (userId) {
    revalidateTag(`user-progress:${userId}`);
    if (progress.activeCourseId) {
      revalidateTag(`course-progress:${userId}:${progress.activeCourseId}`);
    }
  }

  return {
    success: true,
    data: {
      prize: prize.name,
      type: prize.type,
      value: prize.value,
      currentCoins:
        progress.coins - 10 + (prize.type === "coins" ? prize.value : 0),
      currentHearts:
        progress.hearts + (prize.type === "hearts" ? prize.value : 0),
    },
  };
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
