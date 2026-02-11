"use client";

import { ReactNode } from "react";

type ChallengeType = "SELECT" | "ASSIST" | "COMPLETE" | "WRITE" | "TEXT" | "IMAGE" | "VIDEO" | "PDF" | "CODE" | "WEBVIEW" | "PROJECT" | "AUDIO";

type ChallengeMotionProps = {
  children: ReactNode;
  type: ChallengeType;
  challengeId: number;
};

/**
 * ChallengeMotion Component
 * 
 * PERFORMANCE FIX: Removed all animations between challenges for instant switching.
 * Now acts as a simple wrapper with no transitions.
 * 
 * Previous implementation caused slow navigation due to mount/unmount animations.
 * Challenge switching is now instant with no delays.
 * 
 * Usage:
 * ```tsx
 * <ChallengeMotion type={challenge.type} challengeId={challenge.id}>
 *   <YourChallengeComponent />
 * </ChallengeMotion>
 * ```
 */
export const ChallengeMotion = ({ children }: ChallengeMotionProps) => {
  // Simple wrapper with no animations - instant challenge switching
  return <>{children}</>;
};
