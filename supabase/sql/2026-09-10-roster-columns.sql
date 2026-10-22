-- ============================================================================
-- Roster columns: drop the workshops, add Job Status.
--
-- Two changes to the mirrored Notion roster, in one script so there is one
-- thing to run:
--
--   1. The ~25 workshop checkboxes have been deleted from Notion, and the
--      dashboard no longer shows the attendance panel or the CSV column, so
--      the three columns that mirrored them go.
--   2. Notion gained a "Job Status" select — Working / Not Working /
--      Not in touch — which the dashboard reports on. Blank is a real and
--      common fourth state meaning "not recorded yet", NOT "no job", so
--      nothing here defaults it.
--
-- Nothing is lost by dropping the workshop columns: notion_participants.raw
-- still holds every property Notion returned on each sync, so any attendance
-- that was captured is still in JSON if it is ever wanted back.
--
-- Note on ordering: founder_roster() returns these columns, so the function
-- has to be dropped before the columns can change. It is recreated below.
-- Everything is in one transaction, so the dashboard never sees a half-applied
-- state — but the roster query does fail for the second or two the transaction
-- is open. Run it when nobody is staring at the dashboard.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR, then redeploy the sync function so it
-- starts writing job_status:
--   supabase functions deploy sync-notion-participants --no-verify-jwt
--
-- Safe to re-run, and safe whether or not the earlier workshops-only version
-- of this script was ever applied.
-- ============================================================================

begin;

-- The return type changes, so this cannot be a create-or-replace.
drop function if exists public.founder_roster();

alter table public.notion_participants
  drop column if exists workshops,
  drop column if exists workshops_done,
  drop column if exists workshops_total;

-- Notion "Job Status". Left nullable on purpose: null means nobody has
-- recorded an outcome for this person yet, which the dashboard reports
-- separately from "Not Working".
alter table public.notion_participants
  add column if not exists job_status text;

-- Recreated from 2026-09-09-founder-dashboard.sql, minus the workshop columns
-- and plus job_status. If you change one, change both.
create or replace function public.founder_roster()
returns table (
  notion_page_id    text,
  notion_page_url   text,
  full_name         text,
  email             text,
  country           text,
  track             text,
  status            text,
  start_date        date,
  mentor            text,
  paid_project_1    text,
  paid_project_2    text,
  job_status        text,
  user_id           uuid,
  app_cohort        text,
  display_name      text,
  avatar_url        text,
  checked           jsonb,
  submissions_count integer,
  notes_count       integer,
  streak_count      integer,
  joined_app_at     timestamptz,
  last_active       timestamptz,
  updates_total     integer,
  updates_last_7d   integer,
  last_update_date  date
)
language sql
security definer
set search_path = public
stable
as $$
  with garden as (
    select up.user_id,
           lower(up.email)                                  as email_key,
           up.email,
           up.display_name,
           up.avatar_url,
           up.checked::jsonb                                as checked,
           up.streak_count,
           up.created_at,
           up.updated_at,
           c.slug                                           as app_cohort,
           (select count(*)
              from jsonb_each(coalesce(up.submissions::jsonb, '{}'::jsonb)))::int
                                                            as submissions_count,
           (select count(*)
              from jsonb_each_text(coalesce(up.notes::jsonb, '{}'::jsonb)) n
             where coalesce(btrim(n.value), '') <> '')::int  as notes_count
      from user_progress up
      left join cohort_members cm on cm.user_id = up.user_id
      left join cohorts c         on c.id = cm.cohort_id
     where not exists (select 1 from mentors m  where m.user_id = up.user_id)
       and not exists (select 1 from founders f where f.user_id = up.user_id)
  ),
  updates as (
    select du.user_id,
           count(*)::int                                            as updates_total,
           count(*) filter (where du.date >= current_date - 6)::int  as updates_last_7d,
           max(du.date)                                             as last_update_date
      from daily_updates du
     group by du.user_id
  ),
  notion as (
    select np.*, lower(np.email) as email_key
      from notion_participants np
  )
  select n.notion_page_id,
         n.notion_page_url,
         n.full_name,
         coalesce(n.email, g.email)      as email,
         n.country,
         n.track,
         n.status,
         n.start_date,
         n.mentor,
         n.paid_project_1,
         n.paid_project_2,
         n.job_status,
         g.user_id,
         g.app_cohort,
         g.display_name,
         g.avatar_url,
         g.checked,
         g.submissions_count,
         g.notes_count,
         g.streak_count,
         g.created_at                    as joined_app_at,
         g.updated_at                    as last_active,
         coalesce(u.updates_total, 0)    as updates_total,
         coalesce(u.updates_last_7d, 0)  as updates_last_7d,
         u.last_update_date
    from notion n
    full outer join garden g on g.email_key = n.email_key
    left join updates u      on u.user_id   = g.user_id
   where public.is_founder();
$$;

revoke all on function public.founder_roster() from public, anon;
grant execute on function public.founder_roster() to authenticated;

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Expect zero rows — the workshop columns are gone:
--   select column_name from information_schema.columns
--    where table_name = 'notion_participants' and column_name like 'workshops%';
--
-- Expect one row, job_status:
--   select column_name from information_schema.columns
--    where table_name = 'notion_participants' and column_name = 'job_status';
--
-- Run as a signed-in founder. Expect the same count as before (~214):
--   select count(*) from founder_roster();
--
-- After redeploying the function and clicking Refresh, job_status should be
-- populated. Blank stays blank — it means "not recorded", not "no job":
--   select coalesce(job_status, '(not recorded)') as job_status, count(*)
--     from notion_participants group by 1 order by 2 desc;
