"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag } from "next/cache";

import db from "@/db/drizzle";
import { and, eq } from "drizzle-orm";
import { getUserProgress } from "@/db/queries";
import { challengeProgress } from "@/db/schema";
import { GAMIFICATION_RULES } from "@/lib/gamification-constants";
import { grantReward } from "@/lib/economy";

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
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await grantReward(
      userId,
      {
        hearts: GAMIFICATION_RULES.REWARDS.PRACTICE_HEART_BONUS,
        xp: GAMIFICATION_RULES.POINTS.PRACTICE_COMPLETION,
      },
      "PRACTICE",
      {
        challengeId,
        lessonId,
        idempotencyKey: `practice:${challengeId}:${userId}:${Date.now()}`,
      },
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

  await grantReward(
    userId,
    {
      hearts: shouldAddHeart
        ? GAMIFICATION_RULES.REWARDS.FIRST_COMPLETION_HEART_BONUS
        : 0,
      xp: GAMIFICATION_RULES.POINTS.CHALLENGE_COMPLETION,
    },
    "CHALLENGE_SUCCESS",
    {
      challengeId,
      lessonId,
      idempotencyKey: `challenge:${challengeId}:complete:${userId}`,
    },
  );

  revalidateTag(`user-progress:${userId}`);
  revalidateTag(
    `course-progress:${userId}:${currentUserProgress.activeCourseId}`,
  );
  revalidateTag(`lesson:${lessonId}`);
  revalidateTag("leaderboard");
};
