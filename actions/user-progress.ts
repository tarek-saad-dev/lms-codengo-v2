"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { challengeProgress, challenges, userProgress } from "@/db/schema";
import { redirect } from "next/navigation";
import { getCourseById, getUserProgress } from "@/db/queries";
import { revalidatePath } from "next/cache";
import db from "@/db/drizzle";


export const setActiveCourse = async (courseId: number) => {
    const {userId} = await auth();
    const User = await currentUser();

    if (!userId || !User) {
        throw new Error("User not found");
    };

    const course = await getCourseById(courseId);

    if (!course) {
        throw new Error("Course not found");
    };

    // if(!course.units.length || !course.units[0].lessons.length) {
    //     throw new Error("Course is empty");
    // };
    
    const existingProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    });

    if (existingProgress) {
        await db.update(userProgress).set({
            activeCourseId: courseId,
        }).where(eq(userProgress.userId, userId));

        revalidatePath("/courses");
        revalidatePath("/learn");
        redirect("/learn");
    } else {
        await db.insert(userProgress).values({
            userId: userId,
            userName: User.firstName! || "User",
            userImageSrc: User.imageUrl || "/mascot.svg",
            activeCourseId: courseId,
        });

    }

    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
}


export const reduceHearts = async (challengeId: number) => {
    const { userId } = await auth();
  
    if (!userId) {
      throw new Error("Unauthorized");
    }
  
    const currentUserProgress = await getUserProgress();
    // TODO: Get user subscription
  
    
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId), 
    });
  
    if (!challenge) {
      throw new Error("Challenge not found");
    }
  
    const lessonId = challenge.lessonId; 
  
    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
      where: and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.challengeId , challengeId)
      ),
    });

  
    const isPractice = !!existingChallengeProgress;
  
    if (isPractice) {
      return { error: "practice" };
    }
  
    if (!currentUserProgress) {
      throw new Error("User progress not found");
    }
  
    if (currentUserProgress.hearts === 0) {
      return { error: "hearts" };
    }
    
    await db.update(userProgress).set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0), 
    }).where(eq(userProgress.userId, userId)); 
    
    revalidatePath("/learn");
    revalidatePath(`/lesson/${lessonId}`); 
    
  };
  