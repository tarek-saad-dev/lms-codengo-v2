# PHASE U2: End Screens & Progress Closure - Implementation Status

**Date:** Feb 12, 2026  
**Status:** 🚧 **IN PROGRESS** (60% Complete)
PHASE U3 — Streak System (Daily Habit Loop) — User App Only (No Admin)

Goal
Add a full daily streak system that encourages users to learn every day, with a simple daily reward claim and optional streak freeze.
This phase must work fully inside the user app (LMS) with correct persistence, idempotency, and clean UI.

✅ Requirements

1. Database / Models
   Choose ONE of these approaches (recommended: separate model for clarity).

Option A (Recommended): Create new model: user_streak
Fields:

- id (cuid/uuid)
- userId (string, unique, indexed)
- currentStreak (int, default 0)
- bestStreak (int, default 0)
- lastActiveDate (date-only, nullable) // store as YYYY-MM-DD in server TZ
- lastClaimDate (date-only, nullable) // last day user claimed daily reward
- freezes (int, default 0) // streak freeze tokens
- createdAt, updatedAt

Option B: Add fields to user_progress (less ideal):

- currentStreak, bestStreak, lastActiveDate, lastClaimDate, freezes

Notes:

- We must treat dates as DATE (not datetime) to avoid timezone confusion.
- Use the app’s server timezone consistently.

2. Streak Logic (Server-side, authoritative)
   Implement helper functions in a single module e.g. /lib/streak.ts:

A) getTodayDateKey(): string

- returns a date string like "2026-02-12" based on server TZ.

B) updateStreakOnLearning(userId): returns streak state
Called when user completes a lesson successfully (hook into completeLesson from Phase U2).
Rules:

- If lastActiveDate is null:
  - currentStreak = 1
  - bestStreak = max(bestStreak, 1)
  - lastActiveDate = today
- If lastActiveDate == today:
  - Do nothing (streak already counted today)
- If lastActiveDate == yesterday:
  - currentStreak += 1
  - bestStreak = max(bestStreak, currentStreak)
  - lastActiveDate = today
- Else (gap >= 2 days):
  - If freezes > 0:
    - consumes 1 freeze
    - currentStreak += 1 (treat as continued streak)
    - bestStreak = max(bestStreak, currentStreak)
    - lastActiveDate = today
      Else:
    - currentStreak = 1
    - bestStreak = max(bestStreak, 1)
    - lastActiveDate = today

Important:

- This must run in a DB transaction.
- Must be safe under concurrent requests.
- Must NOT increment streak more than once per day.

C) getStreakState(userId): returns
{
todayKey,
currentStreak,
bestStreak,
lastActiveDate,
freezes,
canClaimToday: boolean,
isAtRisk: boolean, // e.g. lastActiveDate == yesterday AND not learned today
daysSinceActive: number
}

Compute:

- canClaimToday = (lastClaimDate != today) AND (lastActiveDate == today)
- isAtRisk = (lastActiveDate == yesterday) AND (today not active yet)
  (You can refine later.)

3. Daily Reward Claim (Server action)
   Create server action:
   claimDailyStreakReward(userId)

Rules:

- User can claim only if:
  - lastActiveDate == today
  - lastClaimDate != today
- Reward logic (simple for now):
  - base coins reward scales with currentStreak, but capped.
    Example:
    dayReward = min(10 + currentStreak \* 2, 60) coins
    xpReward = 0 (optional)
    heartsReward = 0 (optional)
- Use Economy Service (Phase U1):
  grantReward(userId, { coins: dayReward }, "STREAK_CLAIM", { idempotencyKey: `streak:claim:${todayKey}`, streak: currentStreak })

Then update:

- lastClaimDate = today

Return:
{
claimed: true,
coinsGained: number,
currentStreak: number,
bestStreak: number,
freezes: number
}

Idempotency:

- Must be idempotent even if called twice (same todayKey).

4. Freeze Tokens (User-facing, minimal)
   Add a simple way for the user to have freezes:

- Start with freezes=1 for new users OR grant one on reaching streak milestones (e.g. streak 7).
  Implement milestone rule (simple):
- When updateStreakOnLearning results in currentStreak == 7:
  - add +1 freeze (max 2)
  - log via reward_events? (optional as economy change only if you store freezes outside economy)
    Notes:
- Freeze is NOT hearts/xp/coins; it’s a streak feature token.
- Track changes in a separate streak_events table is optional; can be added later.

5. UI — Streak Widget + Daily Claim
   Add a streak UI component visible in the learn flow (top bar or home page):

- Shows:
  - 🔥 currentStreak
  - bestStreak (small)
  - status: “Learn today to keep your streak” OR “Streak secured today”
  - claim button when available

Behavior:

- On page load, fetch streak state (server action or API route).
- If canClaimToday:
  - show “Claim reward” button
  - clicking calls claimDailyStreakReward()
  - show reward animation + SFX (if sound system exists)
- If isAtRisk:
  - show a gentle warning text (not scary).

6. Integration Points (must wire correctly)

- Hook updateStreakOnLearning(userId) inside Phase U2 completeLesson() AFTER lesson completion succeeds.
- Ensure it runs once per lesson completion, but streak only increments once/day.
- Ensure reward claim is separate (user presses claim), not automatic.

7. UX Polish (User app only)

- Small celebratory micro-animation when streak increments (e.g. flame pulse).
- When claiming reward: show coins flying + pop sound (if available).
- Make all text friendly and game-like.

✅ Acceptance Criteria

- Completing a lesson on a new day increases streak correctly.
- Completing multiple lessons in the same day does NOT increase streak more than once.
- Missing 1 day:
  - if user has freeze => streak continues and freeze decreases
  - else streak resets to 1
- Daily claim works once per day only.
- Claim is idempotent and never double-grants coins.
- UI always reflects correct state after refresh.

Deliverables

- DB changes (user_streak or fields)
- streak module (/lib/streak.ts)
- server actions:
  - getStreakState(userId)
  - claimDailyStreakReward(userId)
- integrate updateStreakOnLearning into completeLesson()
- streak UI widget + claim flow
- manual test checklist (same user):
  1. first ever lesson => streak=1, canClaim=true
  2. claim => coins added once
  3. second lesson same day => streak unchanged
  4. simulate tomorrow => streak increments
  5. simulate gap 2 days with freeze => consumes freeze, streak continues
  6. simulate gap 2 days with no freeze => reset to 1

---

## ✅ Completed Components

### 1. Database Schema ✅

**File:** `db/schema.ts`

**Added:**

- `completionTypeEnum` — LESSON | UNIT | COURSE
- `userMilestones` table with:
  - userId, courseId, unitId, lessonId
  - completionType, xpGained, coinsGained, heartsGained
  - Indexes for efficient queries
  - Relations to courses, units, lessons

**Status:** ✅ Ready for migration

---

### 2. Completion State Detection ✅

**File:** `lib/completion-state.ts`

**Function:** `getLessonCompletionState(userId, courseId, lessonId)`

**Returns:**

```typescript
{
  isLessonComplete: boolean,
  isLastLessonInUnit: boolean,
  isLastLessonInCourse: boolean,
  nextLessonId: number | null,
  nextUnitId: number | null,
  unitId: number,
  courseId: number,
  unitTitle: string,
  courseTitle: string
}
```

**Logic:**

1. Get current lesson with unit/course info
2. Find next lesson in same unit (by order)
3. If no next lesson in unit, find first lesson of next unit
4. If no next unit, mark as course complete

**Status:** ✅ Fully implemented

---

### 3. Lesson Completion Action ✅

**File:** `actions/lesson-completion.ts`

**Function:** `completeLesson(courseId, lessonId)`

**Features:**

- ✅ Idempotent (checks for existing milestone)
- ✅ Computes completion type (LESSON/UNIT/COURSE)
- ✅ Grants rewards via Economy Service
- ✅ Saves milestone to database
- ✅ Returns completion data for UI

**Rewards:**

- LESSON: +10 XP
- UNIT: +10 XP + 5 coins
- COURSE: +10 XP + 20 coins

**Idempotency Key:** `completeLesson:${lessonId}:${userId}`

**Status:** ✅ Fully implemented

---

## 🚧 Remaining Work

### 4. End Screen Components 🚧

**Location:** `app/lesson/end/` (to be created)

**Required Components:**

#### A) LessonCompleteScreen

- Title: "Lesson Complete! 🎉"
- Show: XP gained, coins gained
- Show: Progress indicator
- Button: "Continue" → next lesson

#### B) UnitCompleteScreen

- Title: "Unit Complete! 🏆"
- Show: Unit badge/celebration
- Show: XP + coins gained
- Button: "Start Next Unit" → next unit first lesson

#### C) CourseCompleteScreen

- Title: "Course Complete! 🎓"
- Show: Bigger celebration
- Show: Total lessons completed
- Button 1: "Explore New Course" → /courses
- Button 2: "Practice" → practice mode

**Implementation Plan:**

```tsx
// app/lesson/end/page.tsx
export default async function LessonEndPage({ searchParams }) {
  const { userId } = await auth();
  const milestone = await getLatestMilestone(userId);

  if (!milestone) {
    redirect("/learn");
  }

  // Render appropriate screen based on milestone.completionType
  switch (milestone.completionType) {
    case "LESSON":
      return <LessonCompleteScreen milestone={milestone} />;
    case "UNIT":
      return <UnitCompleteScreen milestone={milestone} />;
    case "COURSE":
      return <CourseCompleteScreen milestone={milestone} />;
  }
}
```

---

### 5. Challenge Component Integration 🚧

**Required Changes:**

#### A) Fix Crash with Defensive Checks

**File:** `app/lesson/challenge.tsx`

**Current Issue:**

- Runtime crash when reading `challenge.type` on undefined challenge
- Need defensive checks before accessing challenge properties

**Fix:**

```tsx
// Before rendering challenge, add safety check
if (!challenge) {
  console.error("Challenge not found at index:", activeIndex);
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Challenge not found</h2>
        <Button onClick={() => router.push("/learn")}>Return to Lessons</Button>
      </div>
    </div>
  );
}

// Safe to access challenge.type now
const challengeType = challenge.type;
```

#### B) Integrate completeLesson Call

**Location:** When last challenge is answered correctly

**Current Flow:**

```tsx
// In onContinue or handleTextComplete
if (activeIndex === challenges.length - 1) {
  // Last challenge - call completeLesson
  const result = await completeLesson(courseId, lessonId);

  // Navigate to end screen
  router.push("/lesson/end");
}
```

**Implementation:**

```tsx
const onNext = async () => {
  sfx.playTransition();

  const newIndex = activeIndex + 1;

  if (newIndex >= challenges.length) {
    // Lesson complete - call server action
    try {
      const result = await completeLesson(courseId, lessonId);

      // Navigate to end screen
      router.push("/lesson/end");
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      toast.error("Failed to save progress");
    }
  } else {
    setActiveIndex(newIndex);
  }
};
```

---

### 6. Celebration Animations & SFX 🚧

**Required:**

#### A) SFX Integration

**File:** `hooks/use-sfx.ts`

**Add Methods:**

```typescript
playLessonComplete() {
  this.play("lesson-complete.mp3");
}

playUnitComplete() {
  this.play("unit-complete.mp3");
}

playCourseComplete() {
  this.play("course-complete.mp3");
}
```

#### B) Confetti Variants

**Component:** End screen components

**Implementation:**

```tsx
// Lesson: Small confetti
<Confetti numberOfPieces={200} recycle={false} />

// Unit: Medium confetti
<Confetti numberOfPieces={400} recycle={false} />

// Course: Large confetti
<Confetti numberOfPieces={800} recycle={false} />
```

---

## 📋 Testing Checklist

### Manual Tests Required

- [ ] **Normal Lesson Completion**
  1. Complete a lesson (not last in unit)
  2. ✅ Lesson Complete screen appears
  3. ✅ Shows correct XP (+10)
  4. ✅ "Continue" button works
  5. ✅ Navigates to next lesson

- [ ] **Unit Completion**
  1. Complete last lesson in a unit
  2. ✅ Unit Complete screen appears
  3. ✅ Shows correct rewards (+10 XP, +5 coins)
  4. ✅ "Start Next Unit" button works
  5. ✅ Navigates to first lesson of next unit

- [ ] **Course Completion**
  1. Complete last lesson in course
  2. ✅ Course Complete screen appears
  3. ✅ Shows correct rewards (+10 XP, +20 coins)
  4. ✅ Both buttons work correctly

- [ ] **Idempotency**
  1. Complete a lesson
  2. Call completeLesson again (simulate double-click)
  3. ✅ No double rewards granted
  4. ✅ Returns same milestone data

- [ ] **Refresh Handling**
  1. Complete a lesson
  2. Refresh end screen page
  3. ✅ Still shows correct completion screen
  4. ✅ Data persists from milestone

- [ ] **Challenge Component Safety**
  1. Navigate to lesson with missing challenge data
  2. ✅ No crash
  3. ✅ Shows error UI with return button

---

## 🔧 Database Migration Required

**Run:**

```bash
npx drizzle-kit push
```

**Tables to Create:**

- `completion_type` enum
- `user_milestones` table with indexes

---

## 📊 Progress Summary

**Completed:**

- ✅ Database schema design
- ✅ Completion state detection logic
- ✅ Server action with Economy integration
- ✅ Idempotency handling
- ✅ Milestone persistence

**Remaining:**

- 🚧 End screen components (3 variants)
- 🚧 Challenge component integration
- 🚧 Defensive checks for crashes
- 🚧 Celebration animations
- 🚧 SFX integration
- 🚧 Manual testing

**Estimated Time:** 2-3 hours for remaining work

---

## 🎯 Next Steps

1. **Create End Screen Components**
   - Create `app/lesson/end/page.tsx`
   - Create `components/lesson-complete-screen.tsx`
   - Create `components/unit-complete-screen.tsx`
   - Create `components/course-complete-screen.tsx`

2. **Integrate into Challenge Flow**
   - Add defensive checks for undefined challenge
   - Call `completeLesson` when last challenge is answered
   - Navigate to `/lesson/end` on completion

3. **Add Celebrations**
   - Add SFX methods to `use-sfx.ts`
   - Add confetti variants to end screens
   - Add celebration animations

4. **Test Everything**
   - Run manual test checklist
   - Verify idempotency
   - Test refresh handling
   - Test all 3 completion types

5. **Run Migration**
   - Push schema changes to database
   - Verify tables created correctly

---

## 🚀 Deployment Readiness

**Before Deployment:**

- [ ] All manual tests passing
- [ ] Database migration successful
- [ ] No console errors
- [ ] Mobile layout tested
- [ ] Reduced motion support verified

**Status:** Not ready for deployment (60% complete)

---

## 📝 Notes

- The existing `LessonEndScreen` component can be refactored/replaced with the new components
- Current end screen logic in `challenge.tsx` should be removed and replaced with navigation to `/lesson/end`
- Economy Service integration ensures no double rewards
- Milestone persistence ensures consistent UI after refresh
- All server logic is authoritative (no client-side guessing)
