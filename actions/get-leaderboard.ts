"use server";

import { desc } from "drizzle-orm";
import { userProgress } from "@/db/schema";
import db from "@/db/drizzle";
import { auth } from "@clerk/nextjs/server";

export const getLeaderboard = async () => {
  const { userId: currentUserId } = await auth();

  const users = await db.query.userProgress.findMany({
    orderBy: [desc(userProgress.points)],
    limit: 100, // Phase 1 optimization: prevent loading all users
    columns: {
      userId: true,
      userName: true,
      points: true,
      userImageSrc: true,
    },
  });

  return users.map((user, index) => ({
    id: user.userId,
    name: user.userName,
    xp: user.points || 0,
    rank: index + 1,
    avatar: user.userImageSrc,
    streak: 0, // TODO: Add streak tracking
    courses: 0, // TODO: Add course completion tracking
    isCurrentUser: user.userId === currentUserId,
  }));
};
