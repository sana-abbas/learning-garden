-- ============================================================================
-- Cohort enrollment — make membership a fact the database owns.
--
-- The bug this fixes:
--   Nothing in the app ever created a "full-stack" membership row. Only CF
--   students got one (from the invite list). So every participant who signed in
--   after the manual backfill had no row in cohort_members at all, and:
--     * the mentor dashboard read that absence as "full-stack", so they showed
--       up in the Full Stack tab;
--     * /cf could not positively confirm full-stack membership, so (since
--       commit e31c14b) it let them stay in the CF garden.
--   Result: visible in Full Stack, shown CF content. It recurred with every
--   new sign-up, because the gap was permanent.
--
-- The fix: ensure_my_cohort() below is the only thing that assigns a cohort.
-- It is SECURITY DEFINER, so the browser needs no write access at all — which
-- also closes the hole where a participant could self-enrol into CF by
-- inserting their own cohort_members row.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR **BEFORE** DEPLOYING THE APP CODE.
-- Everything is inside one transaction: it either all applies or none of it.
-- ============================================================================

begin;

-- ── 1. One cohort per participant ───────────────────────────────────────────
-- The app has always assumed this (it uses .maybeSingle(), which errors on
-- multiple rows). This project already had the constraint, so the guard below
-- makes the script safe to re-run rather than failing the whole transaction.
do $$
begin
  if not exists (
    select 1
      from pg_index i
      join pg_class t     on t.oid = i.indrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'cohort_members'
       and i.indisunique
       and i.indnatts = 1
       and i.indkey[0] = (
         select attnum from pg_attribute
          where attrelid = t.oid and attname = 'user_id'
       )
  ) then
    alter table public.cohort_members
      add constraint cohort_members_user_id_key unique (user_id);
  end if;
end $$;

-- ── 2. Invite emails are matched case-insensitively ─────────────────────────
-- Previously the lookup lowercased the signed-in address but compared it
-- against whatever case was typed, so an invite with a capital letter never
-- matched and that student silently landed in Full Stack. That bug left real
-- traces: at least one address exists twice, once capitalised and once not
-- (presumably re-added by hand when the first invite appeared not to work).
--
-- cohort_invites has a unique constraint on email, so those pairs have to be
-- resolved before the addresses can be normalised.
do $$
declare
  v_conflicts text;
begin
  -- Same person, same cohort, different capitalisation → the capitalised row
  -- is redundant. Keep the lowercase one.
  delete from public.cohort_invites ci
   where ci.email <> lower(ci.email)
     and exists (
       select 1
         from public.cohort_invites keep
        where keep.email = lower(ci.email)
          and keep.cohort_id = ci.cohort_id
     );

  -- Anything still duplicated points at two *different* cohorts, which is a
  -- genuine contradiction only a human can settle. Fail loudly and clearly
  -- rather than letting it surface as a unique-constraint violation.
  select string_agg(e, ', ')
    into v_conflicts
    from (
      select lower(email) as e
        from public.cohort_invites
       group by lower(email)
      having count(*) > 1
    ) d;

  if v_conflicts is not null then
    raise exception
      'cohort_invites has case-duplicate emails assigned to different cohorts: %. Decide which cohort each belongs to, delete the wrong row, then re-run.',
      v_conflicts;
  end if;
end $$;

update public.cohort_invites
   set email = lower(email)
 where email <> lower(email);

-- ── 3. The one place a cohort gets decided ──────────────────────────────────
-- Returns the caller's cohort slug, creating the membership row if it is
-- missing. Already-enrolled participants keep the cohort they have.
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

  -- On the invite list → that cohort. Otherwise Full Stack, the open cohort.
  select c.id, c.slug
    into v_cohort_id, v_slug
    from cohort_invites ci
    join cohorts c on c.id = ci.cohort_id
   where lower(ci.email) = lower(v_email)
   limit 1;

  if v_cohort_id is null then
    select id, slug into v_cohort_id, v_slug
      from cohorts where slug = 'full-stack';
  end if;

  -- No cohorts configured at all — return null and let the caller default
  -- safely rather than inventing a membership.
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

-- ── 4. Backfill anyone still missing a row ──────────────────────────────────
-- Idempotent. Respects the invite list, so a CF invitee who never got a row
-- is enrolled into CF rather than being locked into Full Stack.
insert into cohort_members (user_id, cohort_id)
select up.user_id,
       coalesce(
         (select ci.cohort_id
            from cohort_invites ci
           where lower(ci.email) = lower(up.email)
           limit 1),
         (select id from cohorts where slug = 'full-stack')
       )
  from user_progress up
  left join cohort_members cm on cm.user_id = up.user_id
 where cm.user_id is null
   and up.email is not null
on conflict (user_id) do nothing;

-- ── 5. Take membership writes away from the browser ─────────────────────────
-- with_check was (auth.uid() = user_id), which let any signed-in participant
-- insert their own row with any cohort_id — including coding-fundamentals.
-- ensure_my_cohort() is SECURITY DEFINER, so nothing legitimate needs this.
drop policy if exists cohort_members_insert on public.cohort_members;

commit;

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Expect zero rows: nobody without a cohort.
--   select up.email from user_progress up
--   left join cohort_members cm on cm.user_id = up.user_id
--   where cm.user_id is null;
--
-- Expect one row per participant, with the right slug:
--   select c.slug, count(*) from cohort_members cm
--   join cohorts c on c.id = cm.cohort_id group by c.slug;
