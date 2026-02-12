"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStreakState, claimDailyStreakReward } from "@/actions/streak";
import type { StreakState } from "@/lib/streak";
import { toast } from "sonner";
import { useSfx } from "@/hooks/use-sfx";

export const StreakWidget = () => {
  const [streakState, setStreakState] = useState<StreakState | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const sfx = useSfx();

  useEffect(() => {
    loadStreakState();
  }, []);

  const loadStreakState = async () => {
    try {
      const state = await getStreakState();
      setStreakState(state);
    } catch (error) {
      console.error("Failed to load streak state:", error);
    }
  };

  const handleClaimReward = async () => {
    if (!streakState || !streakState.canClaimToday || isClaiming) return;

    setIsClaiming(true);

    try {
      const result = await claimDailyStreakReward();

      // Play success sound
      sfx.playSuccess();

      // Show reward animation
      setRewardAmount(result.coinsGained);
      setShowReward(true);

      // Update streak state
      await loadStreakState();

      // Hide reward animation after 2 seconds
      setTimeout(() => setShowReward(false), 2000);

      toast.success(`Claimed ${result.coinsGained} coins! 🎉`);
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast.error(error instanceof Error ? error.message : "Failed to claim reward");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!streakState) {
    return null;
  }

  const getStatusMessage = () => {
    if (streakState.canClaimToday) {
      return "Claim your daily reward!";
    }
    if (streakState.lastActiveDate === streakState.todayKey) {
      return "Streak secured today! 🔥";
    }
    if (streakState.isAtRisk) {
      return "Learn today to keep your streak";
    }
    return "Start learning to build your streak";
  };

  const getStatusColor = () => {
    if (streakState.canClaimToday) return "text-green-600";
    if (streakState.lastActiveDate === streakState.todayKey) return "text-blue-600";
    if (streakState.isAtRisk) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Streak Display */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={
                streakState.lastActiveDate === streakState.todayKey
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {streakState.currentStreak}
                </div>
                <div className="text-xs text-gray-500">day streak</div>
              </div>
            </motion.div>

            {/* Best Streak */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-white rounded-lg border border-gray-200">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">
                {streakState.bestStreak}
              </span>
              <span className="text-xs text-gray-500">best</span>
            </div>

            {/* Freeze Tokens */}
            {streakState.freezes > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-700">
                  {streakState.freezes}
                </span>
                <span className="text-xs text-blue-600">freeze</span>
              </div>
            )}
          </div>

          {/* Status & Claim Button */}
          <div className="flex flex-col items-end gap-2">
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>

            {streakState.canClaimToday && (
              <Button
                onClick={handleClaimReward}
                disabled={isClaiming}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-md"
              >
                {isClaiming ? (
                  "Claiming..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Claim Reward
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Reward Animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -50 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 rounded-full px-4 py-2 shadow-lg">
              <Sparkles className="w-5 h-5 text-yellow-600" fill="currentColor" />
              <span className="text-xl font-bold text-yellow-700">
                +{rewardAmount} coins
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
