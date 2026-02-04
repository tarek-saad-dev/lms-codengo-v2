import { cache } from "react";
import { auth } from "@clerk/nextjs/server";

import { challengeProgress, courses, lessons, units, userProgress } from "./schema";
import db from "./drizzle";

import { eq, or, and } from "drizzle-orm";

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getCourses = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    // If no user is logged in, only show global courses
    return await db.query.courses.findMany({
      where: eq(courses.type, "GLOBAL")
    });
  }

  // If user is logged in, show global courses and their custom courses
  const userCourses = await db.query.courses.findMany({
    where: or(
      eq(courses.type, "GLOBAL"),
      and(
        eq(courses.type, "CUSTOMIZE"),
        eq(courses.makerId, userId)
      )
    )
  });

  return userCourses;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    // TODO: Populate units and lessons
  });

  return data;
});

export const getUnits = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) {
    return [];
  }

  // Todo: add order if needed
  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgress.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {

      if (lesson.challenges.length === 0) {
        return { ...lesson, completed: false };
      }
      

      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedChallenges };
    });
    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const updateUserProgress = async (data: Partial<typeof userProgress.$inferInsert>) => {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const existingProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!existingProgress) {
    return false;
  }

  await db.update(userProgress)
    .set(data)
    .where(eq(userProgress.userId, userId));

  return true;
};

export const getCourseProgress = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();
  if (!userId || !userProgress?.activeCourseId) {
    return null;
  }

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgress.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              quizOptions: {
                orderBy: (quizOptions, { asc }) => [asc(quizOptions.id)]
              },
              wordOptions: {
                orderBy: (wordOptions, { asc }) => [asc(wordOptions.order)]
              },
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
  .flatMap(unit => unit.lessons)
  .find(lesson => {
    return lesson.challenges.some(challenge => {
      return !challenge.challengeProgress 
        || challenge.challengeProgress.length === 0
        || challenge.challengeProgress.some(progress => progress.completed === false);
    });
  });


  return {
    activelesson: firstUncompletedLesson,
    activelessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseProgress = await getCourseProgress();
  const lessonId = id || courseProgress?.activelessonId;  
  
  if (!lessonId) {
    return null;
  }
  
  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          quizOptions: {
            orderBy: (quizOptions, { asc }) => [asc(quizOptions.id)]
          },
          wordOptions: {
            orderBy: (wordOptions, { asc }) => [asc(wordOptions.order)]
          },
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          }
        }
      }
    }
  });

  if(!data || !data.challenges) {
    return null;
  }


  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed = challenge.challengeProgress
      && challenge.challengeProgress.length > 0
      && challenge.challengeProgress.every((progress) => progress.completed);
    return { ...challenge, completed };
  });
  
  return { ...data, challenges: normalizedChallenges };
  
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();
  
  if (!courseProgress?.activelessonId) {
    return 0;
  }
  
  const lesson = await getLesson(courseProgress.activelessonId);
  
  if (!lesson) {
    return 0;
  }
  
  const completedChallenges = lesson.challenges.filter((challenge) => challenge.completed);
  const percentage = Math.round((completedChallenges.length / lesson.challenges.length) * 100);
  
  return percentage;
});

export const getGlobalCoursesAndCategories = cache(async () => {
  const globalCourses = await db.query.courses.findMany({
    where: eq(courses.type, "GLOBAL"),
  });

  // Extract unique categories from global courses
  const categories = Array.from(new Set(globalCourses.map(course => course.category)));

  return {
    courses: globalCourses,
    categories,
  };
});

export const assignCoursesToUser = async (courseIds: number[]) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get the courses to update
  const coursesToUpdate = await db.query.courses.findMany({
    where: or(
      ...courseIds.map(id => eq(courses.id, id))
    )
  });

  // Update each course's assignedTo array
  for (const course of coursesToUpdate) {
    const currentAssignedTo = course.assignedTo || [];
    if (!currentAssignedTo.includes(userId)) {
      await db.update(courses)
        .set({
          assignedTo: [...currentAssignedTo, userId]
        })
        .where(eq(courses.id, course.id));
    }
  }

  return coursesToUpdate;
};


