import { supabase } from "@/integrations/supabase/client";

export type CohortSlug = "full-stack" | "coding-fundamentals";

/**
 * Resolves the signed-in participant's cohort. The database decides — see
 * ensure_my_cohort() in supabase/sql/2026-08-24-cohort-enrollment.sql. It enrols
 * anyone who has no membership row yet (CF if they are on the invite list, Full
 * Stack otherwise), so "no cohort" stops being a state a participant can be left
 * in — which is what let people drift into the wrong garden.
 *
 * Returns null only when the cohort genuinely cannot be determined. Callers must
 * treat null as "not CF" rather than guessing.
 */
export async function resolveMyCohort(userId: string): Promise<CohortSlug | null> {
  const { data, error } = await supabase.rpc("ensure_my_cohort");
  if (!error && typeof data === "string" && data.length > 0) {
    return data === "coding-fundamentals" || data === "full-stack" ? data : null;
  }

  // Fallback if the function is unavailable: read whatever membership row
  // exists. Deliberately writes nothing.
  const { data: member } = await supabase
    .from("cohort_members")
    .select("cohorts(slug)")
    .eq("user_id", userId)
    .maybeSingle();
  const slug = member?.cohorts?.slug;
  return slug === "coding-fundamentals" || slug === "full-stack" ? slug : null;
}
