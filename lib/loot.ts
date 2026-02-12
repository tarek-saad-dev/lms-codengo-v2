"use server";

import { MAX_HEARTS } from "@/constants";

export type BoxType = "DAILY" | "BRONZE" | "SILVER" | "GOLD" | "UNIT" | "COURSE" | "STREAK";

export type BoxReward = {
  coins: number;
  xp: number;
  hearts: number;
};

export type DropTableEntry = {
  weight: number;
  coinsMin: number;
  coinsMax: number;
  xpMin: number;
  xpMax: number;
  hearts: number;
};

export const LOOT_RULE_VERSION = "v1";

/**
 * Drop Tables for Each Box Type
 * 
 * Each entry has:
 * - weight: probability weight (higher = more likely)
 * - coinsMin/Max: coin range
 * - xpMin/Max: XP range
 * - hearts: bonus hearts (0 = none)
 */
export const DROP_TABLES: Record<BoxType, DropTableEntry[]> = {
  DAILY: [
    // 70% chance: 15-30 coins
    { weight: 70, coinsMin: 15, coinsMax: 30, xpMin: 0, xpMax: 0, hearts: 0 },
    // 25% chance: 35-60 coins
    { weight: 25, coinsMin: 35, coinsMax: 60, xpMin: 0, xpMax: 0, hearts: 0 },
    // 5% chance: 10 coins + 1 heart
    { weight: 5, coinsMin: 10, coinsMax: 10, xpMin: 0, xpMax: 0, hearts: 1 },
  ],
  
  BRONZE: [
    // 100% chance: 20-50 coins + 10-25 XP
    { weight: 100, coinsMin: 20, coinsMax: 50, xpMin: 10, xpMax: 25, hearts: 0 },
  ],
  
  SILVER: [
    // 90% chance: 50-120 coins + 25-60 XP
    { weight: 90, coinsMin: 50, coinsMax: 120, xpMin: 25, xpMax: 60, hearts: 0 },
    // 10% chance: 50-80 coins + 25-40 XP + 1 heart
    { weight: 10, coinsMin: 50, coinsMax: 80, xpMin: 25, xpMax: 40, hearts: 1 },
  ],
  
  GOLD: [
    // 80% chance: 150-300 coins + 80-150 XP
    { weight: 80, coinsMin: 150, coinsMax: 300, xpMin: 80, xpMax: 150, hearts: 0 },
    // 20% chance: 150-250 coins + 80-120 XP + 2 hearts
    { weight: 20, coinsMin: 150, coinsMax: 250, xpMin: 80, xpMax: 120, hearts: 2 },
  ],
  
  UNIT: [
    // Same as SILVER
    { weight: 90, coinsMin: 50, coinsMax: 120, xpMin: 25, xpMax: 60, hearts: 0 },
    { weight: 10, coinsMin: 50, coinsMax: 80, xpMin: 25, xpMax: 40, hearts: 1 },
  ],
  
  COURSE: [
    // Same as GOLD
    { weight: 80, coinsMin: 150, coinsMax: 300, xpMin: 80, xpMax: 150, hearts: 0 },
    { weight: 20, coinsMin: 150, coinsMax: 250, xpMin: 80, xpMax: 120, hearts: 2 },
  ],
  
  STREAK: [
    // Same as SILVER
    { weight: 90, coinsMin: 50, coinsMax: 120, xpMin: 25, xpMax: 60, hearts: 0 },
    { weight: 10, coinsMin: 50, coinsMax: 80, xpMin: 25, xpMax: 40, hearts: 1 },
  ],
};

/**
 * Random number generator with seed support
 * Uses simple LCG (Linear Congruential Generator)
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  let state = Math.abs(hash);
  
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Select a drop table entry based on weights
 */
function selectDropEntry(entries: DropTableEntry[], rng: () => number): DropTableEntry {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let random = rng() * totalWeight;
  
  for (const entry of entries) {
    random -= entry.weight;
    if (random <= 0) {
      return entry;
    }
  }
  
  // Fallback to first entry
  return entries[0];
}

/**
 * Generate rewards for a box
 * 
 * Uses deterministic RNG based on seed for reproducibility.
 * Seed format: `${userId}:${boxId}:${ruleVersion}`
 * 
 * Returns clamped rewards (hearts capped by MAX_HEARTS).
 */
export function generateBoxReward(
  boxType: BoxType,
  seed: string,
  currentHearts: number
): BoxReward {
  const dropTable = DROP_TABLES[boxType];
  const rng = seededRandom(seed);
  
  // Select drop entry based on weights
  const entry = selectDropEntry(dropTable, rng);
  
  // Generate random values within ranges
  const coins = randomInt(entry.coinsMin, entry.coinsMax, rng);
  const xp = randomInt(entry.xpMin, entry.xpMax, rng);
  
  // Clamp hearts by MAX_HEARTS
  const heartsAfter = Math.min(currentHearts + entry.hearts, MAX_HEARTS);
  const hearts = heartsAfter - currentHearts;
  
  return {
    coins: Math.max(0, coins), // Never negative
    xp: Math.max(0, xp),
    hearts: Math.max(0, hearts),
  };
}

/**
 * Get box display name
 */
export function getBoxDisplayName(boxType: BoxType): string {
  const names: Record<BoxType, string> = {
    DAILY: "Daily Chest",
    BRONZE: "Bronze Box",
    SILVER: "Silver Box",
    GOLD: "Gold Box",
    UNIT: "Unit Completion Box",
    COURSE: "Course Completion Box",
    STREAK: "Streak Milestone Box",
  };
  
  return names[boxType];
}

/**
 * Get box description
 */
export function getBoxDescription(boxType: BoxType): string {
  const descriptions: Record<BoxType, string> = {
    DAILY: "Your daily reward! Open once per day.",
    BRONZE: "A small reward to boost your progress.",
    SILVER: "A valuable reward with great prizes!",
    GOLD: "An amazing reward with incredible prizes!",
    UNIT: "Congratulations on completing the unit!",
    COURSE: "Amazing! You completed the entire course!",
    STREAK: "Keep up your learning streak!",
  };
  
  return descriptions[boxType];
}

/**
 * Get box rarity color
 */
export function getBoxColor(boxType: BoxType): string {
  const colors: Record<BoxType, string> = {
    DAILY: "from-blue-500 to-cyan-500",
    BRONZE: "from-orange-600 to-amber-700",
    SILVER: "from-gray-400 to-slate-500",
    GOLD: "from-yellow-400 to-amber-500",
    UNIT: "from-purple-500 to-indigo-500",
    COURSE: "from-pink-500 to-rose-500",
    STREAK: "from-orange-500 to-red-500",
  };
  
  return colors[boxType];
}
