import { supabase } from "@/integrations/supabase/client";
import type { CohortSlug } from "@/lib/cohort";

/**
 * Mentor-side management of who can get into the garden. The garden is
 * invite-only: cohort_invites is the access list, and these call the two
 * functions that write it — see supabase/sql/2026-10-15-participant-access.sql.
 *
 * Both are keyed on email rather than user_id, because someone being added
 * usually has not signed in yet and so has no user_id.
 */

/** 'enrolled' if they already have an account, 'invited' if not yet. */
export type AddResult = "enrolled" | "invited";

/**
 * PostgREST answers PGRST202 when the function does not exist, which means the
 * migration has not been run yet. Say that, rather than the schema-cache text.
 */
function toError(error: { code?: string; message: string }): Error {
  if (error.code === "PGRST202") {
    return new Error(
      "Participant management isn't set up in the database yet. Run supabase/sql/2026-10-15-participant-access.sql in the Supabase SQL editor.",
    );
  }
  return new Error(error.message);
}

export async function addParticipant(email: string, cohort: CohortSlug): Promise<AddResult> {
  const { data, error } = await supabase.rpc("mentor_add_participant", {
    p_email: email,
    p_cohort_slug: cohort,
  });
  if (error) throw toError(error);
  return data === "enrolled" ? "enrolled" : "invited";
}

/**
 * Takes them out of their cohort and off the access list. Their progress,
 * reflections and daily updates are kept, so adding them back restores it.
 */
export async function removeParticipant(email: string): Promise<void> {
  const { error } = await supabase.rpc("mentor_remove_participant", { p_email: email });
  if (error) throw toError(error);
}
