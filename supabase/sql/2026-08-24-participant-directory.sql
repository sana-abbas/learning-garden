-- ============================================================================
-- cohort_directory() — let participants see each other's names.
--
-- The problem: the community feed showed "Someone" instead of names for Full
-- Stack participants. Two causes:
--
--   1. 114 of 251 Full Stack daily_updates rows had a null display_name (they
--      predate the fix in 9a099d8). Fixed by the backfill at the bottom.
--
--   2. The fallback path could never work. It reads names from user_progress,
--      whose policies are "own row only" plus mentors — correctly so, since
--      that table holds emails, private reflections and submissions. A
--      participant therefore resolves nobody's name but their own.
--
-- Rather than opening up user_progress, this exposes only the two things the
-- community features need, through a function rather than a view:
--
--   * a view with security_invoker = false trips Supabase's SECURITY DEFINER
--     advisor warning, and bypasses RLS for every signed-in user across both
--     cohorts;
--   * this function bypasses it only for the caller's own cohort, so a Full
--     Stack participant cannot read CF names or progress (mentors still see
--     everyone, since they preview both gardens).
--
-- Emails, notes and submissions stay closed either way. Anything added to the
-- returned columns becomes readable by every participant in the cohort, so add
-- nothing without meaning to.
--
-- Safe to re-run.
-- ============================================================================

begin;

-- Supersedes the earlier view-based version, if it was applied.
drop view if exists public.participant_directory;

create or replace function public.cohort_directory()
returns table (user_id uuid, display_name text, checked jsonb)
language sql
security definer
set search_path = public
stable
as $$
  select up.user_id::uuid,
         up.display_name::text,
         up.checked::jsonb          -- drives the CF "chapters completed" ranking
    from public.user_progress up
   where auth.uid() is not null
     and (
       -- Mentors preview both gardens, so they see everyone.
       exists (select 1 from public.mentors m where m.user_id = auth.uid())
       -- Participants see only their own cohort.
       or exists (
         select 1
           from public.cohort_members me
           join public.cohort_members them on them.cohort_id = me.cohort_id
          where me.user_id = auth.uid()
            and them.user_id = up.user_id
       )
     );
$$;

revoke all on function public.cohort_directory() from public, anon;
grant execute on function public.cohort_directory() to authenticated;

-- ── Backfill the missing names on historic updates ──────────────────────────
-- The other half of the same bug. Only touches rows that are still null, so
-- re-running is a no-op.
update public.daily_updates du
   set display_name = up.display_name
  from public.user_progress up
 where up.user_id = du.user_id
   and du.display_name is null
   and up.display_name is not null;

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- missing_name should be ~0 for both cohorts:
--   select c.slug,
--          count(*) filter (where du.display_name is null) as missing_name,
--          count(*) as total
--     from daily_updates du
--     join cohort_members cm on cm.user_id = du.user_id
--     join cohorts c on c.id = cm.cohort_id
--    group by c.slug;
--
-- Run as a signed-in participant this returns their cohort; run in the SQL
-- editor (no auth.uid()) it correctly returns nothing:
--   select count(*) from cohort_directory();
