import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";

export const courseTypeEnum = pgEnum("course_type", ["GLOBAL", "CUSTOMIZE"]);
export const courseCategoryEnum = pgEnum("course_category", [
  "programming",
  "design",
  "data",
]);
export const rewardSourceEnum = pgEnum("reward_source", [
  "LESSON_COMPLETE",
  "CHALLENGE_SUCCESS",
  "CHALLENGE_FAIL",
  "PRACTICE",
  "SHOP_PURCHASE",
  "SYSTEM_ADJUST",
  "MIGRATION",
  "STREAK_CLAIM",
  "BOX_OPEN",
  "QUEST_CLAIM",
]);

export const completionTypeEnum = pgEnum("completion_type", [
  "LESSON",
  "UNIT",
  "COURSE",
]);

export const boxTypeEnum = pgEnum("box_type", [
  "DAILY",
  "BRONZE",
  "SILVER",
  "GOLD",
  "UNIT",
  "COURSE",
  "STREAK",
]);

export const boxStatusEnum = pgEnum("box_status", [
  "LOCKED",
  "AVAILABLE",
  "OPENED",
]);

export const questTypeEnum = pgEnum("quest_type", [
  "COMPLETE_LESSONS",
  "CORRECT_ANSWERS",
  "EARN_XP",
  "OPEN_BOX",
]);

export const questStatusEnum = pgEnum("quest_status", [
  "ACTIVE",
  "COMPLETED",
  "CLAIMED",
]);

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
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
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
  unitId: integer("unit_id")
    .references(() => units.id, { onDelete: "cascade" })
    .notNull(),
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
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
});

export const lessonChallengesRelations = relations(
  lessonChallenges,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonChallenges.lessonId],
      references: [lessons.id],
    }),
    challenge: one(challenges, {
      fields: [lessonChallenges.challengeId],
      references: [challenges.id],
    }),
  }),
);

export const challengesEnum = pgEnum("type", [
  "SELECT",
  "ASSIST",
  "CODE",
  "VIDEO",
  "TEXT",
  "IMAGE",
  "PDF",
  "COMPLETE",
  "WRITE",
  "PROJECT",
  "AUDIO",
]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  type: challengesEnum("type").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull(),
  explanation: text("explanation"),
  textContent: text("text_content"),
  imageContent: text("image_content"), // Store image URL or base64 data
  videoURL: text("video_url"), // Store video URL
  pdfURL: text("pdf_url"), // Store PDF URL
  audioURL: text("audio_url"), // Store audio URL (Google Drive or direct)
  // Code challenge fields
  initialCode: text("initial_code"), // Starting code template
  language: text("language"), // Programming language
  instructions: text("instructions"), // Challenge instructions
  testCases: text("test_cases"), // JSON array of test cases
  timeLimit: integer("time_limit"), // Time limit in milliseconds
  memoryLimit: integer("memory_limit"), // Memory limit in MB
  // Complete challenge fields
  completeQuestion: text("complete_question"),
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
  challengeId: integer("challenge_id")
    .references(() => challenges.id, { onDelete: "cascade" })
    .notNull(),
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
  challengeId: integer("challenge_id")
    .references(() => challenges.id, { onDelete: "cascade" })
    .notNull(),
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
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  }),
);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
  activeCourseId: integer("active_course_id").references(() => courses.id, {
    onDelete: "cascade",
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

export const rewardEvents = pgTable(
  "reward_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    source: rewardSourceEnum("source").notNull(),
    deltaHearts: integer("delta_hearts").notNull().default(0),
    deltaXp: integer("delta_xp").notNull().default(0),
    deltaCoins: integer("delta_coins").notNull().default(0),
    beforeHearts: integer("before_hearts"),
    afterHearts: integer("after_hearts"),
    beforeXp: integer("before_xp"),
    afterXp: integer("after_xp"),
    beforeCoins: integer("before_coins"),
    afterCoins: integer("after_coins"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdCreatedAtIdx: index("reward_events_user_id_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    sourceCreatedAtIdx: index("reward_events_source_created_at_idx").on(
      table.source,
      table.createdAt,
    ),
  }),
);

export const userMilestones = pgTable(
  "user_milestones",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    unitId: integer("unit_id")
      .references(() => units.id, { onDelete: "cascade" })
      .notNull(),
    lessonId: integer("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" })
      .notNull(),
    completionType: completionTypeEnum("completion_type").notNull(),
    xpGained: integer("xp_gained").notNull().default(0),
    coinsGained: integer("coins_gained").notNull().default(0),
    heartsGained: integer("hearts_gained").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdCreatedAtIdx: index("user_milestones_user_id_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    userIdLessonIdIdx: index("user_milestones_user_id_lesson_id_idx").on(
      table.userId,
      table.lessonId,
    ),
  }),
);

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  course: one(courses, {
    fields: [userMilestones.courseId],
    references: [courses.id],
  }),
  unit: one(units, {
    fields: [userMilestones.unitId],
    references: [units.id],
  }),
  lesson: one(lessons, {
    fields: [userMilestones.lessonId],
    references: [lessons.id],
  }),
}));

export const userStreak = pgTable(
  "user_streak",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    currentStreak: integer("current_streak").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastActiveDate: text("last_active_date"), // YYYY-MM-DD format
    lastClaimDate: text("last_claim_date"), // YYYY-MM-DD format
    freezes: integer("freezes").notNull().default(1), // Start with 1 freeze
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_streak_user_id_idx").on(table.userId),
  }),
);

export const userBoxes = pgTable(
  "user_boxes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    boxType: boxTypeEnum("box_type").notNull(),
    status: boxStatusEnum("status").notNull().default("AVAILABLE"),
    availableAt: timestamp("available_at"),
    openedAt: timestamp("opened_at"),
    expiresAt: timestamp("expires_at"),
    source: text("source").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdStatusIdx: index("user_boxes_user_id_status_idx").on(
      table.userId,
      table.status,
    ),
    userIdBoxTypeCreatedAtIdx: index(
      "user_boxes_user_id_box_type_created_at_idx",
    ).on(table.userId, table.boxType, table.createdAt),
  }),
);

export const userQuests = pgTable(
  "user_quests",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    dateKey: text("date_key").notNull(),
    questType: questTypeEnum("quest_type").notNull(),
    target: integer("target").notNull(),
    progress: integer("progress").notNull().default(0),
    status: questStatusEnum("status").notNull().default("ACTIVE"),
    rewardCoins: integer("reward_coins").notNull().default(0),
    rewardXp: integer("reward_xp").notNull().default(0),
    rewardHearts: integer("reward_hearts").notNull().default(0),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdDateKeyIdx: index("user_quests_user_id_date_key_idx").on(
      table.userId,
      table.dateKey,
    ),
    userIdStatusIdx: index("user_quests_user_id_status_idx").on(
      table.userId,
      table.status,
    ),
  }),
);
