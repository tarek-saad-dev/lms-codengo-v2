"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

type NextUpPreviewProps = {
  title: string;
  duration?: string;
  type?: "lesson" | "course";
  icon?: React.ReactNode;
};

/**
 * NextUpPreview Component
 * 
 * Displays a preview of what's coming next after completing a lesson/course.
 * 
 * Features:
 * - Shows next lesson/course title
 * - Estimated duration
 * - Subtle animation
 * - Responsive design
 * 
 * Usage:
 * ```tsx
 * <NextUpPreview
 *   title="Variables & Data Types"
 *   duration="~2 min"
 *   type="lesson"
 * />
 * ```
 */
export const NextUpPreview = ({
  title,
  duration = "~2 min",
  type = "lesson",
  icon,
}: NextUpPreviewProps) => {
  const defaultIcon = type === "lesson" ? <BookOpen className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="w-full max-w-md mx-auto mt-6"
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {icon || defaultIcon}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Up Next
              </span>
              {duration && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{duration}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
          </div>
          
          <div className="flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
