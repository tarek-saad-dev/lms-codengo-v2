"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles, Heart, Star, TrendingUp, ArrowRight, BookOpen } from "lucide-react";
import { InstantButton } from "@/components/ui/instant-button";
import { Progress } from "@/components/ui/progress";
import { useSfx } from "@/hooks/use-sfx";
import { NextUpPreview } from "@/components/next-up-preview";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

type Props = {
  heartsGained: number;
  xpEarned: number;
  coinsEarned?: number;
  challengesCompleted: number;
  totalChallenges: number;
  lessonProgress: number; // 0-100
  onContinue: () => Promise<void>;
  onBackToLessons?: () => void;
  isNavigating?: boolean;
  nextLessonTitle?: string;
  nextLessonDuration?: string;
};

const motivationalMessages = [
  "You're making great progress! 🚀",
  "Your skills just leveled up! ⭐",
  "Step by step, you're mastering this! 💪",
  "Amazing work! Keep the momentum! 🎯",
  "You're on fire! 🔥",
  "Fantastic! You're becoming an expert! 🌟",
];

/**
 * LessonEndScreen Component
 * 
 * Displays a high-quality completion screen after finishing the last challenge in a lesson.
 * 
 * Trigger Condition:
 * - Shows ONLY when activeIndex >= challenges.length (no more challenges)
 * - AND lesson completion is confirmed (percentage === 100%)
 * 
 * Double Render Prevention:
 * - Uses useRef to track if screen has been shown
 * - Parent component should set a boolean flag (showLessonEndScreen) once
 * - This component handles its own internal animation states
 * - onContinue uses InstantButton with loading state to prevent double-clicks
 */
export const LessonEndScreen = ({
  heartsGained,
  xpEarned,
  coinsEarned,
  challengesCompleted,
  totalChallenges,
  lessonProgress,
  onContinue,
  onBackToLessons,
  isNavigating = false,
  nextLessonTitle,
  nextLessonDuration,
}: Props) => {
  const [showContent, setShowContent] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [message] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  // Prevent double render: track if component has been initialized
  const hasInitialized = useRef(false);

  // Phase 4: SFX - Play end lesson sound once
  const sfx = useSfx();
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Phase 4: Play end lesson sound once
    if (!hasPlayedSound.current) {
      sfx.playEndLesson();
      hasPlayedSound.current = true;
    }

    // Delay content appearance for celebration effect
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, [sfx]);

  useEffect(() => {
    // Animate progress bar
    if (showContent) {
      const timer = setTimeout(() => {
        setAnimatedProgress(lessonProgress);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showContent, lessonProgress]);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const animationDuration = prefersReducedMotion ? 0.1 : 0.4;

  // Phase 7: Confetti with reduced motion support
  const confettiPieces = prefersReducedMotion ? 50 : 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Phase 7: Confetti - reduced for accessibility */}
      {showContent && (
        <Confetti
          width={typeof window !== "undefined" ? window.innerWidth : 300}
          height={typeof window !== "undefined" ? window.innerHeight : 300}
          recycle={false}
          numberOfPieces={confettiPieces}
          gravity={0.3}
        />
      )}
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: animationDuration, ease: "easeOut" }}
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 opacity-50" />

        {/* Sparkle decorations */}
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-4 right-4">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute top-8 left-6">
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse delay-100" />
            </div>
          </>
        )}

        {/* Content */}
        <div className="relative p-6 sm:p-8 flex flex-col items-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: prefersReducedMotion ? 1 : 0, rotate: prefersReducedMotion ? 0 : -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: prefersReducedMotion ? 0.1 : 0.5, type: "spring" }}
            className="mb-6"
          >
            <div className="relative">
              {!prefersReducedMotion && (
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse" />
              )}
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
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: animationDuration }}
                className="text-2xl lg:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
              >
                Lesson Completed 🎉
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Motivational Message */}
          <AnimatePresence>
            {showContent && (
              <motion.p
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: animationDuration }}
                className="text-sm text-gray-600 text-center mb-6"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Challenges Completed Summary */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: animationDuration }}
                className="w-full bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-3 border-2 border-green-100 mb-4"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-green-900">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">
                    {challengesCompleted} of {totalChallenges} challenges completed
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rewards Grid */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: animationDuration }}
                className="w-full grid grid-cols-2 gap-3 mb-6"
              >
                {/* XP Earned */}
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      +{xpEarned}
                    </div>
                    <div className="text-xs text-orange-700 font-medium">
                      XP
                    </div>
                  </div>
                </motion.div>

                {/* Hearts Gained */}
                {heartsGained > 0 && (
                  <motion.div
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                    className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-3 sm:p-4 border-2 border-rose-200 shadow-sm"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-rose-600">
                        +{heartsGained}
                      </div>
                      <div className="text-xs text-rose-700 font-medium">
                        Hearts
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Coins Earned (optional) */}
                {coinsEarned !== undefined && coinsEarned > 0 && (
                  <motion.div
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                    className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl p-3 sm:p-4 border-2 border-yellow-200 shadow-sm"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                        +{coinsEarned}
                      </div>
                      <div className="text-xs text-yellow-700 font-medium">
                        Coins
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Section */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: animationDuration }}
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

          {/* Next Up Preview */}
          {nextLessonTitle && (
            <NextUpPreview
              title={nextLessonTitle}
              duration={nextLessonDuration}
              type="lesson"
            />
          )}

          {/* Action Buttons */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: animationDuration }}
                className="w-full flex flex-col gap-3"
              >
                {/* Primary CTA: Continue */}
                <InstantButton
                  onAsyncClick={onContinue}
                  size="lg"
                  disabled={isNavigating}
                  enableSound={true}
                  enableVibration={true}
                  minLoadingDuration={300}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </InstantButton>

                {/* Secondary CTA: Back to Lessons */}
                {onBackToLessons && (
                  <InstantButton
                    onClick={onBackToLessons}
                    variant="ghost"
                    size="lg"
                    disabled={isNavigating}
                    enableSound={false}
                    className="w-full text-gray-600 hover:text-gray-900"
                  >
                    Back to Lessons
                  </InstantButton>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
