"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";

export const getUserCourses = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: {
        with: {
          units: {
            with: {
              lessons: {
                with: {
                  challenges: {
                    with: {
                      challengeProgress: {
                        where: eq(userProgress.userId, userId)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!progress) {
    return {
      activeCourse: null,
      courses: []
    };
  }

  // Get courses that are either global or created by the user
  const allCourses = await db.query.courses.findMany({
    where: (courses) => {
      return or(
        eq(courses.type, "GLOBAL"),
        eq(courses.makerId, userId)
      );
    },
    with: {
      units: {
        with: {
          lessons: {
            with: {
              challenges: {
                with: {
                  challengeProgress: {
                    where: eq(userProgress.userId, userId)
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Calculate progress for each course
  const coursesWithProgress = allCourses.map(course => {
    const totalChallenges = course.units.flatMap(unit => 
      unit.lessons.flatMap(lesson => 
        lesson.challenges
      )
    ).length;

    const completedChallenges = course.units.flatMap(unit => 
      unit.lessons.flatMap(lesson => 
        lesson.challenges.filter(challenge => 
          challenge.challengeProgress.some(progress => progress.completed)
        )
      )
    ).length;

    const progressPercentage = totalChallenges === 0 
      ? 0 
      : Math.round((completedChallenges / totalChallenges) * 100);

    const lastAccessed = new Date(); // Simplified to just use current date since we're not showing the time anymore

    return {
      ...course,
      progress: progressPercentage,
      lastAccessed: lastAccessed || null
    };
  });

  return {
    activeCourse: progress.activeCourse,
    courses: coursesWithProgress
  };
};
