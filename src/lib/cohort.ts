import { supabase } from "@/integrations/supabase/client";

export type CohortSlug = "full-stack" | "coding-fundamentals";

/**
 * src/integrations/supabase/types.ts is stale — it only declares user_progress,
 * and knows nothing about cohort_members or the ensure_my_cohort function. Rather
 * than add to the ~80 type errors that staleness already causes elsewhere, this
 * module talks to a narrow hand-written shape. Regenerate types.ts and this cast
 * can go away.
 */
type CohortQueries = {
  rpc: (fn: "ensure_my_cohort") => Promise<{ data: unknown; error: unknown }>;
  from: (table: "cohort_members") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> };
    };
  };
};

const db = supabase as unknown as CohortQueries;

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
  const { data, error } = await db.rpc("ensure_my_cohort");
  if (!error && typeof data === "string" && data.length > 0) {
    return data === "coding-fundamentals" || data === "full-stack" ? data : null;
  }

  // Fallback for the window before the SQL above is applied: read whatever
  // membership row exists. Deliberately writes nothing.
  const { data: member } = await db
    .from("cohort_members")
    .select("cohorts(slug)")
    .eq("user_id", userId)
    .maybeSingle();
  const slug = (member as { cohorts?: { slug?: string } } | null)?.cohorts?.slug;
  return slug === "coding-fundamentals" || slug === "full-stack" ? slug : null;
}
