-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Phase 1 Database Indexes
-- ============================================================================
-- Purpose: Add indexes to hot query columns to eliminate full table scans
-- Impact: Expected 50-80% reduction in query execution time
-- Safety: All indexes use IF NOT EXISTS - safe to run multiple times
-- 
-- HOW TO RUN:
-- 1. Open your Neon Dashboard (https://console.neon.tech)
-- 2. Navigate to your project → SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute all statements
-- 5. Verify success: All statements should return "CREATE INDEX" or "NOTICE: relation already exists"
-- ============================================================================

-- CRITICAL: Challenge progress lookups (used in EVERY lesson/challenge query)
-- Composite index for user-specific challenge progress queries
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_challenge 
  ON challenge_progress (user_id, challenge_id);

-- Used by getUnits(), getCourseProgress() - course → units lookup with ordering
CREATE INDEX IF NOT EXISTS idx_units_course_id_order 
  ON units (course_id, "order");

-- Used by lesson queries - unit → lessons lookup with ordering
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id_order 
  ON lessons (unit_id, "order");

-- Used by challenge queries - lesson → challenges lookup with ordering
CREATE INDEX IF NOT EXISTS idx_challenges_lesson_id_order 
  ON challenges (lesson_id, "order");

-- Used by getCourses() - filter courses by type (GLOBAL vs CUSTOMIZE)
CREATE INDEX IF NOT EXISTS idx_courses_type 
  ON courses (type);

-- Used by getUserCourses() - filter custom courses by creator
CREATE INDEX IF NOT EXISTS idx_courses_maker_id 
  ON courses (maker_id);

-- Used by quiz option loading in getLesson()
CREATE INDEX IF NOT EXISTS idx_quiz_options_challenge_id 
  ON quiz_options (challenge_id);

-- Used by word option loading in getLesson() for COMPLETE/WRITE challenges
CREATE INDEX IF NOT EXISTS idx_word_options_challenge_id 
  ON word_options (challenge_id);

-- Used by leaderboard - sort users by points descending
CREATE INDEX IF NOT EXISTS idx_user_progress_points 
  ON user_progress (points DESC);

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run after index creation)
-- ============================================================================
-- Check that indexes were created successfully:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
--
-- Verify index usage on a sample query:
-- EXPLAIN ANALYZE SELECT * FROM challenge_progress WHERE user_id = 'user_xxx' AND challenge_id = 1;
-- Look for "Index Scan" instead of "Seq Scan" in the output
-- ============================================================================
