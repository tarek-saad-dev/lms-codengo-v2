"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles, Heart, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Props = {
  heartsGained: number;
  xpEarned: number;
  lessonProgress: number; // 0-100
  onContinue: () => void;
  onReview?: () => void;
};

const motivationalMessages = [
  "You're making great progress in understanding this lesson! 🚀",
  "Your understanding of this topic just improved! ⭐",
  "Step by step, you're mastering this lesson! 💪",
  "Amazing work! Keep up the momentum! 🎯",
  "You're on fire! Your skills are growing! 🔥",
  "Fantastic progress! You're becoming an expert! 🌟",
];

export const LessonCelebration = ({
  heartsGained,
  xpEarned,
  lessonProgress,
  onContinue,
  onReview,
}: Props) => {
  const [showContent, setShowContent] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [message] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    // Delay content appearance for celebration effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Animate progress bar
    if (showContent) {
      const timer = setTimeout(() => {
        setAnimatedProgress(lessonProgress);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showContent, lessonProgress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 opacity-50" />
        
        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
        <div className="absolute top-8 left-6">
          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse delay-100" />
        </div>

        {/* Content */}
        <div className="relative p-8 flex flex-col items-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse" />
              <Image
                src="/finish.svg"
                alt="Success"
                width={80}
                height={80}
                className="relative"
              />
            </div>
          </motion.div>

          {/* Title */}
          <AnimatePresence>
            {showContent && (
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl lg:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
              >
                🎉 Lesson Completed!
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Motivational Message */}
          <AnimatePresence>
            {showContent && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-600 text-center mb-6"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Rewards Grid */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full grid grid-cols-2 gap-4 mb-6"
              >
                {/* Hearts Gained */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-4 border-2 border-rose-200 shadow-sm"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">
                      +{heartsGained}
                    </div>
                    <div className="text-xs text-rose-700 font-medium">
                      Hearts Gained
                    </div>
                  </div>
                </motion.div>

                {/* XP Earned */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-4 border-2 border-orange-200 shadow-sm"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-orange-500 fill-orange-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      +{xpEarned}
                    </div>
                    <div className="text-xs text-orange-700 font-medium">
                      XP Earned
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Section */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-100 mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Lesson Mastery
                  </span>
                </div>
                
                <Progress 
                  value={animatedProgress} 
                  className="h-3 mb-2"
                />
                
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(animatedProgress)}%
                  </span>
                  <span className="text-xs text-blue-700 ml-1">
                    Complete
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="w-full flex flex-col gap-3"
              >
                <Button
                  onClick={onContinue}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-lg"
                >
                  Continue Learning →
                </Button>
                
                {onReview && (
                  <Button
                    onClick={onReview}
                    variant="ghost"
                    size="lg"
                    className="w-full text-gray-600 hover:text-gray-900"
                  >
                    Review Lesson
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
