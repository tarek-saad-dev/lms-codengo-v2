"use client";

import { lessons, units } from "@/db/schema";
import { UnitBanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";
import { useLessonPrefetch } from "./use-lesson-prefetch";

type Props = {
  id: number;
  order: number;
  title: string;
  description: string;
  lessons: (typeof lessons.$inferSelect & {
    completed: boolean;
  })[];
  activeLesson:
  | (typeof lessons.$inferSelect & {
    unit: typeof units.$inferSelect;
  })
  | undefined;
  activeLessonPercentage: number;
};

export const Unit = ({
  //   id,
  //   order,
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: Props) => {
  // Aggressive prefetching for all unlocked lessons
  const lessonsWithLockState = lessons.map((lesson) => {
    const isCurrent = lesson.id === activeLesson?.id;
    const isLocked = !lesson.completed && !isCurrent;
    return {
      id: lesson.id,
      locked: isLocked,
      completed: lesson.completed,
    };
  });

  useLessonPrefetch(lessonsWithLockState);

  return (
    <>
      <UnitBanner title={title} description={description} />
      <div className="flex items-center flex-col relative">
        {lessons.map((lesson, index) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = !lesson.completed && !isCurrent;
          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={index}
              totalCount={lessons.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={isCurrent ? activeLessonPercentage : 0}
              title={lesson.title}
            />
          );
        })}
      </div>

    </>
  );
};
