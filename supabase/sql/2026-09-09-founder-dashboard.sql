-- ============================================================================
-- Founder dashboard — the founder role, the synced Notion roster, and the
-- one query that joins them.
--
-- Why this exists:
--   Two systems each know half of every participant.
--     * Notion ("👥 Participants: On & Offboarding") owns the roster and the
--       outcomes: Status (Enrolled/Paused/Graduated/Offboarded), Curriculum
--       Track, Country, Start Date, Mentor and paid projects.
--     * user_progress / daily_updates own the engagement: chapters checked,
--       assignments, reflections, streaks, daily updates.
--   Neither can answer the questions founders actually ask — "who is enrolled
--   but has never opened the garden?", "which track graduates people?" — so
--   this joins them on email, in the database, and hands the dashboard one row
--   per human.
--
-- Notion is read-only here. The sync function (supabase/functions/
-- sync-notion-participants) writes notion_participants with the service role;
-- the browser only ever reads.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR **BEFORE** DEPLOYING THE APP CODE, then
-- add yourself to public.founders (last section). Safe to re-run.
-- ============================================================================

begin;

-- ── 1. The founder role ─────────────────────────────────────────────────────
-- Deliberately a separate table from mentors rather than a flag on it: the two
-- roles see different things, and a founder is not automatically a mentor (nor
-- the reverse). Someone who is both simply has a row in each.
create table if not exists public.founders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique,
  name       text,
  created_at timestamptz not null default now()
);

alter table public.founders enable row level security;

-- SECURITY DEFINER so it can be used inside policies on tables the caller
-- cannot otherwise read — including founders itself, without recursing.
create or replace function public.is_founder()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.founders f where f.user_id = auth.uid());
$$;

revoke all on function public.is_founder() from public, anon;
grant execute on function public.is_founder() to authenticated;

-- Founders and mentors may see who the staff are. Nobody writes from the
-- browser: promoting someone is a deliberate act in the SQL editor.
drop policy if exists founders_staff_read on public.founders;
create policy founders_staff_read on public.founders
  for select to authenticated
  using (
    public.is_founder()
    or exists (select 1 from public.mentors m where m.user_id = auth.uid())
  );

-- ── 2. Founders can read what the dashboards need ───────────────────────────
-- These policies are additive: Postgres ORs every applicable SELECT policy
-- together, so existing owner-only and mentor policies keep working untouched.
-- Each is dropped first so this script can be re-run.
--
-- Nothing here grants a write. A founder cannot alter a participant's
-- progress, and the dashboard never tries to.
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_progress', 'daily_updates', 'cohort_members', 'cohorts',
    'cohort_invites', 'mentors', 'update_comments', 'update_reactions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_founder_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_founder())',
      t || '_founder_read', t
    );
  end loop;
end $$;

-- Founders preview both gardens, so names must resolve for them too. Same
-- function as before with the founder branch added — see
-- 2026-08-24-participant-directory.sql for why this is a function and not a view.
create or replace function public.cohort_directory()
returns table (user_id uuid, display_name text, checked jsonb)
language sql
security definer
set search_path = public
stable
as $$
  select up.user_id::uuid,
         up.display_name::text,
         up.checked::jsonb
    from public.user_progress up
   where auth.uid() is not null
     and (
       exists (select 1 from public.mentors m where m.user_id = auth.uid())
       or public.is_founder()
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

-- ── 3. The synced Notion roster ─────────────────────────────────────────────
-- One row per Notion page. Typed columns for everything the dashboard groups
-- or filters on; `raw` keeps the untouched property payload so a new KPI is a
-- frontend change rather than a migration.
create table if not exists public.notion_participants (
  notion_page_id   text primary key,
  notion_page_url  text,
  full_name        text,
  email            text,
  country          text,
  track            text,          -- Notion "Curriculum Track"
  status           text,          -- Enrolled | Paused | Graduated | Offboarded | Applied | …
  start_date       date,
  mentor           text,
  paid_project_1   text,          -- Paid | Unpaid | N/A | null
  paid_project_2   text,
  tenure_years     numeric,
  raw              jsonb not null default '{}'::jsonb,
  synced_at        timestamptz not null default now()
);

-- The join key. Notion emails are hand-typed, so match case-insensitively —
-- the same lesson as cohort_invites in 2026-08-24-cohort-enrollment.sql.
create index if not exists notion_participants_email_key
  on public.notion_participants (lower(email));
create index if not exists notion_participants_status_idx
  on public.notion_participants (status);

alter table public.notion_participants enable row level security;

-- Founder-only: this table carries country, tenure and paid-work history that
-- the mentor dashboard has no reason to show.
drop policy if exists notion_participants_founder_read on public.notion_participants;
create policy notion_participants_founder_read on public.notion_participants
  for select to authenticated using (public.is_founder());

-- No insert/update/delete policy: writes are the sync function's alone, which
-- runs with the service role and bypasses RLS.

-- ── 4. Sync bookkeeping ─────────────────────────────────────────────────────
-- So the dashboard can say "synced 14 minutes ago" rather than quietly showing
-- stale numbers, and so a failed sync is visible instead of silent.
create table if not exists public.notion_sync_state (
  id             text primary key,
  last_synced_at timestamptz,
  last_status    text,            -- 'ok' | 'error'
  last_error     text,
  row_count      integer,
  updated_at     timestamptz not null default now()
);

insert into public.notion_sync_state (id) values ('participants')
on conflict (id) do nothing;

alter table public.notion_sync_state enable row level security;

drop policy if exists notion_sync_state_founder_read on public.notion_sync_state;
create policy notion_sync_state_founder_read on public.notion_sync_state
  for select to authenticated using (public.is_founder());

-- ── 5. The joined roster ────────────────────────────────────────────────────
-- One row per human, whether they exist in Notion, in the garden, or both.
-- A FULL OUTER JOIN on purpose: the rows that appear on only one side are the
-- interesting ones.
--   * Notion row, no garden row → enrolled but never signed in.
--   * Garden row, no Notion row → using the app but missing from the roster.
--
-- `checked` comes back raw because only the frontend knows the curriculum;
-- submissions and notes come back as counts, since their contents can be long
-- and the roster needs none of it.
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
           -- Cast before coalesce: these columns are json in some environments
           -- and jsonb in others, and jsonb_each() accepts only jsonb.
           (select count(*)
              from jsonb_each(coalesce(up.submissions::jsonb, '{}'::jsonb)))::int
                                                            as submissions_count,
           (select count(*)
              from jsonb_each_text(coalesce(up.notes::jsonb, '{}'::jsonb)) n
             where coalesce(btrim(n.value), '') <> '')::int  as notes_count
      from user_progress up
      left join cohort_members cm on cm.user_id = up.user_id
      left join cohorts c         on c.id = cm.cohort_id
     -- Staff previewing a garden are not participants and must not land in
     -- the counts. The mentor dashboard filters them out in the browser; here
     -- it happens once, in the source of truth.
     where not exists (select 1 from mentors m  where m.user_id = up.user_id)
       and not exists (select 1 from founders f where f.user_id = up.user_id)
  ),
  updates as (
    select du.user_id,
           count(*)::int                                                  as updates_total,
           count(*) filter (where du.date >= current_date - 6)::int        as updates_last_7d,
           max(du.date)                                                   as last_update_date
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

-- ── 6. Promote the founders ─────────────────────────────────────────────────
-- Edit the address list and run. Anyone listed who has not signed in yet is
-- skipped; re-run after they do.
--
--   insert into public.founders (user_id, name)
--   select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email)
--     from auth.users u
--    where lower(u.email) in ('sana@code-blossom.com')
--   on conflict (user_id) do nothing;

-- ── 7. Schedule the nightly Notion sync ─────────────────────────────────────
-- The dashboard's Refresh button covers "I need this now"; this covers "the
-- numbers should be right when I open it in the morning".
--
-- Prerequisites, in order:
--   1. Deploy the function, with JWT verification off — the cron job below has
--      no user session, and the function authorises callers itself:
--        supabase functions deploy sync-notion-participants --no-verify-jwt
--   2. Set its secrets (Dashboard → Edge Functions → Secrets):
--        NOTION_TOKEN   your Notion internal integration token
--        SYNC_SECRET    any long random string
--      and in Notion, share the Participants database with that integration
--      (••• → Connections → your integration). Without that the token can see
--      nothing and every sync returns zero rows.
--   3. Fill in the placeholders below and run this block.
--
-- Commented out because it cannot work until the placeholders are real. The
-- SYNC_SECRET below must match the function's secret exactly.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'sync-notion-participants',
--   '17 3 * * *',                       -- 03:17 UTC daily, off the hour so it
--                                       -- does not contend with everything else
--   $$
--   select net.http_post(
--     url     := 'https://aqnmzdwbpgvioukmssvp.supabase.co/functions/v1/sync-notion-participants',
--     headers := jsonb_build_object(
--                  'Content-Type',  'application/json',
--                  'x-sync-secret', '<YOUR-SYNC_SECRET>'
--                ),
--     body    := '{}'::jsonb
--   );
--   $$
-- );
--
-- Check it is registered, and unschedule with:
--   select jobname, schedule, active from cron.job;
--   select cron.unschedule('sync-notion-participants');

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Run as a signed-in founder. Expect one row per human, ~219 from Notion plus
-- any garden users not on the roster:
--   select count(*) from founder_roster();
--
-- The two leaks the join exists to find:
--   select count(*) from founder_roster()
--    where status = 'Enrolled' and user_id is null;   -- enrolled, never signed in
--   select count(*) from founder_roster()
--    where notion_page_id is null;                    -- in the app, not on the roster
--
-- Sync health:
--   select * from notion_sync_state;
