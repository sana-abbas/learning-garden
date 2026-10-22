-- ============================================================================
-- Participant access — an invite-only garden that mentors manage themselves.
--
-- Before this, the garden was open: anyone who signed in with Google was
-- enrolled into Full Stack by ensure_my_cohort(). That made "removing" someone
-- meaningless, since they were re-enrolled on their next visit, and adding
-- someone to CF meant an insert in the SQL editor.
--
-- Now:
--   * cohort_invites is the access list for BOTH cohorts, not just CF. An
--     email on it gets in, enrolled into the cohort it names.
--   * ensure_my_cohort() no longer defaults anyone to Full Stack. No
--     membership and no invite → it returns null, and the app shows a
--     "no access" screen instead of the garden.
--   * mentor_add_participant() / mentor_remove_participant() let a mentor
--     manage that list from the mentor dashboard.
--
-- Removing someone deletes their cohort_members row and their invite, and
-- nothing else. user_progress, daily_updates and comments are left alone, so
-- adding them back restores their garden exactly as it was.
--
-- Existing participants keep their access: everyone who has signed in already
-- has a cohort_members row (backfilled by 2026-08-24-cohort-enrollment.sql),
-- and an existing row is all ensure_my_cohort() needs.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR **BEFORE** DEPLOYING THE APP CODE.
-- Safe to re-run.
-- ============================================================================

begin;

-- ── 1. Store invite emails lowercase ────────────────────────────────────────
-- Same reason as founder_invites: the unique constraint on email should not be
-- able to hold two casings of one address.
create or replace function public.cohort_invites_lowercase()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists cohort_invites_lowercase on public.cohort_invites;
create trigger cohort_invites_lowercase
  before insert or update on public.cohort_invites
  for each row execute function public.cohort_invites_lowercase();

-- ── 2. No more open enrolment ───────────────────────────────────────────────
-- Identical to the 2026-08-24 version except that the Full Stack fallback is
-- gone: not enrolled and not invited now means no cohort, not Full Stack.
create or replace function public.ensure_my_cohort()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_email     text;
  v_slug      public.cohorts.slug%type;
  v_cohort_id public.cohorts.id%type;
begin
  if v_uid is null then
    return null;
  end if;

  -- Already enrolled → that answer stands.
  select c.slug
    into v_slug
    from cohort_members cm
    join cohorts c on c.id = cm.cohort_id
   where cm.user_id = v_uid;

  if v_slug is not null then
    return v_slug::text;
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  select c.id, c.slug
    into v_cohort_id, v_slug
    from cohort_invites ci
    join cohorts c on c.id = ci.cohort_id
   where lower(ci.email) = lower(v_email)
   limit 1;

  -- Not invited, or removed by a mentor. Returning null is what keeps them out.
  if v_cohort_id is null then
    return null;
  end if;

  insert into cohort_members (user_id, cohort_id)
  values (v_uid, v_cohort_id)
  on conflict (user_id) do nothing;

  return v_slug::text;
end;
$$;

revoke all on function public.ensure_my_cohort() from public, anon;
grant execute on function public.ensure_my_cohort() to authenticated;

-- ── 3. Mentors can see the access list ──────────────────────────────────────
-- So the dashboard can show who is invited but has not signed in yet.
-- Founders already have a read policy from 2026-09-09-founder-dashboard.sql.
-- Writes still go only through the functions below.
drop policy if exists cohort_invites_mentor_read on public.cohort_invites;
create policy cohort_invites_mentor_read on public.cohort_invites
  for select to authenticated
  using (exists (select 1 from public.mentors m where m.user_id = auth.uid()));

-- ── 4. Add a participant ────────────────────────────────────────────────────
-- Puts the email on the access list for the given cohort. If that person has
-- already signed in (a removed participant being added back, or a participant
-- being moved to the other cohort), their membership is written straight
-- away, so they do not have to wait for their next sign-in.
--
-- Returns 'enrolled' when they already have an account, 'invited' otherwise.
create or replace function public.mentor_add_participant(p_email text, p_cohort_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email     text := lower(btrim(coalesce(p_email, '')));
  v_cohort_id public.cohorts.id%type;
  v_user_id   uuid;
begin
  if not exists (select 1 from mentors m where m.user_id = auth.uid()) then
    raise exception 'Only mentors can add participants.' using errcode = '42501';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception '"%" is not a valid email address.', p_email using errcode = '22023';
  end if;

  select id into v_cohort_id from cohorts where slug = p_cohort_slug;
  if v_cohort_id is null then
    raise exception 'Unknown cohort "%".', p_cohort_slug using errcode = '22023';
  end if;

  select u.id into v_user_id from auth.users u where lower(u.email) = v_email;

  -- Staff are not participants. Enrolling one would put them in cohort counts.
  if v_user_id is not null and (
       exists (select 1 from mentors m  where m.user_id = v_user_id)
    or exists (select 1 from founders f where f.user_id = v_user_id)
  ) then
    raise exception '% is a mentor or founder, not a participant.', v_email using errcode = '22023';
  end if;
  if exists (select 1 from founder_invites fi where fi.email = v_email) then
    raise exception '% is invited as a founder, not a participant.', v_email using errcode = '22023';
  end if;

  insert into cohort_invites (email, cohort_id)
  values (v_email, v_cohort_id)
  on conflict (email) do update set cohort_id = excluded.cohort_id;

  if v_user_id is null then
    return 'invited';
  end if;

  insert into cohort_members (user_id, cohort_id)
  values (v_user_id, v_cohort_id)
  on conflict (user_id) do update set cohort_id = excluded.cohort_id;

  return 'enrolled';
end;
$$;

revoke all on function public.mentor_add_participant(text, text) from public, anon;
grant execute on function public.mentor_add_participant(text, text) to authenticated;

-- ── 5. Remove a participant ─────────────────────────────────────────────────
-- Takes them off the access list and out of their cohort. Their progress,
-- daily updates and comments are kept. Works for an invite that was never
-- claimed too, which is how a mentor withdraws one.
--
-- Returns true if there was anything to remove.
create or replace function public.mentor_remove_participant(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_user_id uuid;
  v_invites int;
  v_members int;
begin
  if not exists (select 1 from mentors m where m.user_id = auth.uid()) then
    raise exception 'Only mentors can remove participants.' using errcode = '42501';
  end if;

  select u.id into v_user_id from auth.users u where lower(u.email) = v_email;

  -- Never let this lock out staff, including the mentor calling it.
  if v_user_id is not null and (
       exists (select 1 from mentors m  where m.user_id = v_user_id)
    or exists (select 1 from founders f where f.user_id = v_user_id)
  ) then
    raise exception '% is a mentor or founder, not a participant.', v_email using errcode = '22023';
  end if;

  delete from cohort_invites where lower(email) = v_email;
  get diagnostics v_invites = row_count;

  v_members := 0;
  if v_user_id is not null then
    delete from cohort_members where user_id = v_user_id;
    get diagnostics v_members = row_count;
  end if;

  return v_invites + v_members > 0;
end;
$$;

revoke all on function public.mentor_remove_participant(text) from public, anon;
grant execute on function public.mentor_remove_participant(text) to authenticated;

-- ── 6. Keep current participants on the access list ─────────────────────────
-- Not needed for access (their cohort_members row is enough), but it makes
-- cohort_invites the complete list, so a participant who is removed and added
-- back, or whose membership row is ever lost, is not locked out by surprise.
insert into cohort_invites (email, cohort_id)
select lower(u.email), cm.cohort_id
  from cohort_members cm
  join auth.users u on u.id = cm.user_id
 where u.email is not null
   and not exists (select 1 from mentors m  where m.user_id = cm.user_id)
   and not exists (select 1 from founders f where f.user_id = cm.user_id)
on conflict (email) do nothing;

-- ── 7. Staff are not on the participant access list ─────────────────────────
-- Some staff addresses were added to cohort_invites by hand to preview CF,
-- before these rules existed. Staff reach both gardens through their role, so
-- the invites do nothing for them except show up on the mentor dashboard as
-- participants who never signed in.
delete from cohort_invites ci
 where exists (
         select 1
           from auth.users u
          where lower(u.email) = lower(ci.email)
            and (   exists (select 1 from mentors m  where m.user_id = u.id)
                 or exists (select 1 from founders f where f.user_id = u.id))
       )
    or exists (select 1 from founder_invites fi where fi.email = lower(ci.email));

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Every current participant is on the access list (expect zero rows):
--   select u.email from cohort_members cm
--     join auth.users u on u.id = cm.user_id
--     left join cohort_invites ci on ci.email = lower(u.email)
--    where ci.email is null;
--
-- To undo and reopen the garden to anyone, re-run section 3 of
-- 2026-08-24-cohort-enrollment.sql, which restores the Full Stack fallback.
