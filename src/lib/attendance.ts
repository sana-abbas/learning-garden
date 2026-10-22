import { supabase } from "@/integrations/supabase/client";

/**
 * Attendance for weekly 1:1s, bi-weekly group mentor hours and Beyond Coding
 * sessions. Mirrors the Attendance tabs of the "Progress Tracker" sheet — see
 * supabase/sql/2026-10-15-attendance.sql.
 */

export type SessionKind = "one_on_one" | "mentor_hours" | "beyond_coding";

/** The sheet's Yes / No / Leave / Holiday / Pause. "Not scheduled" is no record. */
export type AttendanceStatus = "attended" | "absent" | "leave" | "holiday" | "paused";

export const SESSION_KINDS: { value: SessionKind; label: string; hint: string }[] = [
  { value: "one_on_one", label: "1:1", hint: "Weekly" },
  { value: "mentor_hours", label: "Mentor hours", hint: "Every two weeks, as a group" },
  { value: "beyond_coding", label: "Beyond Coding", hint: "Soft-skills sessions" },
];

export const STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "attended", label: "Attended", color: "var(--primary)" },
  { value: "absent", label: "Absent", color: "var(--destructive)" },
  { value: "leave", label: "Leave", color: "oklch(0.6 0.13 75)" },
  { value: "holiday", label: "Holiday", color: "oklch(0.58 0.1 240)" },
  { value: "paused", label: "Paused", color: "var(--muted-foreground)" },
];

/**
 * The Beyond Coding curriculum, in teaching order. Mentors pick from this list
 * so the same session is always spelled the same way, which is what lets the
 * dashboard count it. "Goal Setting" was renamed to include vision boarding.
 */
export const BEYOND_CODING_SESSIONS = [
  "Work Ethics & Professionalism",
  "Effective Communication",
  "Feedback",
  "Teamwork & Collaboration",
  "Problem Solving & Critical Thinking",
  "Conflict Resolution",
  "Goal Setting & Vision Boarding",
  "Time Management",
  "Impostor Syndrome",
] as const;

export function kindLabel(kind: string): string {
  return SESSION_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export interface AttendanceSession {
  id: string;
  kind: SessionKind;
  title: string | null;
  held_on: string;
  cohort_slug: string | null;
}

export interface AttendanceRecord {
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
}

export async function loadAttendance(): Promise<{
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
}> {
  const [{ data: sessions, error: sErr }, { data: records, error: rErr }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id, kind, title, held_on, cohort_slug")
      .order("held_on", { ascending: false }),
    supabase.from("attendance_records").select("session_id, user_id, status"),
  ]);
  const error = sErr ?? rErr;
  if (error) throw toError(error);
  return {
    sessions: (sessions ?? []) as AttendanceSession[],
    records: (records ?? []) as AttendanceRecord[],
  };
}

export interface MentorAssignment {
  /** The Notion "Mentor" label as written there. */
  notionMentor: string | null;
  /** The mentor it matched, or null when it matched nobody. */
  mentorUserId: string | null;
}

/**
 * participant user_id → their mentor, from Notion's Mentor field. Participants
 * missing from the map are not on the Notion roster, or have no mentor set.
 */
export async function loadMentorAssignments(): Promise<Record<string, MentorAssignment>> {
  const { data, error } = await supabase.rpc("participant_mentors");
  if (error) throw toError(error);
  return Object.fromEntries(
    (data ?? []).map((r) => [
      r.user_id,
      { notionMentor: r.notion_mentor, mentorUserId: r.mentor_user_id },
    ]),
  );
}

/** The session that a kind/date/title/cohort picks out, if it exists yet. */
export function findSession(
  sessions: AttendanceSession[],
  slot: { kind: SessionKind; heldOn: string; title: string; cohort: string },
): AttendanceSession | undefined {
  const title = slot.title.trim().toLowerCase();
  return sessions.find(
    (s) =>
      s.kind === slot.kind &&
      s.held_on === slot.heldOn &&
      (s.title ?? "").trim().toLowerCase() === (slot.kind === "beyond_coding" ? title : "") &&
      (s.cohort_slug ?? "") === slot.cohort,
  );
}

/**
 * Saves one session's marks. Creates the session on first save, so opening a
 * date to look at it never leaves an empty session behind. A participant whose
 * mark was cleared has their record deleted — back to "not scheduled".
 */
export async function saveAttendance(
  slot: { kind: SessionKind; heldOn: string; title: string; cohort: string },
  marks: Record<string, AttendanceStatus | null>,
): Promise<void> {
  const { data: sessionId, error } = await supabase.rpc("open_attendance_session", {
    p_kind: slot.kind,
    p_held_on: slot.heldOn,
    p_title: slot.kind === "beyond_coding" ? slot.title.trim() : undefined,
    p_cohort_slug: slot.cohort || undefined,
  });
  if (error) throw toError(error);
  if (!sessionId) throw new Error("Could not open this session.");

  const now = new Date().toISOString();
  const upserts = Object.entries(marks)
    .filter((entry): entry is [string, AttendanceStatus] => entry[1] !== null)
    .map(([user_id, status]) => ({ session_id: sessionId, user_id, status, updated_at: now }));
  const cleared = Object.entries(marks)
    .filter(([, status]) => status === null)
    .map(([userId]) => userId);

  if (upserts.length > 0) {
    const { error: upErr } = await supabase
      .from("attendance_records")
      .upsert(upserts, { onConflict: "session_id,user_id" });
    if (upErr) throw toError(upErr);
  }
  if (cleared.length > 0) {
    const { error: delErr } = await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", sessionId)
      .in("user_id", cleared);
    if (delErr) throw toError(delErr);
  }
}

/**
 * Share of sessions attended, out of those that counted: leave, holiday and
 * pause are excused, just as they were in the sheet. Null when nothing has
 * counted yet, so the dashboard can show a dash rather than a misleading 0%.
 */
export function attendanceRate(statuses: AttendanceStatus[]): number | null {
  const attended = statuses.filter((s) => s === "attended").length;
  const counted = attended + statuses.filter((s) => s === "absent").length;
  return counted === 0 ? null : Math.round((attended / counted) * 100);
}

/**
 * How much of the Beyond Coding curriculum someone has covered. Each session
 * runs twice a year, so attending either run counts, and attending both still
 * counts once. Names outside the curriculum (recorded via "Other…") are ignored.
 */
export function beyondCodingCoverage(attendedTitles: string[]): {
  covered: number;
  total: number;
  missing: string[];
} {
  const attended = new Set(attendedTitles.map((t) => t.trim().toLowerCase()));
  const missing = BEYOND_CODING_SESSIONS.filter((t) => !attended.has(t.toLowerCase()));
  return {
    covered: BEYOND_CODING_SESSIONS.length - missing.length,
    total: BEYOND_CODING_SESSIONS.length,
    missing,
  };
}

/** 42P01: the tables do not exist, which means the migration has not been run. */
function toError(error: { code?: string; message: string }): Error {
  if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202") {
    return new Error(
      "Attendance isn't set up in the database yet. Run supabase/sql/2026-10-15-attendance.sql in the Supabase SQL editor.",
    );
  }
  return new Error(error.message);
}
