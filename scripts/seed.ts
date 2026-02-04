import "dotenv/config";

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);

const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("seeding start");
    await db.delete(schema.courses);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeProgress);
    await db.delete(schema.quizOptions);

    await db.insert(schema.courses).values([
      {
        id: 1,
        title: "NextJs Basics",
        imageSrc: "/nextjs.gif",
      },
      {
        id: 2,
        title: "Flutter Basics",
        imageSrc: "/flutter.gif",
      },
      {
        id: 3,
        title: "mySQL Basics",
        imageSrc: "/mysql.svg",
      },
    ]);

  // ✅ إضافة وحدة واحدة (Introduction)
  await db.insert(schema.units).values([
    { id: 1, title: "Unit 1", description: "Learn the fundamentals of Next.js", courseId: 1, order: 1 },
    { id: 2, title: "Unit 2", description: "Learn the fundamentals of Next.js", courseId: 1, order: 2 },
  ]);

  // ✅ إضافة درسين داخل الوحدة
  await db.insert(schema.lessons).values([
    { id: 1, title: "What is Next.js?", unitId: 1, order: 1 },
    { id: 2, title: "How Next.js Works?", unitId: 1, order: 2 },
  ]);

  // ✅ إضافة تحديين من نوع SELECT فقط
  await db.insert(schema.challenges).values([
    { id: 1, lessonId: 1, type: "SELECT", label: "What is Next.js used for?", order: 1 },
    { id: 3, lessonId: 1, type: "SELECT", label: "What is nodeJs used in web ?", order: 2 },
    { id: 2, lessonId: 2, type: "SELECT", label: "What is the main feature of Next.js?", order: 2 },
  ]);


  await db.insert(schema.quizOptions).values([
    { id: 1, challengeId: 1, text: "Building React applications",imageSrc:'/mascot.svg' ,audioSrc:'/sbah.mp3', correct: true },
    { id: 2, challengeId: 1, text: "Styling with CSS only",imageSrc:'/mascot.svg',audioSrc:'/sbah.mp3', correct: false },
    { id: 5, challengeId: 3, text: "Building React applications",imageSrc:'/mascot.svg' ,audioSrc:'/sbah.mp3', correct: true },
    { id: 6, challengeId: 3, text: "Styling with CSS only",imageSrc:'/mascot.svg',audioSrc:'/sbah.mp3', correct: false },
    { id: 3, challengeId: 2, text: "Server-side rendering (SSR)",imageSrc:'/mascot.svg' ,audioSrc:'/sbah.mp3', correct: true },
    { id: 4, challengeId: 2, text: "Using Angular for front-end",imageSrc:'/mascot.svg' ,audioSrc:'/sbah.mp3', correct: false },
  ]);

    console.log("seeding finished");
  } catch (error) {
    console.log(error);
    throw new Error("failed to seed DB");
  }
};

main();
