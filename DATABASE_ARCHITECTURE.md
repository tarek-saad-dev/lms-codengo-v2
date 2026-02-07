# Codengo v2 — Database Architecture & Data Flow

> **Purpose**: Complete reference for building an Admin panel. Every table, column, relation, enum, and data-flow pattern is documented below.

---

## 1. Tech Stack (DB layer)

| Component      | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| ORM            | Drizzle ORM (`drizzle-orm` + `drizzle-kit`)                                      |
| Database       | PostgreSQL (Neon Serverless)                                                     |
| Schema file    | `db/schema.ts`                                                                   |
| DB client      | `db/drizzle.ts`                                                                  |
| Queries        | `db/queries.ts`                                                                  |
| Server Actions | `actions/*.ts` + `app/(main)/courses/actions.ts`                                 |
| Migrations dir | `drizzle/`                                                                       |
| Config         | `drizzle.config.ts`                                                              |
| Auth provider  | Clerk (`@clerk/nextjs`) — user IDs come from Clerk, NOT from a local users table |

---

## 2. Enums

### `course_type`

```
"GLOBAL" | "CUSTOMIZE"
```

- **GLOBAL** — Admin-created courses visible to everyone.
- **CUSTOMIZE** — User-created courses (via the "customize" flow), visible only to the creator (`makerId`).

### `course_category`

```
"programming" | "design" | "data"
```

### `type` (challenge type)

```
"SELECT" | "ASSIST" | "CODE" | "VIDEO" | "TEXT" | "IMAGE" | "PDF" | "COMPLETE" | "WRITE" | "PROJECT" | "AUDIO"
```

---

## 3. Tables — Full Column Reference

### 3.1 `courses`

| Column        | Type                   | Constraints                       | Description                                          |
| ------------- | ---------------------- | --------------------------------- | ---------------------------------------------------- |
| `id`          | `serial`               | PK, auto-increment                | Course ID                                            |
| `title`       | `text`                 | NOT NULL                          | Course title                                         |
| `description` | `text`                 | NOT NULL, default `""`            | Course description                                   |
| `image_src`   | `text`                 | NOT NULL, default `""`            | Icon/image URL                                       |
| `type`        | `course_type` enum     | NOT NULL, default `"GLOBAL"`      | Global or user-customized                            |
| `category`    | `course_category` enum | NOT NULL, default `"programming"` | Category tag                                         |
| `demo`        | `text`                 | nullable                          | Demo URL                                             |
| `maker_id`    | `varchar`              | nullable                          | Clerk user ID of the creator (for CUSTOMIZE courses) |
| `assigned_to` | `text[]`               | nullable                          | Array of Clerk user IDs this course is assigned to   |
| `price`       | `integer`              | NOT NULL, default `0`             | Course price (in coins)                              |
| `xp`          | `integer`              | NOT NULL, default `0`             | XP reward for course                                 |

**Relations:**

- `courses` → **has many** `units`
- `courses` → **has many** `userProgress`

---

### 3.2 `units`

| Column        | Type      | Constraints                                    | Description            |
| ------------- | --------- | ---------------------------------------------- | ---------------------- |
| `id`          | `serial`  | PK                                             | Unit ID                |
| `title`       | `text`    | NOT NULL                                       | Unit title             |
| `description` | `text`    | NOT NULL, default `""`                         | Unit description       |
| `course_id`   | `integer` | FK → `courses.id`, ON DELETE CASCADE, NOT NULL | Parent course          |
| `order`       | `integer` | NOT NULL                                       | Display/sequence order |

**Relations:**

- `units` → **belongs to** `courses` (via `course_id`)
- `units` → **has many** `lessons`

---

### 3.3 `lessons`

| Column    | Type      | Constraints                                  | Description            |
| --------- | --------- | -------------------------------------------- | ---------------------- |
| `id`      | `serial`  | PK                                           | Lesson ID              |
| `title`   | `text`    | NOT NULL                                     | Lesson title           |
| `unit_id` | `integer` | FK → `units.id`, ON DELETE CASCADE, NOT NULL | Parent unit            |
| `order`   | `integer` | NOT NULL                                     | Display/sequence order |

**Relations:**

- `lessons` → **belongs to** `units` (via `unit_id`)
- `lessons` → **has many** `challenges`
- `lessons` → **has many** `lessonChallenges` (join table)

---

### 3.4 `challenges`

| Column               | Type        | Constraints                                    | Description                                             |
| -------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------------- |
| `id`                 | `serial`    | PK                                             | Challenge ID                                            |
| `lesson_id`          | `integer`   | FK → `lessons.id`, ON DELETE CASCADE, NOT NULL | Parent lesson                                           |
| `type`               | `type` enum | NOT NULL                                       | Challenge type (SELECT, VIDEO, TEXT, CODE, etc.)        |
| `label`              | `text`      | NOT NULL                                       | Challenge title / question text                         |
| `order`              | `integer`   | NOT NULL                                       | Display/sequence order                                  |
| `explanation`        | `text`      | nullable                                       | Explanation / material content                          |
| `text_content`       | `text`      | nullable                                       | Text content for TEXT challenges                        |
| `image_content`      | `text`      | nullable                                       | Image URL or base64 for IMAGE challenges                |
| `video_url`          | `text`      | nullable                                       | Video URL for VIDEO challenges                          |
| `pdf_url`            | `text`      | nullable                                       | PDF URL for PDF challenges                              |
| `audio_url`          | `text`      | nullable                                       | Audio URL for AUDIO challenges (Google Drive or direct) |
| `initial_code`       | `text`      | nullable                                       | Starting code template (CODE)                           |
| `language`           | `text`      | nullable                                       | Programming language (CODE)                             |
| `instructions`       | `text`      | nullable                                       | Challenge instructions (CODE)                           |
| `test_cases`         | `text`      | nullable                                       | JSON array of test cases (CODE)                         |
| `time_limit`         | `integer`   | nullable                                       | Time limit in ms (CODE)                                 |
| `memory_limit`       | `integer`   | nullable                                       | Memory limit in MB (CODE)                               |
| `complete_question`  | `text`      | nullable                                       | Question for COMPLETE challenges                        |
| `project_structure`  | `text`      | nullable                                       | JSON structure of expected files/folders (PROJECT)      |
| `project_files`      | `text`      | nullable                                       | JSON of initial files content (PROJECT)                 |
| `project_test_cases` | `text`      | nullable                                       | JSON array of project test cases (PROJECT)              |
| `test_setup`         | `text`      | nullable                                       | JSON for test env setup (PROJECT)                       |
| `test_teardown`      | `text`      | nullable                                       | JSON for test env cleanup (PROJECT)                     |
| `web_view_content`   | `text`      | nullable                                       | HTML/Markdown for web view rendering                    |

**Relations:**

- `challenges` → **belongs to** `lessons` (via `lesson_id`)
- `challenges` → **has many** `quizOptions`
- `challenges` → **has many** `wordOptions`
- `challenges` → **has many** `challengeProgress`

---

### 3.5 `lesson_challenges` (Join Table)

| Column         | Type      | Constraints                                       | Description   |
| -------------- | --------- | ------------------------------------------------- | ------------- |
| `id`           | `serial`  | PK                                                | Row ID        |
| `lesson_id`    | `integer` | FK → `lessons.id`, ON DELETE CASCADE, NOT NULL    | Lesson        |
| `challenge_id` | `integer` | FK → `challenges.id`, ON DELETE CASCADE, NOT NULL | Challenge     |
| `order`        | `integer` | NOT NULL                                          | Display order |

> **Note:** Currently defined in schema but not heavily used in queries — challenges already have a direct `lesson_id` FK. This table enables future many-to-many (reuse challenges across lessons).

---

### 3.6 `quiz_options`

| Column         | Type      | Constraints                                       | Description                   |
| -------------- | --------- | ------------------------------------------------- | ----------------------------- |
| `id`           | `serial`  | PK                                                | Option ID                     |
| `challenge_id` | `integer` | FK → `challenges.id`, ON DELETE CASCADE, NOT NULL | Parent challenge              |
| `text`         | `text`    | NOT NULL                                          | Option text                   |
| `correct`      | `boolean` | NOT NULL                                          | Is this the correct answer?   |
| `order`        | `integer` | NOT NULL, default `0`                             | Display order                 |
| `image_src`    | `text`    | nullable                                          | Optional image for the option |
| `audio_src`    | `text`    | nullable                                          | Optional audio for the option |

**Relations:**

- `quizOptions` → **belongs to** `challenges` (via `challenge_id`)

---

### 3.7 `word_options`

| Column         | Type      | Constraints                                       | Description           |
| -------------- | --------- | ------------------------------------------------- | --------------------- |
| `id`           | `serial`  | PK                                                | Option ID             |
| `challenge_id` | `integer` | FK → `challenges.id`, ON DELETE CASCADE, NOT NULL | Parent challenge      |
| `word`         | `text`    | NOT NULL                                          | The word              |
| `order`        | `integer` | NOT NULL                                          | Display order         |
| `correct`      | `boolean` | NOT NULL, default `false`                         | Is correct selection? |

**Relations:**

- `wordOptions` → **belongs to** `challenges` (via `challenge_id`)

---

### 3.8 `challenge_progress`

| Column         | Type      | Constraints                                       | Description         |
| -------------- | --------- | ------------------------------------------------- | ------------------- |
| `id`           | `serial`  | PK                                                | Progress ID         |
| `user_id`      | `text`    | NOT NULL                                          | Clerk user ID       |
| `challenge_id` | `integer` | FK → `challenges.id`, ON DELETE CASCADE, NOT NULL | Completed challenge |
| `completed`    | `boolean` | NOT NULL, default `false`                         | Completion status   |

**Relations:**

- `challengeProgress` → **belongs to** `challenges` (via `challenge_id`)

> **No FK to a users table** — `user_id` is the Clerk-provided string ID.

---

### 3.9 `user_progress`

| Column             | Type      | Constraints                                    | Description                                     |
| ------------------ | --------- | ---------------------------------------------- | ----------------------------------------------- |
| `user_id`          | `text`    | **PK**                                         | Clerk user ID (primary key, not auto-increment) |
| `user_name`        | `text`    | NOT NULL, default `"User"`                     | Display name (from Clerk)                       |
| `user_image_src`   | `text`    | NOT NULL, default `"/mascot.svg"`              | Avatar URL                                      |
| `active_course_id` | `integer` | FK → `courses.id`, ON DELETE CASCADE, nullable | Currently active course                         |
| `hearts`           | `integer` | NOT NULL, default `5`                          | Remaining hearts (lives)                        |
| `points`           | `integer` | NOT NULL, default `0`                          | XP points                                       |
| `coins`            | `integer` | NOT NULL, default `0`                          | In-app currency                                 |

**Relations:**

- `userProgress` → **belongs to** `courses` (via `active_course_id` → `courses.id`)

---

## 4. Entity-Relationship Diagram (Text)

```
courses (1) ──────< units (1) ──────< lessons (1) ──────< challenges (1) ──────< quiz_options
   │                                     │                     │
   │                                     │                     ├──────< word_options
   │                                     │                     │
   │                                     │                     └──────< challenge_progress
   │                                     │
   │                                     └──────< lesson_challenges (join table)
   │
   └──────< user_progress
```

### Hierarchy (top-down):

```
Course
  └─ Unit(s)         [ordered]
       └─ Lesson(s)  [ordered]
            └─ Challenge(s)  [ordered, typed]
                 ├─ QuizOption(s)     (for SELECT / ASSIST)
                 ├─ WordOption(s)     (for COMPLETE / WRITE)
                 └─ ChallengeProgress (per-user completion tracking)
```

---

## 5. Data Flow — How Content Is Created

### 5.1 GLOBAL Courses (Admin-created, currently via seed script)

**File:** `scripts/seed.ts`

Flow:

1. Delete all existing data (courses, units, lessons, challenges, quizOptions, userProgress, challengeProgress).
2. Insert courses with `type: "GLOBAL"` (hardcoded IDs).
3. Insert units referencing `courseId`.
4. Insert lessons referencing `unitId`.
5. Insert challenges referencing `lessonId` with a `type` enum.
6. Insert `quizOptions` referencing `challengeId`.

> **Admin page must replace this** — provide CRUD UI for the same insert chain.

### 5.2 CUSTOMIZE Courses (User-created via UI)

**File:** `app/(main)/courses/actions.ts` → `createCourse()`

Flow:

1. User provides a `title` and selects `learningObjects` (from external API at `iia-one.vercel.app`).
2. `createCourse()` inserts a new `courses` row with `type: "CUSTOMIZE"` and `makerId: userId`.
3. Creates **one unit** for the course.
4. For each learning object → creates a **lesson**.
5. For each lesson → fetches sub-LOs from external API → creates **challenges** (typed by content: VIDEO, TEXT, PDF, CODE, PROJECT, SELECT).
6. For SELECT challenges → creates **quizOptions** (either duplicated from a referenced challenge or default placeholders).

### 5.3 User Enrolls in a Course

**File:** `actions/user-progress.ts` → `setActiveCourse()`

Flow:

1. Checks if `userProgress` row exists for this `userId`.
2. If exists → updates `activeCourseId`.
3. If not → inserts new `userProgress` row with name, avatar, `activeCourseId`, default hearts (5), points (0), coins (0).

### 5.4 User Completes a Challenge

**File:** `actions/challenge-progress.ts` → `upsertChallengeProgress()`

Flow:

1. Finds the challenge by ID.
2. Checks if `challengeProgress` row exists for this user + challenge.
3. **Practice mode** (already completed before): updates `completed = true`, awards +1 heart (max 5), +10 points.
4. **First attempt**: inserts new `challengeProgress` row, awards +10 points, 40% chance of +1 heart (max 8).
5. If hearts === 0 and not practice → returns `{ error: "hearts" }`.

### 5.5 User Loses a Heart (Wrong Answer)

**File:** `actions/user-progress.ts` → `reduceHearts()`

Flow:

1. Checks if already completed (practice) → returns `{ error: "practice" }` (no penalty).
2. Decrements hearts by 1 (min 0).

### 5.6 Shop Actions

**File:** `actions/shop.ts`

- `buyHeartsAction(amount, price)` — deducts coins, adds hearts.
- `spinWheelAction()` — costs 10 coins, random prize (coins, hearts, avatar, skip, boost).
- `getShopData()` — returns current coins + hearts.

### 5.7 Leaderboard

**File:** `actions/get-leaderboard.ts`

- Queries all `userProgress` rows ordered by `points DESC`.
- Returns rank, name, xp, avatar, `isCurrentUser` flag.

### 5.8 Course Assignment

**File:** `db/queries.ts` → `assignCoursesToUser()`

- Appends `userId` to the `assignedTo` text array on selected courses.

---

## 6. Key Queries (from `db/queries.ts`)

| Function                          | What it returns                                                      | Used by                   |
| --------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| `getUserProgress()`               | User's progress row + active course                                  | Everywhere                |
| `getCourses()`                    | All GLOBAL courses + user's CUSTOMIZE courses                        | Course list page          |
| `getCourseById(id)`               | Single course                                                        | Enrollment action         |
| `getUnits()`                      | Units → Lessons → Challenges → ChallengeProgress (for active course) | Learn page                |
| `getCourseProgress()`             | First uncompleted lesson in active course                            | Lesson page, progress bar |
| `getLesson(id?)`                  | Lesson → Challenges → QuizOptions + WordOptions + ChallengeProgress  | Lesson/challenge UI       |
| `getLessonPercentage()`           | % of completed challenges in active lesson                           | Progress display          |
| `getGlobalCoursesAndCategories()` | All global courses + unique categories                               | Explore page              |
| `assignCoursesToUser(ids)`        | Updates `assignedTo` array                                           | Course assignment         |

---

## 7. What the Admin Page Needs to Manage

### 7.1 CRUD Operations Required

| Entity                 | Create                                                        | Read                               | Update                                | Delete                                       |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------- | ------------------------------------- | -------------------------------------------- |
| **Courses**            | title, description, imageSrc, type, category, demo, price, xp | List all (filter by type/category) | All fields                            | Cascade deletes units → lessons → challenges |
| **Units**              | title, description, courseId, order                           | List by course                     | All fields + reorder                  | Cascade deletes lessons → challenges         |
| **Lessons**            | title, unitId, order                                          | List by unit                       | All fields + reorder                  | Cascade deletes challenges                   |
| **Challenges**         | All 20+ fields (varies by type)                               | List by lesson                     | All fields + reorder                  | Cascade deletes options + progress           |
| **Quiz Options**       | text, correct, order, imageSrc, audioSrc, challengeId         | List by challenge                  | All fields                            | Direct delete                                |
| **Word Options**       | word, order, correct, challengeId                             | List by challenge                  | All fields                            | Direct delete                                |
| **User Progress**      | (auto-created on enrollment)                                  | List all users                     | hearts, points, coins, activeCourseId | Delete user progress                         |
| **Challenge Progress** | (auto-created on completion)                                  | List by user or challenge          | completed flag                        | Delete/reset progress                        |

### 7.2 Admin-Specific Features to Build

1. **Course Builder** — Create GLOBAL courses with full unit → lesson → challenge hierarchy.
2. **Challenge Editor** — Form that adapts fields based on challenge `type`:
   - **SELECT**: label + quizOptions (text, correct, image, audio)
   - **ASSIST**: label + quizOptions
   - **CODE**: label + initialCode + language + instructions + testCases + timeLimit + memoryLimit
   - **VIDEO**: label + videoURL
   - **AUDIO**: label + audioURL (Google Drive link or direct URL)
   - **TEXT**: label + textContent + webViewContent
   - **IMAGE**: label + imageContent
   - **PDF**: label + pdfURL
   - **COMPLETE**: label + completeQuestion + wordOptions
   - **WRITE**: label + wordOptions
   - **PROJECT**: label + projectStructure + projectFiles + projectTestCases + testSetup + testTeardown
3. **Drag-and-Drop Reordering** — For units, lessons, and challenges (update `order` field).
4. **User Management** — View all users, their progress, reset hearts/points, view per-challenge completion.
5. **Analytics Dashboard** — Completion rates per course/lesson/challenge, leaderboard data.
6. **Bulk Operations** — Assign courses to users (update `assignedTo` array), reset progress.

### 7.3 Insert Chain for Creating a Full Course (Admin)

```
1. INSERT into courses → get course.id
2. INSERT into units (courseId = course.id, order = 1..N) → get unit.id[]
3. For each unit:
   INSERT into lessons (unitId = unit.id, order = 1..N) → get lesson.id[]
4. For each lesson:
   INSERT into challenges (lessonId = lesson.id, type = ..., order = 1..N) → get challenge.id[]
5. For each SELECT/ASSIST challenge:
   INSERT into quiz_options (challengeId = challenge.id, text, correct, order)
6. For each COMPLETE/WRITE challenge:
   INSERT into word_options (challengeId = challenge.id, word, order, correct)
```

### 7.4 Delete Chain (Cascades Handle This)

Deleting a **course** automatically cascades:

```
DELETE course → units deleted → lessons deleted → challenges deleted → quiz_options deleted
                                                                    → word_options deleted
                                                                    → challenge_progress deleted
```

Also: `user_progress` rows with `active_course_id` pointing to deleted course get cascaded.

---

## 8. Important Notes for Admin Implementation

1. **No local users table** — Users come from Clerk. `user_progress.user_id` is the Clerk ID string. To list users, you'll need the Clerk Admin API or just query `user_progress` for enrolled users.

2. **Course type distinction** — Admin should create `type: "GLOBAL"` courses. `type: "CUSTOMIZE"` is for end-user created courses. Admin can view/edit both.

3. **Order fields are critical** — Units, lessons, challenges all have an `order` integer that controls display sequence. Admin must manage this (ideally drag-and-drop).

4. **Challenge type determines which fields matter** — Most of the 20+ columns on `challenges` are nullable and only relevant for specific types. The admin form should show/hide fields based on the selected type.

5. **Quiz options need at least one `correct: true`** — Validation required.

6. **`assignedTo` is a text array** — Stored directly on the course row. Admin can manage bulk assignment.

7. **Hearts system** — Default 5, max 8 (on random reward), can be purchased in shop. Admin may want to override.

8. **Points/Coins** — Points = XP for leaderboard. Coins = shop currency. Both on `user_progress`.

9. **External API dependency** — The customize flow (`createCourse`) calls `iia-one.vercel.app` for learning objects. Admin flow should NOT depend on this — it should be fully manual CRUD.

10. **Seed script is destructive** — `scripts/seed.ts` deletes ALL data before seeding. Admin page replaces this entirely.
