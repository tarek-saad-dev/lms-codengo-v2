"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  id: number;
  locked?: boolean;
  completed?: boolean;
}

export const useLessonPrefetch = (lessons: Lesson[]) => {
  const router = useRouter();

  useEffect(() => {
    // Prefetch the first 3 unlocked lessons immediately
    const unlocked = lessons.filter(l => !l.locked).slice(0, 3);
    
    unlocked.forEach(lesson => {
      const href = lesson.completed ? `/lesson/${lesson.id}` : "/lesson";
      router.prefetch(href);
    });

    // Prefetch remaining unlocked lessons after a short delay
    const timer = setTimeout(() => {
      const remaining = lessons.filter(l => !l.locked).slice(3);
      remaining.forEach(lesson => {
        const href = lesson.completed ? `/lesson/${lesson.id}` : "/lesson";
        router.prefetch(href);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [lessons, router]);
};
