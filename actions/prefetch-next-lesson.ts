"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { lessons, challengeProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Server action to prefetch next lesson data
 * This is called from the client to warm up the cache for the next lesson
 * Uses unstable_cache to cache lesson structure (stable content)
 */
export const prefetchNextLessonData = async (nextLessonId: number) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Use unstable_cache for lesson structure (stable content)
    const getLessonStructure = unstable_cache(
      async (lessonId: number) => {
        return await db.query.lessons.findFirst({
          where: eq(lessons.id, lessonId),
          with: {
            challenges: {
              orderBy: (challenges, { asc }) => [asc(challenges.order)],
              with: {
                quizOptions: {
                  orderBy: (quizOptions, { asc }) => [asc(quizOptions.id)],
                },
                wordOptions: {
                  orderBy: (wordOptions, { asc }) => [asc(wordOptions.order)],
                },
              },
            },
          },
        });
      },
      [`lesson-structure-${nextLessonId}`],
      {
        tags: [`lesson-${nextLessonId}`],
        revalidate: 3600, // 1 hour - lesson structure is stable
      },
    );

    // Prefetch lesson structure
    const lessonData = await getLessonStructure(nextLessonId);

    if (!lessonData) {
      return { error: "Lesson not found" };
    }

    // Also prefetch user's challenge progress for this lesson (user-specific, not cached)
    await db.query.challengeProgress.findMany({
      where: eq(challengeProgress.userId, userId),
    });

    return {
      success: true,
      lessonId: nextLessonId,
      challengeCount: lessonData.challenges?.length || 0,
      message: `Prefetched lesson ${nextLessonId} with ${lessonData.challenges?.length || 0} challenges`,
    };
  } catch (error) {
    console.error("[Prefetch Next Lesson] Error:", error);
    return { error: "Failed to prefetch lesson data" };
  }
};
