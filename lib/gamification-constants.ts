/**
 * Centralized gamification rules and constants
 * All economy/hearts/rewards logic should reference these values
 */

export const GAMIFICATION_RULES = {
  // Hearts system
  HEARTS: {
    DEFAULT: 5,
    MAX_STANDARD: 5,
    MAX_WITH_BONUS: 8,
    MIN: 0,
  },

  // Points system
  POINTS: {
    CHALLENGE_COMPLETION: 10,
    PRACTICE_COMPLETION: 10,
  },

  // Rewards
  REWARDS: {
    PRACTICE_HEART_BONUS: 1,
    FIRST_COMPLETION_HEART_CHANCE: 0.4, // 40% chance
    FIRST_COMPLETION_HEART_BONUS: 1,
  },
} as const;

/**
 * Reasons for economy changes (for future analytics/logging)
 */
export enum EconomyChangeReason {
  WRONG_ANSWER = "WRONG_ANSWER",
  PRACTICE_REWARD = "PRACTICE_REWARD",
  FIRST_COMPLETION = "FIRST_COMPLETION",
  SHOP_PURCHASE = "SHOP_PURCHASE",
  SUBSCRIPTION_REFILL = "SUBSCRIPTION_REFILL",
}

/**
 * Helper to clamp hearts within valid range
 */
export function clampHearts(hearts: number, isPractice: boolean = false): number {
  const max = isPractice 
    ? GAMIFICATION_RULES.HEARTS.MAX_WITH_BONUS 
    : GAMIFICATION_RULES.HEARTS.MAX_STANDARD;
  return Math.max(
    GAMIFICATION_RULES.HEARTS.MIN,
    Math.min(hearts, max)
  );
}
