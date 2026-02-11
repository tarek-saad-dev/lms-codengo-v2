# Codengo LMS — Comprehensive Performance Audit

> Generated: Feb 11, 2026
> Auditor: Senior Web Performance Engineer

---

## 1) Executive Summary

| # | Bottleneck | Impact | Effort |
|---|-----------|--------|--------|
| 1 | **Massive over-fetching in `getCourseProgress()` and `getUnits()`** — loads entire course tree (units→lessons→challenges→options→progress) on every `/learn` load | **Critical** — adds 500ms–2s+ TTFB per page load | Medium |
| 2 | **Challenge component bundles ALL 13 challenge types eagerly** (591 lines, imports CodeMirror, StackBlitz SDK, PDF viewer, react-player, etc.) | **Critical** — estimated 800KB–1.5MB JS shipped to client for every lesson | Medium |
| 3 | **No DB indexes on hot query columns** (userId+challengeId on challenge_progress, courseId on units, etc.) | **High** — every query does full table scans | Low |
| 4 | **Neon HTTP driver (stateless)** — every DB call is a separate HTTP request, no connection reuse | **High** — adds 30–80ms RTT per query, compounds with N+1 | Low |
| 5 | **Redundant `getUserProgress()` calls** — `/learn` triggers it 4+ times across chained query functions | **Medium** — wasteful even with React `cache()` within same request | Medium |

**Expected combined impact of fixing all 5:** 60–80% reduction in page load time for `/learn` and `/lesson` routes, 50%+ reduction in JS bundle for lesson pages.

---

## 2) Measurement & Evidence Plan

### 2a. Web Vitals

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
# export default withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

**Lighthouse:** Run against `/learn`, `/lesson`, `/courses`, `/leaderboard` in Incognito mode.

**Target metrics:**
- LCP < 1.5s
- INP < 200ms
- CLS < 0.1
- TTFB < 400ms
- FCP < 1.0s

### 2b. Server Timing Instrumentation

Add to `middleware.ts`:
```ts
// Add Server-Timing header for every request
response.headers.set('Server-Timing', `middleware;dur=${Date.now() - start}`);
```

### 2c. DB Query Timing

Add a timing wrapper in `db/drizzle.ts`:
```ts
// Wrap queries with timing logs
const startTime = performance.now();
// ... query ...
const duration = performance.now() - startTime;
if (duration > 100) {
  console.warn(`[SLOW_QUERY] ${queryName}: ${duration.toFixed(0)}ms`);
}
```

### 2d. N+1 Detection

Add temporary logging at the top of each query function in `db/queries.ts`:
```ts
console.log(`[QUERY] getUserProgress() called at ${new Date().toISOString()}`);
```
Then load `/learn` once and count how many times each query fires per request.

---

## 3) Frontend Performance Findings & Fixes

### 3a. CRITICAL: Challenge Component Bundle Size

**Problem:** `challenge.tsx` eagerly imports ALL 13 challenge types:

```
File: app/lesson/challenge.tsx (lines 1-33)
Imports: CodeMirror, StackBlitz SDK, react-pdf-viewer, react-player, 
         framer-motion, react-confetti, react-markdown, etc.
```

Every lesson page ships JS for ALL challenge types even if only 1 type (e.g. SELECT) is used.

**Estimated bundle cost per import:**
- `@monaco-editor/react` / CodeMirror: ~300KB
- `@stackblitz/sdk`: ~150KB
- `@react-pdf-viewer/*` (5 packages): ~400KB
- `react-player`: ~100KB
- `react-confetti`: ~30KB
- `framer-motion`: ~120KB
- `react-markdown` + plugins: ~80KB

**Fix: Dynamic import heavy challenge types:**

```tsx
// app/lesson/challenge.tsx — BEFORE
import { CodeChallenge } from "./code-challenge";
import { PdfChallenge } from "./pdf-challenge";
import { VideoChallenge } from "./video-challenge";
import ProjectV3Challenge from "./projectv3-challenge";
import { WriteChallenge } from "./write-challenge";
import { WebView } from "./web-view";
import { AudioChallenge } from "./audio-challenge";

// AFTER — dynamic imports
import dynamic from 'next/dynamic';

const CodeChallenge = dynamic(() => import("./code-challenge").then(m => ({ default: m.CodeChallenge })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>,
  ssr: false
});
const PdfChallenge = dynamic(() => import("./pdf-challenge").then(m => ({ default: m.PdfChallenge })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>,
  ssr: false
});
const VideoChallenge = dynamic(() => import("./video-challenge").then(m => ({ default: m.VideoChallenge })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>,
  ssr: false
});
const ProjectV3Challenge = dynamic(() => import("./projectv3-challenge"), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>,
  ssr: false
});
const AudioChallenge = dynamic(() => import("./audio-challenge").then(m => ({ default: m.AudioChallenge })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>,
  ssr: false
});
const WebView = dynamic(() => import("./web-view").then(m => ({ default: m.WebView })), {
  ssr: false
});

// Keep lightweight ones static:
import { TextChallenge } from "./text-challenge";
import { ImageChallenge } from "./image-challenge";
import { MultiChoices } from "./multible-choice";
import { CompleteChallenge } from "./complete-challenge";
```

**Impact: HIGH** — saves 500KB–1MB JS on initial lesson load.

### 3b. Duplicate Toast Libraries

**Problem:** Two toast libraries installed and loaded:
- `react-hot-toast` in `components/providers/ClientProviders.tsx`
- `sonner` used throughout components

**Fix:** Remove `react-hot-toast`, keep `sonner` only.

```bash
npm uninstall react-hot-toast
```

Update `ClientProviders.tsx`:
```tsx
"use client";
import { Toaster } from "sonner";

export default function ClientProviders({ children }) {
  return (
    <>
      <Toaster position="top-center" richColors />
      {children}
    </>
  );
}
```

**Impact: LOW-MEDIUM** — saves ~15KB.

### 3c. Unused/Heavy Dependencies

**Problem packages to audit:**

| Package | Size | Used? | Action |
|---------|------|-------|--------|
| `react-admin` + `ra-*` | ~500KB+ | Likely admin only | Move to separate admin app or lazy load |
| `axios` | ~30KB | Can use native fetch | Remove, use fetch |
| `react-icons` | ~150KB if not tree-shaken | Check usage | Replace with `lucide-react` (already used) |
| `react-iframe` | ~5KB | Unnecessary | Use native `<iframe>` |
| `@react-pdf/renderer` | ~200KB | PDF generation? | Audit if needed |
| `react-pdf` | ~100KB | Duplicate with @react-pdf-viewer | Remove one |
| `pdfjs-dist` | ~300KB | Dependency of pdf viewers | Only 1 viewer needed |

**Fix:** Run `npm ls react-admin` to check if it's actually imported. If only in `/admin` route, ensure it's dynamically imported.

### 3d. Font Loading

**File: `app/layout.tsx:10`**
```tsx
const font = Nunito({ subsets: ["latin"] });
```

This is correct — using `next/font` ✅. But also in `globals.css:116`:
```css
body { font-family: Arial, Helvetica, sans-serif; }
```

This **overrides** the Nunito font! The body rule in globals.css fights with the className from next/font.

**Fix:** Remove the conflicting rule:
```css
/* DELETE this line from globals.css:116 */
/* body { font-family: Arial, Helvetica, sans-serif; } */
```

### 3e. Animations: `framer-motion` on Critical Path

**Problem:** `framer-motion` (~120KB) is imported in:
- `challenge.tsx` (lesson celebration)
- `code-challenge.tsx`
- `pdf-challenge.tsx`
- `lesson-celebration.tsx`

For simple fade/slide animations, this is overkill on the critical path.

**Fix options:**
1. **Best:** Replace simple animations with CSS animations (already have `animate-fade-in` in globals.css)
2. **OK:** Keep framer-motion but ensure it's only in dynamically imported components

### 3f. `useAudio` Loads 3 Audio Files on Every Lesson Mount

**File: `challenge.tsx:67-78`**
```tsx
const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: true });
const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
const [incorrectAudio, _i, incorrectControls] = useAudio({ src: "/incorrect.wav" });
const [audio, controls] = useAudio({ src: "/correct.wav" }); // DUPLICATE!
```

**Problems:**
1. `finishAudio` with `autoPlay: true` plays on EVERY mount (including first challenge!)
2. Fourth `useAudio` is a duplicate of `correctAudio`
3. All 3 audio files download immediately on page load

**Fix:**
```tsx
// Remove duplicate (line 78)
// const [audio, controls] = useAudio({ src: "/correct.wav" }); // DELETE

// Load audio lazily — only preload when near completion
// Or use Audio API directly instead of useAudio
```

### 3g. `react-use` Import Weight

**Problem:** `import { useAudio, useWindowSize, useMount } from "react-use"` — if not tree-shaken properly, this pulls in the entire library (~50KB).

**Fix:** Import from specific paths:
```tsx
import useAudio from 'react-use/lib/useAudio';
import useWindowSize from 'react-use/lib/useWindowSize';
import useMount from 'react-use/lib/useMount';
```

### 3h. `globals.css` Has Duplicate `@layer base` Blocks

**File: `app/globals.css:125-188` and `192-199`** — two separate `@layer base` blocks with duplicate `*` and `body` rules.

**Fix:** Merge into one block and remove duplicates.

---

## 4) Backend + Server Actions Performance Findings & Fixes

### 4a. CRITICAL: Redundant `getUserProgress()` Calls Chain

**Trace for `/learn` page load:**

```
LearnPage calls:
  1. getUserProgress()          → DB query #1
  2. getCourseProgress()        → calls getUserProgress() internally → DB query #2 (cached by React)
                                → then does MASSIVE units query → DB query #3
  3. getLessonPercentage()      → calls getCourseProgress() → calls getUserProgress() again
                                → then calls getLesson() → calls getCourseProgress() AGAIN
                                → then does lesson query → DB query #4
  4. getUnits()                 → calls getUserProgress() → DB query #5 (cached)
                                → then does units query → DB query #6
```

Even with React `cache()`, this creates **redundant function call overhead** and the chained calls create sequential waterfalls within each function.

**Fix: Pass data down instead of re-fetching:**

```ts
// db/queries.ts — NEW: Accept pre-fetched data
export const getCourseProgressWithData = cache(async (
  userId: string,
  activeCourseId: number
) => {
  // Skip getUserProgress() call — data already available
  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            // DON'T load quizOptions/wordOptions here!
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
  // ... rest of logic
});
```

### 4b. CRITICAL: `getCourseProgress()` Over-fetches quizOptions + wordOptions

**File: `db/queries.ts:135-183`**

```ts
// This loads quizOptions and wordOptions for EVERY challenge
// just to find the first uncompleted lesson!
challenges: {
  with: {
    quizOptions: { orderBy: ... },    // NOT NEEDED HERE
    wordOptions: { orderBy: ... },    // NOT NEEDED HERE
    challengeProgress: { where: ... }, // Only this is needed
  },
},
```

**Fix:** Remove `quizOptions` and `wordOptions` from `getCourseProgress()`:
```ts
challenges: {
  with: {
    challengeProgress: {
      where: eq(challengeProgress.userId, userId),
    },
    // REMOVE quizOptions and wordOptions — not needed to find first uncompleted lesson
  },
},
```

**Impact: HIGH** — reduces payload by 50-80% and query time significantly.

### 4c. CRITICAL: `getUserCourses()` Loads Everything Twice

**File: `actions/get-user-courses.ts:8-72`**

This action:
1. Loads active course with full tree (units→lessons→challenges→progress) — Query #1
2. Loads ALL courses with full tree (units→lessons→challenges→progress) — Query #2

The first query's data is a subset of the second. This is a massive waste.

**Fix:** Single query, calculate active from results:
```ts
export const getUserCourses = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!progress) return { activeCourse: null, courses: [] };

  // ONE query with only the data needed for progress calculation
  const allCourses = await db.query.courses.findMany({
    where: (courses) => or(eq(courses.type, "GLOBAL"), eq(courses.makerId, userId)),
    with: {
      units: {
        with: {
          lessons: {
            with: {
              challenges: {
                columns: { id: true }, // Only need ID for counting
                with: {
                  challengeProgress: {
                    where: eq(challengeProgress.userId, userId),
                    columns: { completed: true }, // Only need completed flag
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // ... calculate progress from single result set
};
```

### 4d. `reduceHearts()` Does 3 Sequential DB Calls

**File: `actions/user-progress.ts:62-129`**

```
1. auth()                    → Clerk API call
2. getUserProgress()         → DB query (user_progress + course join)
3. challenges.findFirst()    → DB query (just to get lessonId)
4. challengeProgress.findFirst() → DB query
5. userProgress.update()     → DB write
```

**Fix:** Combine queries 3+4 into one, or pass `lessonId` from the client (it's already known):

```ts
// Client already has lessonId — pass it
export const reduceHearts = async (challengeId: number, lessonId: number) => {
  // Skip the challenges.findFirst() query — we already know lessonId
  // Combine getUserProgress + challengeProgress check into parallel calls
  const [currentUserProgress, existingProgress] = await Promise.all([
    getUserProgress(),
    db.query.challengeProgress.findFirst({
      where: and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.challengeId, challengeId),
      ),
    }),
  ]);
  // ... rest
};
```

### 4e. `upsertChallengeProgress()` Same Issue — 5 Sequential DB Calls

**File: `actions/challenge-progress.ts:16-128`**

Same pattern: auth → getUserProgress → challenges.findFirst → challengeProgress.findFirst → insert/update.

**Fix:** Same approach — pass `lessonId` from client, parallelize independent queries.

### 4f. `getLeaderboard()` Has No Pagination

**File: `actions/get-leaderboard.ts:11-13`**

```ts
const users = await db.query.userProgress.findMany({
  orderBy: [desc(userProgress.points)],
}); // Loads ALL users!
```

**Fix:**
```ts
const users = await db.query.userProgress.findMany({
  orderBy: [desc(userProgress.points)],
  limit: 100, // Or paginate
  columns: {
    userId: true,
    userName: true,
    points: true,
    userImageSrc: true,
  },
});
```

### 4g. Shop Page is Fully Client-Side with Waterfall

**File: `app/(main)/shop/page.tsx:1`** — `"use client"` at the top.

This means:
1. Page JS downloads
2. React hydrates
3. `useEffect` fires
4. `getShopData()` server action call
5. UI updates

**Fix:** Make it a Server Component with client islands:

```tsx
// app/(main)/shop/page.tsx — Server Component
import { getShopData } from "@/actions/shop";
import { ShopClient } from "./shop-client";

export default async function ShopPage() {
  const data = await getShopData();
  return <ShopClient initialCoins={data?.coins ?? 0} initialHearts={data?.hearts ?? 0} />;
}
```

---

## 5) Database & Query Optimization

### 5a. Missing Indexes (CRITICAL)

Based on schema and query patterns, these indexes are missing:

```sql
-- Most critical: used in EVERY lesson/challenge query
CREATE INDEX idx_challenge_progress_user_challenge 
  ON challenge_progress (user_id, challenge_id);

-- Used by getUnits(), getCourseProgress()
CREATE INDEX idx_units_course_id_order 
  ON units (course_id, "order");

-- Used by every lesson query
CREATE INDEX idx_lessons_unit_id_order 
  ON lessons (unit_id, "order");

-- Used by every challenge query
CREATE INDEX idx_challenges_lesson_id_order 
  ON challenges (lesson_id, "order");

-- Used by getCourses()
CREATE INDEX idx_courses_type 
  ON courses (type);

-- Used by getCourses() for custom courses
CREATE INDEX idx_courses_maker_id 
  ON courses (maker_id);

-- Used by quiz option loading
CREATE INDEX idx_quiz_options_challenge_id 
  ON quiz_options (challenge_id);

-- Used by word option loading
CREATE INDEX idx_word_options_challenge_id 
  ON word_options (challenge_id);

-- Used by leaderboard
CREATE INDEX idx_user_progress_points 
  ON user_progress (points DESC);
```

**Impact: HIGH** — without these, every relational query does sequential scans.

### 5b. N+1 Query Pattern in `getUnits()`

**File: `db/queries.ts:68-86`**

Drizzle's `with` clause uses the relational query builder which issues multiple queries under the hood. For a course with 5 units × 5 lessons × 5 challenges, that's potentially:
- 1 query for units
- 5 queries for lessons (one per unit)
- 25 queries for challenges (one per lesson)
- 25 queries for challengeProgress (one per challenge)
= **56 queries** for one page load!

**Fix:** With proper indexes (5a) this is somewhat mitigated. For further optimization, use raw SQL join:

```ts
// Alternative: single query with joins
const result = await db.execute(sql`
  SELECT u.*, l.*, c.*, cp.*
  FROM units u
  LEFT JOIN lessons l ON l.unit_id = u.id
  LEFT JOIN challenges c ON c.lesson_id = l.id
  LEFT JOIN challenge_progress cp ON cp.challenge_id = c.id AND cp.user_id = ${userId}
  WHERE u.course_id = ${activeCourseId}
  ORDER BY u."order", l."order", c."order"
`);
```

### 5c. `challenges` Table Has Many Nullable TEXT Columns

Every challenge row carries: `textContent`, `imageContent`, `videoURL`, `pdfURL`, `audioURL`, `initialCode`, `language`, `instructions`, `testCases`, `timeLimit`, `memoryLimit`, `completeQuestion`, `projectStructure`, `projectFiles`, `projectTestCases`, `testSetup`, `testTeardown`, `webViewContent`.

Most of these are NULL for any given challenge type, but they're all fetched every time.

**Fix:** Use column selection in queries:
```ts
// Only fetch columns needed for the list view
challenges: {
  columns: {
    id: true,
    lessonId: true,
    type: true,
    label: true,
    order: true,
  },
  with: {
    challengeProgress: { ... }
  }
}
```

Only fetch full challenge data in `getLesson()` where it's actually rendered.

---

## 6) Next.js Caching Strategy

### Current State: No caching strategy exists.

### Proposed Strategy:

| Route | Strategy | Revalidation |
|-------|----------|-------------|
| `/` (marketing) | **Static** | On deploy |
| `/courses` | **ISR 60s** for course list; user progress is dynamic | `revalidateTag('courses')` |
| `/learn` | **Dynamic** (per-user) | `revalidateTag('user-progress')` after mutations |
| `/lesson`, `/lesson/[id]` | **Dynamic** (per-user) | On challenge completion |
| `/leaderboard` | **ISR 30s** | `revalidateTag('leaderboard')` |
| `/shop` | **Server Component** + client islands | After purchase |

### Implementation:

```ts
// app/(main)/leaderboard/page.tsx
export const revalidate = 30; // ISR: regenerate every 30 seconds

// In server actions, use tags instead of paths:
import { revalidateTag } from 'next/cache';

// actions/challenge-progress.ts
revalidateTag('user-progress');
revalidateTag('course-progress');

// Instead of:
// revalidatePath("/learn");
// revalidatePath("/lesson");
// revalidatePath(`/lesson/${lessonId}`);
```

### Cache-safe pattern for queries:

```ts
// db/queries.ts
export const getUnits = cache(async () => {
  // React cache() deduplicates within a single server request
  // This is already correct ✅
  // But add unstable_cache for cross-request caching:
});

import { unstable_cache } from 'next/cache';

export const getCoursesList = unstable_cache(
  async () => {
    return db.query.courses.findMany({
      where: eq(courses.type, "GLOBAL"),
    });
  },
  ['global-courses'],
  { revalidate: 300, tags: ['courses'] }
);
```

---

## 7) Network & Deployment

### 7a. Neon Serverless: HTTP Driver Latency

**Current:** `db/drizzle.ts` uses `neon-http` driver:
```ts
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
```

This creates a new HTTP connection for EVERY query. Each has ~30-80ms overhead.

**Fix:** Switch to WebSocket driver for connection reuse:

```ts
// db/drizzle.ts — OPTIMIZED
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export default db;
```

```bash
# No new dependency needed — @neondatabase/serverless already installed
# Just change the import and driver
```

**Impact: HIGH** — saves 30-80ms per query, compounds across multiple queries per request.

### 7b. Neon Connection Pooling

Enable Neon's built-in connection pooler in your Neon dashboard:
- Go to Project Settings → Connection Pooling → Enable
- Use the pooled connection string (port 5432 → 6543)

### 7c. Middleware Overhead

**Current:** Clerk middleware runs on EVERY request including static assets.

The matcher already excludes static files ✅, but verify Clerk's middleware isn't adding latency to public pages.

### 7d. Missing Compression Headers

**Fix:** Add to `next.config.ts`:
```ts
compress: true, // Enable gzip/brotli compression
```

### 7e. Image Optimization

Currently no `next/image` usage detected in main pages. Leaderboard uses `<Avatar>` with external Clerk images.

**Fix:** Ensure `next/image` with proper `sizes` for responsive loading:
```tsx
<Image
  src={user.avatar}
  alt={user.name}
  width={128}
  height={128}
  sizes="(max-width: 768px) 64px, 128px"
  priority={index < 3} // Prioritize top 3
/>
```

---

## 8) Priority Roadmap

### Phase 1: Quick Wins (1-2 days)

| # | Fix | Why Slow | Steps | Impact | Risk | Verify |
|---|-----|----------|-------|--------|------|--------|
| 1.1 | **Add DB indexes** | Every query does full table scans | Run the SQL from section 5a | HIGH | LOW | Check query times in Neon dashboard |
| 1.2 | **Remove quizOptions/wordOptions from getCourseProgress()** | Fetches 50-80% unnecessary data | Remove 2 lines from `db/queries.ts:152-157` | HIGH | LOW | Measure TTFB on `/learn` |
| 1.3 | **Switch to Neon WebSocket pool driver** | HTTP overhead per query | Change 3 lines in `db/drizzle.ts` | HIGH | LOW | Measure TTFB across all pages |
| 1.4 | **Remove duplicate audio useAudio** | Extra download + memory | Delete line 78 in `challenge.tsx` | LOW | LOW | Check network tab |
| 1.5 | **Remove react-hot-toast** | Duplicate toast library | Uninstall + update ClientProviders | LOW | LOW | Bundle size check |
| 1.6 | **Fix font override in globals.css** | Nunito font not loading correctly | Delete line 116 in `globals.css` | LOW | LOW | Visual check |
| 1.7 | **Add `limit` to leaderboard query** | Loads ALL users | Add `limit: 100` | MEDIUM | LOW | Check page load time |

### Phase 2: Medium Changes (3-5 days)

| # | Fix | Why Slow | Steps | Impact | Risk | Verify |
|---|-----|----------|-------|--------|------|--------|
| 2.1 | **Dynamic import heavy challenge types** | 800KB+ JS for every lesson | Convert 6 imports to `dynamic()` in `challenge.tsx` | HIGH | MEDIUM | Bundle analyzer |
| 2.2 | **Pass lessonId to server actions** | Extra DB query per action | Update `reduceHearts` and `upsertChallengeProgress` signatures | MEDIUM | MEDIUM | Check query count |
| 2.3 | **Parallelize server action queries** | Sequential DB calls | Use `Promise.all` for independent queries | MEDIUM | LOW | Server timing |
| 2.4 | **Make Shop a Server Component** | Client waterfall on load | Split into server + client components | MEDIUM | LOW | Measure TTFB |
| 2.5 | **Add column selection to list queries** | Over-fetching challenge columns | Add `columns: {}` to Drizzle queries | MEDIUM | LOW | Payload size |
| 2.6 | **Audit and remove unused dependencies** | Bundle bloat | Check react-admin, axios, react-icons, react-iframe usage | MEDIUM | MEDIUM | Bundle size |
| 2.7 | **Use specific react-use imports** | Pulls entire library | Change to `react-use/lib/useX` | LOW | LOW | Bundle check |

### Phase 3: Architecture Improvements (1-2 weeks)

| # | Fix | Why Slow | Steps | Impact | Risk | Verify |
|---|-----|----------|-------|--------|------|--------|
| 3.1 | **Rewrite getCourseProgress with single SQL join** | N+1 queries | Write raw SQL or optimize Drizzle query | HIGH | HIGH | Query count + timing |
| 3.2 | **Implement revalidateTag strategy** | No cross-request caching | Add tags to queries, use `unstable_cache` | HIGH | MEDIUM | Cache hit rate |
| 3.3 | **Add ISR to leaderboard** | Fresh query every visit | Add `export const revalidate = 30` | MEDIUM | LOW | TTFB |
| 3.4 | **Eliminate chained getUserProgress() calls** | Redundant function calls | Restructure query functions to accept params | MEDIUM | MEDIUM | Query count |
| 3.5 | **Separate challenge data loading** | Full blob per challenge | Load challenge metadata in list, full data on demand | MEDIUM | HIGH | Payload size |
| 3.6 | **Add React Query for client-side cache** | Hearts/XP refetch after mutations | Add optimistic updates for hearts/XP | MEDIUM | MEDIUM | UX smoothness |
| 3.7 | **Prefetch next lesson data** | Cold load on navigation | Add `router.prefetch` + data prefetching | MEDIUM | LOW | Navigation timing |

---

## 9) Code-Level Suggestions

### 9.1 — DB Indexes (Run in Neon SQL Editor)

```sql
-- Run this in your Neon dashboard SQL editor:
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_challenge ON challenge_progress (user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_units_course_id_order ON units (course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id_order ON lessons (unit_id, "order");
CREATE INDEX IF NOT EXISTS idx_challenges_lesson_id_order ON challenges (lesson_id, "order");
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses (type);
CREATE INDEX IF NOT EXISTS idx_courses_maker_id ON courses (maker_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_challenge_id ON quiz_options (challenge_id);
CREATE INDEX IF NOT EXISTS idx_word_options_challenge_id ON word_options (challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_points ON user_progress (points DESC);
```

### 9.2 — Fix `db/drizzle.ts`

```ts
// BEFORE:
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
export default db;

// AFTER:
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });
export default db;
```

### 9.3 — Fix `getCourseProgress()` Over-fetching

```ts
// db/queries.ts — getCourseProgress()
// REMOVE these lines (152-157):
//   quizOptions: {
//     orderBy: (quizOptions, { asc }) => [asc(quizOptions.id)]
//   },
//   wordOptions: {
//     orderBy: (wordOptions, { asc }) => [asc(wordOptions.order)]
//   },
```

### 9.4 — Fix `globals.css` Duplicate Blocks and Font Override

```css
/* DELETE line 116: */
/* body { font-family: Arial, Helvetica, sans-serif; } */

/* MERGE the two @layer base blocks (lines 125-188 and 192-199) into one */
```

### 9.5 — Leaderboard Pagination

```ts
// actions/get-leaderboard.ts
export const getLeaderboard = async (limit = 50, offset = 0) => {
  const { userId: currentUserId } = await auth();

  const users = await db.query.userProgress.findMany({
    orderBy: [desc(userProgress.points)],
    limit,
    offset,
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
    rank: offset + index + 1,
    avatar: user.userImageSrc,
    streak: 0,
    courses: 0,
    isCurrentUser: user.userId === currentUserId,
  }));
};
```

---

## Summary of Expected Gains

| Metric | Current (estimated) | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|-------------------|---------------|---------------|---------------|
| `/learn` TTFB | 2-4s | 0.8-1.5s | 0.5-0.8s | 0.3-0.5s |
| `/lesson` JS Bundle | 1.2-2MB | 1.2-2MB | 400-600KB | 400-600KB |
| DB queries per `/learn` | 30-50+ | 15-25 | 8-12 | 3-5 |
| Leaderboard load | 1-3s (all users) | 0.3-0.5s | 0.3-0.5s | <0.1s (cached) |
| INP (lesson interaction) | 300-500ms | 200-300ms | 100-200ms | <100ms |

---

## Appendix: Route → Data Dependency Map

```
/ (marketing)
  └── Static, no data

/courses
  ├── getCourses() → courses table
  └── getUserProgress() → user_progress + courses join

/learn (HEAVIEST PAGE)
  ├── getUserProgress() → user_progress + courses join
  ├── getUnits() → getUserProgress() → units → lessons → challenges → challengeProgress
  ├── getCourseProgress() → getUserProgress() → units → lessons → challenges → [quizOptions, wordOptions, challengeProgress]
  └── getLessonPercentage() → getCourseProgress() → getLesson() → getCourseProgress() → lesson → challenges → [quizOptions, wordOptions, challengeProgress]

/lesson
  ├── getLesson() → getCourseProgress() → getUserProgress() → lesson → challenges → [quizOptions, wordOptions, challengeProgress]
  └── getUserProgress() → user_progress + courses join

/lesson/[id]
  ├── getLesson(id) → getCourseProgress() → getUserProgress() → lesson → challenges → [quizOptions, wordOptions, challengeProgress]
  └── getUserProgress() → user_progress + courses join

/leaderboard
  └── getLeaderboard() → ALL user_progress rows (no limit!)

/shop (client component)
  └── getShopData() → getUserProgress() (called in useEffect = waterfall)

/profile
  └── getUserCourses() → user_progress + ALL courses with FULL tree (×2 queries!)
```
