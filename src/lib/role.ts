import { supabase } from "@/integrations/supabase/client";

export interface MyRole {
  isFounder: boolean;
  isMentor: boolean;
}

export interface RoleInputs {
  /** What claim_my_role() returned: 'founder' | 'mentor' | 'participant'. */
  claimedRole: string | null;
  /** True when claim_my_role() could not be called at all. */
  claimFailed: boolean;
  inMentors: boolean;
  /** Only consulted on the fallback path. */
  inFounders: boolean;
}

/**
 * The role decision, kept pure so it can be reasoned about and tested without
 * a database. resolveMyRole below is just the I/O around it.
 */
export function decideRole({
  claimedRole,
  claimFailed,
  inMentors,
  inFounders,
}: RoleInputs): MyRole {
  // claim_my_role() is authoritative: it is the only thing that knows about an
  // invited founder who has no founders row yet. isMentor still comes from the
  // mentors table, because someone can hold both roles and the function
  // reports only the one that decides where they land.
  if (!claimFailed && typeof claimedRole === "string") {
    return { isFounder: claimedRole === "founder", isMentor: inMentors };
  }

  // Fallback for when claim_my_role() is not there yet — the app code can
  // reach production before the migration is run. Reading the tables keeps
  // existing staff working; without this they would resolve to "participant"
  // and get enrolled into a cohort. An invited founder who has never signed in
  // cannot be resolved this way, so they still need the migration applied.
  return { isFounder: inFounders, isMentor: inMentors };
}

/**
 * Resolves the signed-in person's staff role, promoting them first if they
 * were invited as a founder.
 *
 * The database decides — see claim_my_role() in
 * supabase/sql/2026-09-10-founder-invites.sql. It exists because a founder who
 * has never signed in has no user_id to put in public.founders, so the role
 * has to be claimed from an email invite on their first visit. Crucially that
 * has to happen before ensure_my_cohort() runs, or an invited founder is
 * enrolled as a Full Stack learner on the way past.
 */
export async function resolveMyRole(userId: string): Promise<MyRole> {
  const [{ data: claimedRole, error }, { data: mentorRow }] = await Promise.all([
    supabase.rpc("claim_my_role"),
    supabase.from("mentors").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  const inMentors = !!mentorRow;
  if (!error && typeof claimedRole === "string") {
    return decideRole({ claimedRole, claimFailed: false, inMentors, inFounders: false });
  }

  // Only read founders when the function was unavailable — on the happy path
  // its answer already covers this.
  const { data: founderRow } = await supabase
    .from("founders")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return decideRole({
    claimedRole: null,
    claimFailed: true,
    inMentors,
    inFounders: !!founderRow,
  });
}
