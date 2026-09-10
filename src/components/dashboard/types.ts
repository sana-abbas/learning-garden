import type { Submission } from "@/hooks/useProgress";

/**
 * Shared shapes for the staff dashboards (/mentor and /founder).
 *
 * Both dashboards read the same tables; the difference is what they are
 * allowed to see (RLS) and what they do with it. Keeping the row types here
 * means a schema change lands in one place.
 */

export interface ParticipantRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  submissions: Record<string, Submission>;
  streak_count: number;
  streak_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyUpdateRow {
  id: string;
  user_id: string;
  date: string;
  today: string;
  tomorrow: string;
  blockers: string | null;
  created_at: string;
}

/** The two cohorts that have a curriculum in the app. */
export type CohortFilter = "all" | "full-stack" | "coding-fundamentals";

/**
 * One row of founder_roster() — a participant as both systems see them.
 *
 * The Notion side (full_name … paid_project_2) is null when someone uses the
 * garden but is missing from the roster. The garden side (user_id … last_update_date)
 * is null when someone is on the roster but has never signed in. Those two
 * cases are the point of the join, so neither is an error.
 */
export interface RosterRow {
  // ── Notion: roster and outcomes ──
  notion_page_id: string | null;
  notion_page_url: string | null;
  full_name: string | null;
  email: string | null;
  country: string | null;
  track: string | null;
  status: string | null;
  start_date: string | null;
  mentor: string | null;
  paid_project_1: string | null;
  paid_project_2: string | null;
  /**
   * Notion "Job Status": Working | Not Working | Not in touch.
   *
   * null is a distinct and currently common fourth state meaning nobody has
   * recorded an outcome yet. It must never be counted as "not working".
   */
  job_status: string | null;

  // ── Garden: engagement ──
  user_id: string | null;
  app_cohort: string | null;
  display_name: string | null;
  avatar_url: string | null;
  checked: Record<string, boolean> | null;
  submissions_count: number | null;
  notes_count: number | null;
  streak_count: number | null;
  joined_app_at: string | null;
  last_active: string | null;
  updates_total: number;
  updates_last_7d: number;
  last_update_date: string | null;
}

export interface SyncState {
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  row_count: number | null;
}

/** Notion's Status options, in journey order. */
export const STATUS_ORDER = [
  "Applied",
  "Accepted; not yet enrolled",
  "Enrolled",
  "Paused",
  "Graduated",
  "Offboarded",
  "Declined",
] as const;
