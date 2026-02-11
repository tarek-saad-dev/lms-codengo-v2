"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { challengeProgress, userProgress } from "@/db/schema";
import { redirect } from "next/navigation";
import { getCourseById, getUserProgress } from "@/db/queries";
import { revalidatePath } from "next/cache";
import db from "@/db/drizzle";
import {
  GAMIFICATION_RULES,
  EconomyChangeReason,
} from "@/lib/gamification-constants";

export const setActiveCourse = async (courseId: number) => {
  const { userId } = await auth();
  const User = await currentUser();

  if (!userId || !User) {
    throw new Error("User not found");
  }

  const course = await getCourseById(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  // if(!course.units.length || !course.units[0].lessons.length) {
  //     throw new Error("Course is empty");
  // };

  const existingProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (existingProgress) {
    await db
      .update(userProgress)
      .set({
        activeCourseId: courseId,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
  } else {
    await db.insert(userProgress).values({
      userId: userId,
      userName: User.firstName! || "User",
      userImageSrc: User.imageUrl || "/mascot.svg",
      activeCourseId: courseId,
    });
  }

  revalidatePath("/courses");
  revalidatePath("/learn");
  redirect("/learn");
};

export const reduceHearts = async (challengeId: number, lessonId: number) => {
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

  const isPractice = !!existingChallengeProgress;

  // TEMP LOG: Track practice mode
  console.log(
    `[HEARTS] reduceHearts called - userId: ${userId}, challengeId: ${challengeId}, isPractice: ${isPractice}`,
  );

  if (isPractice) {
    console.log(`[HEARTS] Practice mode - no hearts reduced`);
    return { error: "practice" };
  }

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const heartsBefore = currentUserProgress.hearts;

  if (heartsBefore === 0) {
    console.log(`[HEARTS] Already at 0 hearts - blocking`);
    return { error: "hearts" };
  }

  // Atomic update with clamping to prevent negative hearts
  const heartsAfter = Math.max(heartsBefore - 1, GAMIFICATION_RULES.HEARTS.MIN);

  await db
    .update(userProgress)
    .set({
      hearts: heartsAfter,
    })
    .where(eq(userProgress.userId, userId));

  // TEMP LOG: Track hearts change
  console.log(
    `[HEARTS] ${EconomyChangeReason.WRONG_ANSWER} - userId: ${userId}, before: ${heartsBefore}, after: ${heartsAfter}`,
  );

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
  return { success: true };
};
