"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { challengeProgress, userProgress } from "@/db/schema";
import { redirect } from "next/navigation";
import { getCourseById, getUserProgress } from "@/db/queries";
import { revalidatePath, revalidateTag } from "next/cache";
import db from "@/db/drizzle";
import { grantReward } from "@/lib/economy";

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

  // Phase 3: Use revalidateTag for granular cache invalidation
  revalidateTag(`user-progress:${userId}`);
  revalidateTag(`course-progress:${userId}:${courseId}`);
  redirect("/learn");
};

export const reduceHearts = async (challengeId: number, lessonId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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

  if (isPractice) {
    return { error: "practice" };
  }

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  if (currentUserProgress.hearts === 0) {
    return { error: "hearts" };
  }

  await grantReward(userId, { hearts: -1 }, "CHALLENGE_FAIL", {
    challengeId,
    lessonId,
    idempotencyKey: `challenge:${challengeId}:fail:${userId}:${Date.now()}`,
  });

  revalidateTag(`user-progress:${userId}`);
  revalidateTag(
    `course-progress:${userId}:${currentUserProgress.activeCourseId}`,
  );
  revalidateTag(`lesson:${lessonId}`);
  return { success: true };
};
