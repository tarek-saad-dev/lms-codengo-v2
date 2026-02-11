"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { and, eq } from "drizzle-orm";
import { getUserProgress } from "@/db/queries";
import { challengeProgress, userProgress } from "@/db/schema";
import {
  GAMIFICATION_RULES,
  EconomyChangeReason,
  clampHearts,
} from "@/lib/gamification-constants";

export const upsertChallengeProgress = async (
  challengeId: number,
  lessonId: number,
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Phase 2: Parallelize independent DB queries
  const [currentUserProgress, existingChallengeProgress] = await Promise.all([
    getUserProgress(),
    db.query.challengeProgress.findFirst({
      where: and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.challengeId, challengeId),
      ),
    }),
  ]);

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const isPractice = !!existingChallengeProgress;

  // TEMP LOG: Track completion attempt
  console.log(
    `[HEARTS] upsertChallengeProgress - userId: ${userId}, challengeId: ${challengeId}, isPractice: ${isPractice}, currentHearts: ${currentUserProgress.hearts}`,
  );

  if (currentUserProgress.hearts === 0 && !isPractice) {
    return { error: "hearts" };
  }

  if (isPractice) {
    // Remove duplicate update
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    const heartsBefore = currentUserProgress.hearts;
    const heartsAfter = clampHearts(
      heartsBefore + GAMIFICATION_RULES.REWARDS.PRACTICE_HEART_BONUS,
      false, // Use standard max (5)
    );

    await db
      .update(userProgress)
      .set({
        hearts: heartsAfter,
        points:
          currentUserProgress.points +
          GAMIFICATION_RULES.POINTS.PRACTICE_COMPLETION,
      })
      .where(eq(userProgress.userId, userId));

    // TEMP LOG: Track practice reward
    console.log(
      `[HEARTS] ${EconomyChangeReason.PRACTICE_REWARD} - userId: ${userId}, before: ${heartsBefore}, after: ${heartsAfter}, points: +${GAMIFICATION_RULES.POINTS.PRACTICE_COMPLETION}`,
    );

    revalidatePath("/learn");
    revalidatePath("/lesson");
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  const shouldAddHeart =
    Math.random() < GAMIFICATION_RULES.REWARDS.FIRST_COMPLETION_HEART_CHANCE;

  const heartsBefore = currentUserProgress.hearts;
  const updatedHearts = shouldAddHeart
    ? clampHearts(
        heartsBefore + GAMIFICATION_RULES.REWARDS.FIRST_COMPLETION_HEART_BONUS,
        true, // Use bonus max (8)
      )
    : heartsBefore;

  await db
    .update(userProgress)
    .set({
      points:
        currentUserProgress.points +
        GAMIFICATION_RULES.POINTS.CHALLENGE_COMPLETION,
      hearts: updatedHearts,
    })
    .where(eq(userProgress.userId, userId));

  // TEMP LOG: Track first completion
  console.log(
    `[HEARTS] ${EconomyChangeReason.FIRST_COMPLETION} - userId: ${userId}, before: ${heartsBefore}, after: ${updatedHearts}, heartBonus: ${shouldAddHeart}, points: +${GAMIFICATION_RULES.POINTS.CHALLENGE_COMPLETION}`,
  );

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath(`/lesson/${lessonId}`);
};
