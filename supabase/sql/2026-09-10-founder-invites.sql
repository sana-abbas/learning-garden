-- ============================================================================
-- Invite founders who have never signed in.
--
-- The problem: public.founders is keyed on user_id, and user_id only exists
-- once somebody has signed in with Google. So a founder cannot be added before
-- their first visit — and if they simply sign in unannounced, the guard on /
-- treats them as a participant: ensure_my_cohort() enrols them into Full
-- Stack, they get a user_progress row, and they land in the garden instead of
-- the dashboard. Promoting them afterwards leaves that participant debris
-- behind.
--
-- The fix, following the same shape as cohort_invites: invite by email, and
-- claim the role on first sign-in, before anything decides they are a learner.
--
--   founder_invites  — the list of addresses allowed to become founders
--   claim_my_role()  — what the app asks on every sign-in. Returns the
--                      caller's role, promoting them first if they were
--                      invited. It is the only thing that writes to founders.
--
-- Emails are matched case-insensitively. cohort_invites was bitten by exactly
-- this: an invite typed with a capital letter never matched, and that student
-- silently landed in the wrong cohort (see 2026-08-24-cohort-enrollment.sql).
--
-- RUN THIS IN THE SUPABASE SQL EDITOR, then add your founders at the bottom.
-- Safe to re-run.
-- ============================================================================

begin;

-- ── 1. The invite list ──────────────────────────────────────────────────────
create table if not exists public.founder_invites (
  email      text primary key,
  name       text,
  invited_at timestamptz not null default now(),
  -- Set the first time the invited person signs in, so you can see who has
  -- actually accepted without hunting through auth.users.
  claimed_at timestamptz
);

-- Store lowercase so the primary key cannot hold two casings of one address.
create or replace function public.founder_invites_lowercase()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists founder_invites_lowercase on public.founder_invites;
create trigger founder_invites_lowercase
  before insert or update on public.founder_invites
  for each row execute function public.founder_invites_lowercase();

update public.founder_invites
   set email = lower(btrim(email))
 where email <> lower(btrim(email));

alter table public.founder_invites enable row level security;

-- Founders can see who else has been invited. Nobody writes from the browser:
-- inviting a founder is a deliberate act in the SQL editor, and an invite is
-- effectively a grant of read access to every participant's record.
drop policy if exists founder_invites_founder_read on public.founder_invites;
create policy founder_invites_founder_read on public.founder_invites
  for select to authenticated using (public.is_founder());

-- ── 2. The one place a role gets decided ────────────────────────────────────
-- Called by the app on every sign-in. Returns 'founder', 'mentor' or
-- 'participant'.
--
-- SECURITY DEFINER because it promotes the caller, which they cannot do
-- themselves — but it will only ever do so for an address already on
-- founder_invites, and the email comes from auth.users (verified by Google at
-- sign-in), not from anything the browser sends.
create or replace function public.claim_my_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_name  text;
begin
  if v_uid is null then
    return null;
  end if;

  -- Existing roles win, and are checked first so the common case costs one
  -- index lookup and no writes.
  if exists (select 1 from founders f where f.user_id = v_uid) then
    return 'founder';
  end if;

  if exists (select 1 from mentors m where m.user_id = v_uid) then
    return 'mentor';
  end if;

  select lower(u.email), coalesce(u.raw_user_meta_data->>'full_name', u.email)
    into v_email, v_name
    from auth.users u
   where u.id = v_uid;

  if v_email is null then
    return 'participant';
  end if;

  -- Invited but not yet promoted: do it now, on their first sign-in, before
  -- any participant machinery runs.
  if exists (select 1 from founder_invites fi where fi.email = v_email) then
    insert into founders (user_id, name)
    values (v_uid, coalesce((select fi.name from founder_invites fi where fi.email = v_email), v_name))
    on conflict (user_id) do nothing;

    update founder_invites
       set claimed_at = coalesce(claimed_at, now())
     where email = v_email;

    -- A founder invited after they had already been poking around as a
    -- participant would otherwise keep a stale cohort membership, which shows
    -- them in a garden and in cohort counts. Their progress row is left alone:
    -- founder_roster() already excludes staff, and deleting someone's work is
    -- not this function's business.
    delete from cohort_members cm where cm.user_id = v_uid;

    return 'founder';
  end if;

  return 'participant';
end;
$$;

revoke all on function public.claim_my_role() from public, anon;
grant execute on function public.claim_my_role() to authenticated;

commit;

-- ── 3. Invite your founders ─────────────────────────────────────────────────
-- Add one row per person. They do not need an account yet — the role is
-- claimed automatically the first time they sign in with Google.
--
--   insert into public.founder_invites (email, name) values
--     ('someone@code-blossom.com', 'Their Name'),
--     ('another@example.com',      'Another Name')
--   on conflict (email) do nothing;
--
-- Then send them the app URL and tell them to sign in with Google using that
-- exact address. They will land on /founder directly.

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Who is invited, and who has actually signed in:
--   select email, name, invited_at, claimed_at from founder_invites
--    order by claimed_at nulls first, email;
--
-- Current founders:
--   select f.name, u.email from founders f join auth.users u on u.id = f.user_id;
--
-- To withdraw an invite that has not been claimed:
--   delete from founder_invites where email = 'someone@code-blossom.com';
-- To remove a founder who already claimed it, also:
--   delete from founders where user_id = (select id from auth.users where lower(email) = 'someone@code-blossom.com');
