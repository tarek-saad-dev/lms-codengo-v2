"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useMemo } from "react";

type ChallengeType = "SELECT" | "ASSIST" | "COMPLETE" | "WRITE" | "TEXT" | "IMAGE" | "VIDEO" | "PDF" | "CODE" | "WEBVIEW" | "PROJECT" | "AUDIO";

type ChallengeMotionProps = {
  children: ReactNode;
  type: ChallengeType;
  challengeId: number;
};

/**
 * ChallengeMotion Component
 * 
 * Provides unique signature animations for each challenge type.
 * 
 * Features:
 * - Type-based animation variants
 * - Reduced motion support (prefers-reduced-motion)
 * - GPU-accelerated (transforms + opacity only)
 * - No layout shift
 * - Short duration (200-500ms)
 * 
 * Usage:
 * ```tsx
 * <ChallengeMotion type={challenge.type} challengeId={challenge.id}>
 *   <YourChallengeComponent />
 * </ChallengeMotion>
 * ```
 */
export const ChallengeMotion = ({ children, type, challengeId }: ChallengeMotionProps) => {
  // Detect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Animation variants for each challenge type
  const animations = useMemo(() => {
    // Reduced motion: minimal fade only
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      };
    }

    // Full animations by type
    switch (type) {
      case "SELECT":
        // Slide up with fade (most common type)
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration: 0.3, ease: "easeOut" },
        };

      case "ASSIST":
        // Scale with fade (helpful/guided feeling)
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: { duration: 0.25, ease: "easeOut" },
        };

      case "COMPLETE":
      case "WRITE":
        // Slide from left (typing/writing motion)
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
          transition: { duration: 0.3, ease: "easeOut" },
        };

      case "TEXT":
        // Gentle fade (reading content)
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 },
        };

      case "IMAGE":
        // Zoom in slightly (visual content)
        return {
          initial: { opacity: 0, scale: 0.98 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.98 },
          transition: { duration: 0.35, ease: "easeOut" },
        };

      case "VIDEO":
      case "PDF":
      case "CODE":
      case "WEBVIEW":
        // Slide from right (media/interactive content)
        return {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
          transition: { duration: 0.3, ease: "easeOut" },
        };

      default:
        // Default: simple fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 },
        };
    }
  }, [type, prefersReducedMotion]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={challengeId}
        initial={animations.initial}
        animate={animations.animate}
        exit={animations.exit}
        transition={animations.transition}
        style={{
          // GPU acceleration
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
