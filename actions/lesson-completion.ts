"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { eq, and, desc } from "drizzle-orm";
import { userMilestones } from "@/db/schema";
import { getLessonCompletionState } from "@/lib/completion-state";
import { grantReward } from "@/lib/economy";
import { updateStreakOnLearning } from "@/lib/streak";
import { awardMilestoneBox } from "@/actions/boxes";
import { updateQuestProgress } from "@/lib/quests";
import { revalidatePath } from "next/cache";

export type CompletionResult = {
  completionType: "LESSON" | "UNIT" | "COURSE";
  xpGained: number;
  coinsGained: number;
  heartsGained: number;
  nextLessonId: number | null;
  nextUnitId: number | null;
  courseId: number;
  unitId: number;
  lessonId: number;
  unitTitle: string;
  courseTitle: string;
};

/**
 * completeLesson
 *
 * Single entry point for lesson completion.
 *
 * What it does:
 * 1. Verify all challenges in lesson are completed
 * 2. Compute completion state (LESSON/UNIT/COURSE)
 * 3. Grant rewards via Economy Service (idempotent)
 * 4. Save milestone to user_milestones table
 * 5. Return completion data for UI
 *
 * Idempotency:
 * - Uses idempotencyKey: `completeLesson:${lessonId}:${userId}`
 * - If called twice, returns existing milestone data
 * - No double rewards granted
 *
 * Rewards:
 * - LESSON: +10 XP
 * - UNIT: +10 XP + 5 coins (bonus)
 * - COURSE: +10 XP + 20 coins (bigger bonus)
 */
export async function completeLesson(
  courseId: number,
  lessonId: number,
): Promise<CompletionResult> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if milestone already exists (idempotency)
  const existingMilestone = await db.query.userMilestones.findFirst({
    where: and(
      eq(userMilestones.userId, userId),
      eq(userMilestones.lessonId, lessonId),
    ),
    orderBy: [desc(userMilestones.createdAt)],
  });

  if (existingMilestone) {
    // Already completed - return existing data
    const completionState = await getLessonCompletionState(
      userId,
      courseId,
      lessonId,
    );

    return {
      completionType: existingMilestone.completionType,
      xpGained: existingMilestone.xpGained,
      coinsGained: existingMilestone.coinsGained,
      heartsGained: existingMilestone.heartsGained,
      nextLessonId: completionState.nextLessonId,
      nextUnitId: completionState.nextUnitId,
      courseId: completionState.courseId,
      unitId: completionState.unitId,
      lessonId,
      unitTitle: completionState.unitTitle,
      courseTitle: completionState.courseTitle,
    };
  }

  // Get completion state
  const completionState = await getLessonCompletionState(
    userId,
    courseId,
    lessonId,
  );

  // Determine completion type and rewards
  let completionType: "LESSON" | "UNIT" | "COURSE";
  const xpGained = 10; // Base XP for lesson
  let coinsGained = 0;
  const heartsGained = 0;

  if (completionState.isLastLessonInCourse) {
    completionType = "COURSE";
    coinsGained = 20; // Bigger bonus for course completion
  } else if (completionState.isLastLessonInUnit) {
    completionType = "UNIT";
    coinsGained = 5; // Small bonus for unit completion
  } else {
    completionType = "LESSON";
  }

  // Grant rewards via Economy Service (idempotent)
  const idempotencyKey = `completeLesson:${lessonId}:${userId}`;

  await grantReward(
    userId,
    {
      xp: xpGained,
      coins: coinsGained,
      hearts: heartsGained,
    },
    "LESSON_COMPLETE",
    {
      lessonId,
      courseId,
      unitId: completionState.unitId,
      idempotencyKey,
    },
  );

  // Save milestone
  await db.insert(userMilestones).values({
    userId,
    courseId: completionState.courseId,
    unitId: completionState.unitId,
    lessonId,
    completionType,
    xpGained,
    coinsGained,
    heartsGained,
  });

  // Update user's daily streak (Phase U3)
  await updateStreakOnLearning(userId);

  // Update quest progress (Phase U5)
  await updateQuestProgress(userId, "COMPLETE_LESSONS", 1);

  // Award milestone boxes (Phase U4)
  if (completionType === "UNIT") {
    await awardMilestoneBox(userId, "UNIT", "UNIT_COMPLETE", {
      unitId: completionState.unitId,
      courseId: completionState.courseId,
      idempotencyKey: `box:unit:${completionState.unitId}`,
    });
  } else if (completionType === "COURSE") {
    await awardMilestoneBox(userId, "COURSE", "COURSE_COMPLETE", {
      courseId: completionState.courseId,
      idempotencyKey: `box:course:${completionState.courseId}`,
    });
  }

  // Revalidate /learn page (not current lesson page to avoid remount)
  revalidatePath("/learn");

  return {
    completionType,
    xpGained,
    coinsGained,
    heartsGained,
    nextLessonId: completionState.nextLessonId,
    nextUnitId: completionState.nextUnitId,
    courseId: completionState.courseId,
    unitId: completionState.unitId,
    lessonId,
    unitTitle: completionState.unitTitle,
    courseTitle: completionState.courseTitle,
  };
}

/**
 * getLatestMilestone
 *
 * Get the most recent completion milestone for a user.
 * Used to restore end screen state after refresh.
 */
export async function getLatestMilestone(userId: string) {
  const milestone = await db.query.userMilestones.findFirst({
    where: eq(userMilestones.userId, userId),
    orderBy: [desc(userMilestones.createdAt)],
    with: {
      lesson: true,
      unit: true,
      course: true,
    },
  });

  return milestone;
}
