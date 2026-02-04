import { boolean, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";

export const courseTypeEnum = pgEnum("course_type", ["GLOBAL", "CUSTOMIZE"]);
export const courseCategoryEnum = pgEnum("course_category", ["programming", "design", "data"]);

export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    imageSrc: text("image_src").notNull().default(""),
    type: courseTypeEnum("type").notNull().default("GLOBAL"),
    category: courseCategoryEnum("category").notNull().default("programming"),
    demo: text("demo"),
    makerId: varchar("maker_id"),
    assignedTo: text("assigned_to").array(),
    price: integer("price").notNull().default(0),
    xp: integer("xp").notNull().default(0),
});


export const coursesRelations = relations(courses, ({ many }) => ({
    userProgress: many(userProgress),
    units: many(units),
  }));

  export const units = pgTable("units", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    order: integer("order").notNull(),
  });
  
  export const unitsRelations = relations(units, ({ many, one }) => ({
    course: one(courses, {
      fields: [units.courseId],
      references: [courses.id],
    }),
    lessons: many(lessons),
  }));

  export const lessons = pgTable("lessons", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
    order: integer("order").notNull(),
  });
  
  export const lessonsRelations = relations(lessons, ({ one, many }) => ({
    unit: one(units, {
      fields: [lessons.unitId],
      references: [units.id],
    }),
    challenges: many(challenges),
    lessonChallenges: many(lessonChallenges),
  }));
  
  // New join table for lesson-challenge relationships
  export const lessonChallenges = pgTable("lesson_challenges", {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
    order: integer("order").notNull(),
  });
  
  export const lessonChallengesRelations = relations(lessonChallenges, ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonChallenges.lessonId],
      references: [lessons.id],
    }),
    challenge: one(challenges, {
      fields: [lessonChallenges.challengeId],
      references: [challenges.id],
    }),
  }));

  export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST","CODE","VIDEO","TEXT","IMAGE","PDF","COMPLETE","WRITE","PROJECT"]);

  export const challenges = pgTable("challenges", {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    type: challengesEnum("type").notNull(),
    label: text("label").notNull(),
    order: integer("order").notNull(),
    explanation: text("explanation"),
    textContent: text("text_content"),
    imageContent: text("image_content"),  // Store image URL or base64 data
    videoURL: text("video_url"),  // Store video URL
    pdfURL: text("pdf_url"),  // Store PDF URL
    // Code challenge fields
    initialCode: text("initial_code"),  // Starting code template
    language: text("language"),  // Programming language
    instructions: text("instructions"),  // Challenge instructions
    testCases: text("test_cases"),  // JSON array of test cases
    timeLimit: integer("time_limit"),  // Time limit in milliseconds
    memoryLimit: integer("memory_limit"),  // Memory limit in MB
    // Complete challenge fields
    completeQuestion:text("complete_question"),
    // Project challenge fields
    projectStructure: text("project_structure"), // JSON structure of expected files/folders
    projectFiles: text("project_files"), // JSON array of initial files content
    projectTestCases: text("project_test_cases"), // JSON array of test cases for the entire project
    testSetup: text("test_setup"), // JSON containing test environment setup (variables, functions, etc)
    testTeardown: text("test_teardown"), // JSON containing test environment cleanup
    // Web view content
    webViewContent: text("web_view_content"), // HTML/Markdown content for web view
  });
  
  export const challengesRelations = relations(challenges, ({ one, many }) => ({
    lesson: one(lessons, {
      fields: [challenges.lessonId],
      references: [lessons.id],
    }),
    quizOptions: many(quizOptions),
    wordOptions: many(wordOptions),
    challengeProgress: many(challengeProgress),
  }));
  
  export const quizOptions = pgTable("quiz_options", {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
    text: text("text").notNull(),
    correct: boolean("correct").notNull(),
    order: integer("order").notNull().default(0),
    imageSrc: text("image_src"),
    audioSrc: text("audio_src"),
  });
  
  export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
    challenge: one(challenges, {
      fields: [quizOptions.challengeId],
      references: [challenges.id],
    }),
  }));

  export const wordOptions = pgTable("word_options", {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
    word: text("word").notNull(),
    order: integer("order").notNull(),
    correct: boolean("correct").notNull().default(false),
});

export const wordOptionsRelations = relations(wordOptions, ({ one }) => ({
    challenge: one(challenges, {
        fields: [wordOptions.challengeId],
        references: [challenges.id],
    }),
}));

export const challengeProgress = pgTable("challenge_progress", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // TODO: Confirm this doesn't break
    challengeId: integer("challenge_id").references(() => challenges.id, {
      onDelete: "cascade",
    }).notNull(),
    completed: boolean("completed").notNull().default(false),
  });
  
  export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  }));
  
  export const userProgress = pgTable("user_progress", {
    userId: text("user_id").primaryKey(),
    userName: text("user_name").notNull().default("User"),
    userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
    activeCourseId: integer("active_course_id").references(() => courses.id, { 
      onDelete: "cascade" 
    }),
    hearts: integer("hearts").notNull().default(5),
    points: integer("points").notNull().default(0),
    coins: integer("coins").notNull().default(0),
  });
  
  export const userProgressRelations = relations(userProgress, ({ one }) => ({
    activeCourse: one(courses, {
      fields: [userProgress.activeCourseId], 
      references: [courses.id],
    }),
  }));

  
