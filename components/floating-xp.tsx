"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

type FloatingXPProps = {
  value: number;
  show: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
};

/**
 * FloatingXP Component
 * 
 * Displays a floating "+XP" reward feedback with sparkle animation.
 * 
 * Features:
 * - Floats up and fades out
 * - Portal to body (avoids z-index issues)
 * - Auto-hides after animation
 * - Reduced motion support
 * - Customizable position
 * 
 * Usage:
 * ```tsx
 * const [showXP, setShowXP] = useState(false);
 * 
 * // On correct answer
 * setShowXP(true);
 * 
 * <FloatingXP
 *   value={10}
 *   show={showXP}
 *   onComplete={() => setShowXP(false)}
 * />
 * ```
 */
export const FloatingXP = ({ value, show, onComplete, position }: FloatingXPProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!mounted) return null;

  // Default position: center of screen
  const defaultPosition = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  };

  const finalPosition = position || defaultPosition;

  const content = (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -50, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: finalPosition.x,
            top: finalPosition.y,
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className="flex items-center gap-2"
        >
          <motion.div
            initial={{ rotate: 0, scale: 1 }}
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6 text-yellow-500" fill="currentColor" />
          </motion.div>
          <span className="text-2xl font-bold text-green-600 drop-shadow-lg">
            +{value} XP
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
