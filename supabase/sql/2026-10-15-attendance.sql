-- ============================================================================
-- Attendance — weekly 1:1s, bi-weekly group mentor hours, and Beyond Coding
-- sessions, recorded by mentors in the mentor dashboard.
--
-- Until now this lived in the "Progress Tracker" Google Sheet (Attendance and
-- Uganda Attendance tabs): one column per week, alternating 1:1 / Mentor hours,
-- marked Yes / No / Leave / Holiday / Pause, or "Not scheduled". The shape here
-- follows that sheet so the two read the same way:
--
--   attendance_sessions  — one row per thing that happened: a week's 1:1s, a
--                          mentor-hours call, a Beyond Coding session.
--   attendance_records   — one row per participant per session, with the same
--                          statuses as the sheet.
--
-- "Not scheduled" is not a status: it is simply no record. That keeps the
-- attendance rate honest — the sheet's "Not scheduled" cells never counted
-- against anyone, and a missing row does not either.
--
-- Records are keyed on user_id, so only participants who have signed in to the
-- garden can be marked. That is everyone the mentor dashboard shows.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR **BEFORE** DEPLOYING THE APP CODE.
-- Safe to re-run.
-- ============================================================================

begin;

-- ── 1. Who counts as a mentor, usable inside policies ───────────────────────
create or replace function public.is_mentor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.mentors m where m.user_id = auth.uid());
$$;

revoke all on function public.is_mentor() from public, anon;
grant execute on function public.is_mentor() to authenticated;

-- ── 2. Sessions ─────────────────────────────────────────────────────────────
create table if not exists public.attendance_sessions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null
              check (kind in ('one_on_one', 'mentor_hours', 'beyond_coding')),
  -- The Beyond Coding session's name ("Personal branding", …). Null for 1:1s
  -- and mentor hours, which are identified by their date alone.
  title       text,
  held_on     date not null,
  -- Which cohort this session was for, or null for everyone.
  cohort_slug text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  constraint attendance_sessions_title_for_bc
    check (kind <> 'beyond_coding' or nullif(btrim(title), '') is not null)
);

-- Opening "1:1s, week of 13 Oct" twice should land on the same session, not
-- create a second one with half the marks.
create unique index if not exists attendance_sessions_one_per_slot
  on public.attendance_sessions (
    kind, held_on, coalesce(lower(btrim(title)), ''), coalesce(cohort_slug, '')
  );

create index if not exists attendance_sessions_held_on_idx
  on public.attendance_sessions (held_on desc);

-- ── 3. Records ──────────────────────────────────────────────────────────────
create table if not exists public.attendance_records (
  session_id  uuid not null references public.attendance_sessions (id) on delete cascade,
  user_id     uuid not null,
  -- Same vocabulary as the sheet: Yes → attended, No → absent.
  status      text not null
              check (status in ('attended', 'absent', 'leave', 'holiday', 'paused')),
  note        text,
  recorded_by uuid default auth.uid(),
  updated_at  timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists attendance_records_user_idx
  on public.attendance_records (user_id);

-- ── 4. Access ───────────────────────────────────────────────────────────────
-- Mentors record and correct attendance. Founders can read it for reporting,
-- in keeping with the founder dashboard being read-only. Participants see
-- nothing yet.
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['attendance_sessions', 'attendance_records']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_mentor_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_mentor()) with check (public.is_mentor())',
      t || '_mentor_all', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_founder_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_founder())',
      t || '_founder_read', t
    );
  end loop;
end $$;

-- ── 5. Find or create a session ─────────────────────────────────────────────
-- The unique index above is on expressions, which PostgREST's upsert cannot
-- target, so the dashboard opens sessions through this instead. Returns the
-- existing session's id when one matches, so reopening a session to fix a
-- mark edits it rather than duplicating it.
create or replace function public.open_attendance_session(
  p_kind        text,
  p_held_on     date,
  p_title       text default null,
  p_cohort_slug text default null
)
returns uuid
language plpgsql
security invoker          -- RLS applies: only mentors get past the insert
set search_path = public
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_id    uuid;
begin
  select s.id into v_id
    from attendance_sessions s
   where s.kind = p_kind
     and s.held_on = p_held_on
     and coalesce(lower(btrim(s.title)), '') = coalesce(lower(v_title), '')
     and coalesce(s.cohort_slug, '') = coalesce(p_cohort_slug, '');

  if v_id is not null then
    return v_id;
  end if;

  insert into attendance_sessions (kind, title, held_on, cohort_slug)
  values (p_kind, v_title, p_held_on, p_cohort_slug)
  on conflict do nothing
  returning id into v_id;

  -- Lost a race with another mentor opening the same session: use theirs.
  if v_id is null then
    select s.id into v_id
      from attendance_sessions s
     where s.kind = p_kind
       and s.held_on = p_held_on
       and coalesce(lower(btrim(s.title)), '') = coalesce(lower(v_title), '')
       and coalesce(s.cohort_slug, '') = coalesce(p_cohort_slug, '');
  end if;

  return v_id;
end;
$$;

revoke all on function public.open_attendance_session(text, date, text, text) from public, anon;
grant execute on function public.open_attendance_session(text, date, text, text) to authenticated;

-- ── 6. Which mentor each participant belongs to ─────────────────────────────
-- Each mentor records attendance for their own participants only, and the
-- assignment comes from Notion's "Mentor" select (notion_participants.mentor),
-- which is already the roster's system of record.
--
-- Notion's value is a hand-picked label, so it is matched to public.mentors
-- loosely: case-insensitively on the full name, or on the first name alone
-- when no other mentor shares it ("Sana" → "Sana Abbas"). When a label still
-- will not match, set mentors.notion_name to exactly what Notion uses:
--   update mentors set notion_name = 'Sana A.' where name = 'Sana Abbas';
alter table public.mentors add column if not exists notion_name text;

-- One row per garden participant who is on the Notion roster with a mentor.
-- mentor_user_id is null when the Notion label matched nobody, so the
-- dashboard can say so instead of silently dropping them. SECURITY DEFINER
-- because notion_participants is founder-only; this exposes just the mentor
-- label, to mentors and founders.
create or replace function public.participant_mentors()
returns table (user_id uuid, notion_mentor text, mentor_user_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  with labels as (
    select m.user_id,
           lower(btrim(coalesce(m.notion_name, m.name)))               as full_key,
           split_part(lower(btrim(coalesce(m.notion_name, m.name))), ' ', 1) as first_key
      from mentors m
     where coalesce(m.notion_name, m.name) is not null
  ),
  unique_first as (
    select first_key from labels group by first_key having count(*) = 1
  )
  select up.user_id,
         np.mentor,
         coalesce(
           (select l.user_id from labels l
             where l.full_key = lower(btrim(np.mentor)) limit 1),
           (select l.user_id from labels l
              join unique_first u on u.first_key = l.first_key
             where l.first_key = split_part(lower(btrim(np.mentor)), ' ', 1)
             limit 1)
         )
    from user_progress up
    join notion_participants np on lower(np.email) = lower(up.email)
   where np.mentor is not null
     and (public.is_mentor() or public.is_founder());
$$;

revoke all on function public.participant_mentors() from public, anon;
grant execute on function public.participant_mentors() to authenticated;

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- After a mentor records a session, attendance rate per participant and kind:
--   select r.user_id, s.kind,
--          count(*) filter (where r.status = 'attended')                      as attended,
--          count(*) filter (where r.status in ('attended', 'absent'))         as counted
--     from attendance_records r
--     join attendance_sessions s on s.id = r.session_id
--    group by 1, 2;
