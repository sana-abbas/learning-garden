-- ============================================================================
-- Graduates — let the mentor dashboard know who Notion says has graduated.
--
-- Notion's Status ("Graduated", "Enrolled", "Paused", …) is the system of
-- record, mirrored into notion_participants by the sync function. That table
-- is founder-only, so until now the mentor dashboard could not tell a graduate
-- from anyone else, and graduates sat among the active participants' cards and
-- on every attendance list.
--
-- This exposes only the Status, and only for people who have used the garden,
-- to mentors and founders. Nothing is written: graduating someone is still
-- done in Notion, and shows up here after the next sync.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR. Safe to re-run. Needs is_mentor() from
-- 2026-10-15-attendance.sql.
-- ============================================================================

begin;

create or replace function public.participant_statuses()
returns table (user_id uuid, status text)
language sql
security definer
set search_path = public
stable
as $$
  select up.user_id, np.status
    from user_progress up
    join notion_participants np on lower(np.email) = lower(up.email)
   where np.status is not null
     and (public.is_mentor() or public.is_founder());
$$;

revoke all on function public.participant_statuses() from public, anon;
grant execute on function public.participant_statuses() to authenticated;

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- In the SQL editor (no signed-in user) this returns nothing by design. Check
-- the data it reads instead — garden users Notion marks as graduated:
--   select up.email, np.status
--     from user_progress up
--     join notion_participants np on lower(np.email) = lower(up.email)
--    where np.status = 'Graduated';
