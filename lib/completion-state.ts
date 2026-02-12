"use server";

import db from "@/db/drizzle";
import { eq, and, gt } from "drizzle-orm";
import { lessons, units } from "@/db/schema";

export type LessonCompletionState = {
  isLessonComplete: boolean;
  isLastLessonInUnit: boolean;
  isLastLessonInCourse: boolean;
  nextLessonId: number | null;
  nextUnitId: number | null;
  unitId: number;
  courseId: number;
  unitTitle: string;
  courseTitle: string;
};

/**
 * getLessonCompletionState
 *
 * Server-authoritative function to determine what the user just completed.
 *
 * Returns:
 * - isLessonComplete: true if lesson has all challenges completed
 * - isLastLessonInUnit: true if no next lesson in current unit
 * - isLastLessonInCourse: true if no next lesson in entire course
 * - nextLessonId: ID of next lesson (null if course ended)
 * - nextUnitId: ID of next unit (null if course ended or staying in same unit)
 * - unitId: Current unit ID
 * - courseId: Current course ID
 *
 * Logic:
 * 1. Get current lesson with unit and course info
 * 2. Find next lesson in same unit (by order)
 * 3. If no next lesson in unit, find first lesson of next unit
 * 4. Determine completion type based on what's available
 */
export async function getLessonCompletionState(
  userId: string,
  courseId: number,
  lessonId: number,
): Promise<LessonCompletionState> {
  // Get current lesson with unit and course info
  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      unit: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!currentLesson || !currentLesson.unit) {
    throw new Error("Lesson or unit not found");
  }

  const unitId = currentLesson.unitId;
  const actualCourseId = currentLesson.unit.courseId;

  // Verify courseId matches
  if (actualCourseId !== courseId) {
    throw new Error("Course ID mismatch");
  }

  // Find next lesson in same unit (by order)
  const nextLessonInUnit = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.unitId, unitId),
      gt(lessons.order, currentLesson.order),
    ),
    orderBy: (lessons, { asc }) => [asc(lessons.order)],
  });

  // If there's a next lesson in the same unit
  if (nextLessonInUnit) {
    return {
      isLessonComplete: true,
      isLastLessonInUnit: false,
      isLastLessonInCourse: false,
      nextLessonId: nextLessonInUnit.id,
      nextUnitId: null, // Staying in same unit
      unitId,
      courseId: actualCourseId,
      unitTitle: currentLesson.unit.title,
      courseTitle: currentLesson.unit.course?.title || "",
    };
  }

  // No next lesson in current unit - check for next unit
  const nextUnit = await db.query.units.findFirst({
    where: and(
      eq(units.courseId, actualCourseId),
      gt(units.order, currentLesson.unit.order),
    ),
    orderBy: (units, { asc }) => [asc(units.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        limit: 1,
      },
    },
  });

  // If there's a next unit with lessons
  if (nextUnit && nextUnit.lessons.length > 0) {
    return {
      isLessonComplete: true,
      isLastLessonInUnit: true,
      isLastLessonInCourse: false,
      nextLessonId: nextUnit.lessons[0].id,
      nextUnitId: nextUnit.id,
      unitId,
      courseId: actualCourseId,
      unitTitle: currentLesson.unit.title,
      courseTitle: currentLesson.unit.course?.title || "",
    };
  }

  // No next unit - course is complete
  return {
    isLessonComplete: true,
    isLastLessonInUnit: true,
    isLastLessonInCourse: true,
    nextLessonId: null,
    nextUnitId: null,
    unitId,
    courseId: actualCourseId,
    unitTitle: currentLesson.unit.title,
    courseTitle: currentLesson.unit.course?.title || "",
  };
}
