-- ============================================================================
-- Hints — remember how many hints each participant opened per exercise.
--
-- The TermBank final project (CF chapter cf17) reveals its hints one at a
-- time. Each reveal bumps a counter, keyed by subtask id, e.g.
-- {"cf17-m4": 2}. Mentors see the counts next to submissions, so they can tell
-- who found a milestone hard.
--
-- A column on user_progress rather than a table of its own: it is per person,
-- read alongside the rest of their progress, and the existing row policies
-- (participants write their own row, mentors and founders read all) already
-- cover it.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR. Safe to re-run. Until it has run, the
-- garden works as before and hint counts are simply not saved.
-- ============================================================================

alter table public.user_progress
  add column if not exists hints jsonb not null default '{}'::jsonb;
