"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Map of challenge types to their dynamic import functions
const HEAVY_CHALLENGE_PRELOADERS = {
  VIDEO: () => import("./video-challenge"),
  PDF: () => import("./pdf-challenge"),
  CODE: () => import("./code-challenge"),
  WEBVIEW: () => import("./web-view"),
  AUDIO: () => import("./audio-challenge"),
  PROJECT: () => import("./projectv3-challenge"),
};

type ChallengeType = keyof typeof HEAVY_CHALLENGE_PRELOADERS | "SELECT" | "ASSIST" | "IMAGE" | "COMPLETE" | "WRITE" | "TEXT";

interface Challenge {
  id: number;
  type: ChallengeType;
  order: number;
}

interface UseChallengePreloadOptions {
  challenges: Challenge[];
  activeIndex: number;
  lessonId: number;
  onLastChallenge?: boolean;
}

/**
 * Hook to aggressively prefetch next challenges and preload heavy components
 * 
 * Strategy:
 * 1. When user is on challenge N, prefetch N+1 and N+2
 * 2. If N+1 is a heavy type (PDF, Video, Code), preload the component immediately
 * 3. When user is on last challenge, prefetch next lesson route
 * 4. Prefetch data-level routes using router.prefetch()
 */
export const useChallengePrefetch = ({
  challenges,
  activeIndex,
  lessonId,
  onLastChallenge = false,
}: UseChallengePreloadOptions) => {
  const router = useRouter();
  const preloadedComponents = useRef(new Set<string>());

  useEffect(() => {
    // Strategy 1: Prefetch next 2 challenges' components
    const nextChallenge = challenges[activeIndex + 1];
    const nextNextChallenge = challenges[activeIndex + 2];

    // Preload N+1 component if it's heavy
    if (nextChallenge && nextChallenge.type in HEAVY_CHALLENGE_PRELOADERS) {
      const componentKey = `${nextChallenge.type}-${nextChallenge.id}`;

      if (!preloadedComponents.current.has(componentKey)) {
        const preloader = HEAVY_CHALLENGE_PRELOADERS[nextChallenge.type as keyof typeof HEAVY_CHALLENGE_PRELOADERS];

        // Preload immediately (high priority)
        preloader().then(() => {
          preloadedComponents.current.add(componentKey);
          console.log(`[Prefetch] Preloaded ${nextChallenge.type} component for challenge ${nextChallenge.id}`);
        });
      }
    }

    // Preload N+2 component if it's heavy (lower priority, delayed)
    if (nextNextChallenge && nextNextChallenge.type in HEAVY_CHALLENGE_PRELOADERS) {
      const componentKey = `${nextNextChallenge.type}-${nextNextChallenge.id}`;

      if (!preloadedComponents.current.has(componentKey)) {
        const preloader = HEAVY_CHALLENGE_PRELOADERS[nextNextChallenge.type as keyof typeof HEAVY_CHALLENGE_PRELOADERS];

        // Delay preload to avoid blocking N+1
        setTimeout(() => {
          preloader().then(() => {
            preloadedComponents.current.add(componentKey);
            console.log(`[Prefetch] Preloaded ${nextNextChallenge.type} component for challenge ${nextNextChallenge.id}`);
          });
        }, 500);
      }
    }

    // Strategy 2: Prefetch /learn route when on last challenge
    const isLastChallenge = activeIndex === challenges.length - 1;
    if (isLastChallenge || onLastChallenge) {
      router.prefetch('/learn');
      console.log('[Prefetch] Prefetched /learn route (lesson completion)');
    }

    // Strategy 3: Prefetch next lesson route when on second-to-last challenge
    const isSecondToLast = activeIndex === challenges.length - 2;
    if (isSecondToLast) {
      // Prefetch the next lesson in the sequence
      // This assumes lessons are sequential; adjust if needed
      router.prefetch(`/lesson/${lessonId + 1}`);
      console.log(`[Prefetch] Prefetched next lesson route: /lesson/${lessonId + 1}`);
    }

  }, [activeIndex, challenges, lessonId, onLastChallenge, router]);
};
