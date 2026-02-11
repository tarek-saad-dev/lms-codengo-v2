"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseNextLessonPrefetchOptions {
  currentLessonId: number;
  activeIndex: number;
  totalChallenges: number;
  triggerThreshold?: number; // When to start prefetching (e.g., 2 challenges before end)
}

/**
 * Hook to prefetch next lesson data when user is near the end of current lesson
 * 
 * Strategy:
 * 1. When user reaches second-to-last challenge, prefetch next lesson route
 * 2. This triggers Next.js to prefetch the page data (Server Component)
 * 3. When user completes lesson, navigation is instant
 */
export const useNextLessonPrefetch = ({
  currentLessonId,
  activeIndex,
  totalChallenges,
  triggerThreshold = 2,
}: UseNextLessonPrefetchOptions) => {
  const router = useRouter();

  useEffect(() => {
    // Calculate how many challenges are left
    const challengesRemaining = totalChallenges - activeIndex - 1;

    // Trigger prefetch when within threshold
    if (challengesRemaining <= triggerThreshold && challengesRemaining > 0) {
      // Prefetch next lesson route (this prefetches the Server Component data)
      const nextLessonId = currentLessonId + 1;
      router.prefetch(`/lesson/${nextLessonId}`);
      
      console.log(`[Next Lesson Prefetch] Prefetching lesson ${nextLessonId} (${challengesRemaining} challenges remaining)`);
    }

    // Also prefetch /learn route when on last challenge
    if (challengesRemaining === 0) {
      router.prefetch('/learn');
      console.log('[Next Lesson Prefetch] Prefetching /learn route (lesson completion)');
    }

  }, [activeIndex, totalChallenges, currentLessonId, triggerThreshold, router]);
};
