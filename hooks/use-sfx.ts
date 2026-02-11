"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSfxStore } from "@/store/use-sfx";

/**
 * Sound Manager Module
 *
 * Singleton audio instances created once and reused.
 * Primed after first user gesture to comply with autoplay restrictions.
 */

// Audio instances (created once, reused forever)
const audioInstances: {
  transition: HTMLAudioElement | null;
  success: HTMLAudioElement | null;
  fail: HTMLAudioElement | null;
  endLesson: HTMLAudioElement | null;
  endCourse: HTMLAudioElement | null;
} = {
  transition: null,
  success: null,
  fail: null,
  endLesson: null,
  endCourse: null,
};

// Priming state
let isPrimed = false;
let isPriming = false;

// Throttle timestamps for spam protection
let lastTransitionTime = 0;
const TRANSITION_THROTTLE_MS = 150;

/**
 * Prime audio after first user gesture
 * Creates and preloads all audio instances
 */
function primeAudio() {
  if (isPrimed || isPriming) return;
  isPriming = true;

  try {
    // Create audio instances
    audioInstances.transition = new Audio("/sfx/transition.mp3");
    audioInstances.success = new Audio("/sfx/success.mp3");
    audioInstances.fail = new Audio("/sfx/fail.mp3");
    audioInstances.endLesson = new Audio("/sfx/end-lesson.mp3");
    audioInstances.endCourse = new Audio("/sfx/end-course.mp3");

    // Preload all audio files
    Object.values(audioInstances).forEach((audio) => {
      if (audio) {
        audio.preload = "auto";
        audio.load();
      }
    });

    isPrimed = true;
    console.log("[SFX] Audio primed and ready");
  } catch (error) {
    console.error("[SFX] Failed to prime audio:", error);
    isPriming = false;
  }
}

/**
 * Play audio with restart behavior (no overlap)
 */
function playAudio(audio: HTMLAudioElement | null, muted: boolean) {
  if (!audio || muted || !isPrimed) return;

  try {
    // Restart from beginning (no overlap)
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn("[SFX] Play failed:", error);
    });
  } catch (error) {
    console.error("[SFX] Error playing audio:", error);
  }
}

/**
 * Play audio with throttle (for transition sound)
 */
function playAudioThrottled(
  audio: HTMLAudioElement | null,
  muted: boolean,
  throttleMs: number,
  lastPlayTime: number,
): number {
  const now = Date.now();
  if (now - lastPlayTime < throttleMs) {
    return lastPlayTime; // Still throttled
  }

  playAudio(audio, muted);
  return now; // Update last play time
}

/**
 * useSfx Hook
 *
 * Provides instant sound feedback methods with zero perceived latency.
 *
 * Features:
 * - Primes audio after first user gesture (mobile autoplay compliance)
 * - Reuses audio instances (no recreation on render)
 * - Spam protection (throttling + restart behavior)
 * - Respects global mute state
 *
 * @example
 * ```tsx
 * const sfx = useSfx();
 *
 * <button onClick={() => sfx.playSuccess()}>
 *   Submit Answer
 * </button>
 * ```
 */
export function useSfx() {
  const { muted } = useSfxStore();
  const primedRef = useRef(false);

  // Prime audio on first user gesture
  useEffect(() => {
    if (primedRef.current) return;

    const handleFirstInteraction = () => {
      primeAudio();
      primedRef.current = true;

      // Remove listeners after first interaction
      document.removeEventListener("pointerdown", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };

    // Listen for first user gesture (use pointerdown for fastest response)
    document.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  // Sound playback methods
  const playTransition = useCallback(() => {
    lastTransitionTime = playAudioThrottled(
      audioInstances.transition,
      muted,
      TRANSITION_THROTTLE_MS,
      lastTransitionTime,
    );
  }, [muted]);

  const playSuccess = useCallback(() => {
    playAudio(audioInstances.success, muted);
  }, [muted]);

  const playFail = useCallback(() => {
    playAudio(audioInstances.fail, muted);
  }, [muted]);

  const playEndLesson = useCallback(() => {
    playAudio(audioInstances.endLesson, muted);
  }, [muted]);

  const playEndCourse = useCallback(() => {
    playAudio(audioInstances.endCourse, muted);
  }, [muted]);

  return {
    playTransition,
    playSuccess,
    playFail,
    playEndLesson,
    playEndCourse,
    isPrimed: () => isPrimed,
  };
}
