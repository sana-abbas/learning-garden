import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check } from "lucide-react";
import { toast } from "sonner";
import {
  BEYOND_CODING_SESSIONS,
  SESSION_KINDS,
  STATUSES,
  attendanceRate,
  beyondCodingCoverage,
  findSession,
  kindLabel,
  loadAttendance,
  loadMentorAssignments,
  saveAttendance,
  type AttendanceRecord,
  type AttendanceSession,
  type AttendanceStatus,
  type MentorAssignment,
  type SessionKind,
} from "@/lib/attendance";
import type { ParticipantRow } from "../types";
import { displayName, todayISO } from "../format";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "../Avatar";

type Cohort = "all" | "full-stack" | "coding-fundamentals";

/** Select value for a Beyond Coding session that is not on the list. */
const OTHER = "__other__";

const COHORTS: { slug: Cohort; label: string }[] = [
  { slug: "all", label: "All cohorts" },
  { slug: "full-stack", label: "Full Stack" },
  { slug: "coding-fundamentals", label: "Coding Fundamentals" },
];

/**
 * Recording attendance for 1:1s, mentor hours and Beyond Coding sessions, and
 * a per-participant summary underneath. Replaces the Attendance tabs of the
 * "Progress Tracker" sheet.
 *
 * Pick a session (kind, date, and which Beyond Coding session), mark each person,
 * save. Picking a session that already exists loads its marks for editing, so
 * the same form is used to record and to correct.
 *
 * Each mentor sees their own participants by default — the assignment comes
 * from Notion's Mentor field — so a mentor marks a handful of people, not the
 * whole cohort. A session ("1:1s, week of 13 Oct") is shared by everyone, and
 * a save only writes the marks that changed, so mentors recording the same
 * week never overwrite each other.
 */
export function AttendanceView({
  participants,
  cohortMemberMap,
  currentUserId,
}: {
  participants: ParticipantRow[];
  cohortMemberMap: Record<string, string>;
  currentUserId: string | undefined;
}) {
  const [cohort, setCohort] = useState<Cohort>("all");
  const [scope, setScope] = useState<"mine" | "everyone">("mine");
  const [assignments, setAssignments] = useState<Record<string, MentorAssignment>>({});
  // Why "My participants" might be empty depends on whether the lookup ran.
  const [assignmentsFailed, setAssignmentsFailed] = useState(false);
  const [myName, setMyName] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"record" | "summary">("record");
  const [kind, setKind] = useState<SessionKind>("one_on_one");
  const [heldOn, setHeldOn] = useState(todayISO());
  const [title, setTitle] = useState("");

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Marks being edited for the selected session. null = cleared (no record).
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>({});
  const [saving, setSaving] = useState(false);

  async function reload() {
    // Loaded separately, so a failed mentor lookup is reported as that rather
    // than looking like "you have no participants".
    const [attendance, mentorMap] = await Promise.allSettled([
      loadAttendance(),
      loadMentorAssignments(),
    ]);
    if (attendance.status === "fulfilled") {
      setSessions(attendance.value.sessions);
      setRecords(attendance.value.records);
      setLoadError(null);
    } else {
      const err = attendance.reason;
      setLoadError(err instanceof Error ? err.message : "Could not load attendance.");
    }
    if (mentorMap.status === "fulfilled") {
      setAssignments(mentorMap.value);
      setAssignmentsFailed(false);
    } else {
      setAssignmentsFailed(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  // The name Notion's Mentor field is matched against, to show when nothing matches.
  useEffect(() => {
    if (!currentUserId) return;
    void supabase
      .from("mentors")
      .select("name")
      .eq("user_id", currentUserId)
      .maybeSingle()
      .then(({ data }) => setMyName(data?.name ?? null));
  }, [currentUserId]);

  // Notion labels that matched no mentor: the usual reason someone sees nobody.
  const unmatchedLabels = [
    ...new Set(
      Object.values(assignments)
        .filter((a) => a.mentorUserId === null && a.notionMentor)
        .map((a) => a.notionMentor!),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const inCohort = participants
    .filter((p) => cohort === "all" || cohortMemberMap[p.user_id] === cohort)
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  const mine = inCohort.filter((p) => assignments[p.user_id]?.mentorUserId === currentUserId);
  const people = scope === "mine" ? mine : inCohort;
  const mentorOf = (userId: string) => assignments[userId]?.notionMentor ?? null;

  // Sessions are shared across cohorts; the cohort only filters who is shown.
  const slot = { kind, heldOn, title, cohort: "" };
  const needsTitle = kind === "beyond_coding" && title.trim() === "";
  const session = needsTitle ? undefined : findSession(sessions, slot);

  // Saved marks for the selected session, keyed by user.
  const saved = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    if (session) {
      for (const r of records) if (r.session_id === session.id) map[r.user_id] = r.status;
    }
    return map;
  }, [records, session]);

  // Switching session discards unsaved edits and shows that session's marks.
  // Changing who is shown does not: marks are per person, so they survive.
  useEffect(() => {
    setMarks({});
  }, [kind, heldOn, title]);

  const markOf = (userId: string): AttendanceStatus | null =>
    userId in marks ? marks[userId] : (saved[userId] ?? null);
  const dirty = Object.entries(marks).some(([id, m]) => m !== (saved[id] ?? null));

  // The curriculum, then any other names recorded before (via "Other…"), so an
  // ad-hoc session can be reopened from the same list.
  const bcTitles = useMemo(() => {
    const known = new Set<string>(BEYOND_CODING_SESSIONS.map((t) => t.toLowerCase()));
    const extra = [
      ...new Set(sessions.filter((s) => s.kind === "beyond_coding").map((s) => s.title ?? "")),
    ].filter((t) => t && !known.has(t.toLowerCase()));
    return [...BEYOND_CODING_SESSIONS, ...extra.sort((a, b) => a.localeCompare(b))];
  }, [sessions]);
  const [otherTitle, setOtherTitle] = useState(false);
  const titleIsListed = bcTitles.some((t) => t.toLowerCase() === title.trim().toLowerCase());

  async function save() {
    if (needsTitle || !dirty) return;
    setSaving(true);
    try {
      const changed = Object.fromEntries(
        Object.entries(marks).filter(([id, m]) => m !== (saved[id] ?? null)),
      );
      await saveAttendance(slot, changed);
      await reload();
      setMarks({});
      toast.success(
        `Saved ${kindLabel(kind)}${kind === "beyond_coding" ? ` · ${title.trim()}` : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save attendance.");
    }
    setSaving(false);
  }

  function markEveryone(status: AttendanceStatus) {
    setMarks((prev) => {
      const next = { ...prev };
      for (const p of people) if (markOf(p.user_id) === null) next[p.user_id] = status;
      return next;
    });
  }

  const shownIds = new Set(people.map((p) => p.user_id));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {COHORTS.map(({ slug, label }) => (
          <button
            key={slug}
            type="button"
            onClick={() => setCohort(slug)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: cohort === slug ? "var(--primary)" : "var(--sidebar)",
              color: cohort === slug ? "white" : "var(--muted-foreground)",
              border: "1px solid var(--sidebar-border)",
            }}
          >
            {label}
          </button>
        ))}
        <div
          className="ml-auto flex rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--sidebar-border)" }}
        >
          {(
            [
              { value: "record", label: "Record" },
              { value: "summary", label: "Summary" },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSubTab(t.value)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: subTab === t.value ? "var(--primary)" : "var(--sidebar)",
                color: subTab === t.value ? "white" : "var(--muted-foreground)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(
          [
            { value: "mine", label: `My participants (${mine.length})` },
            { value: "everyone", label: `Everyone (${inCohort.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setScope(t.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: scope === t.value ? "var(--foreground)" : "transparent",
              color: scope === t.value ? "var(--background)" : "var(--muted-foreground)",
              border: "1px solid var(--sidebar-border)",
            }}
          >
            {t.label}
          </button>
        ))}
        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          From the Mentor field in Notion.
        </span>
      </div>

      {loadError && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ border: "1px solid var(--destructive)", color: "var(--foreground)" }}
        >
          {loadError}
        </div>
      )}

      {subTab === "summary" ? (
        <Summary
          people={people}
          sessions={sessions}
          records={records}
          loading={loading}
          mentorOf={scope === "everyone" ? mentorOf : undefined}
        />
      ) : (
        <>
          <section
            className="rounded-2xl p-5 mb-8"
            style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
          >
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <Field label="Session">
                <div
                  className="flex rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--sidebar-border)" }}
                >
                  {SESSION_KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      title={k.hint}
                      onClick={() => setKind(k.value)}
                      className="px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: kind === k.value ? "var(--primary)" : "var(--background)",
                        color: kind === k.value ? "white" : "var(--muted-foreground)",
                      }}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={kind === "one_on_one" ? "Week of" : "Date"}>
                <input
                  type="date"
                  value={heldOn}
                  onChange={(e) => setHeldOn(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-xl outline-none"
                  style={inputStyle}
                />
              </Field>

              {kind === "beyond_coding" && (
                <Field label="Session name" grow>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={otherTitle || (title && !titleIsListed) ? OTHER : title}
                      onChange={(e) => {
                        const other = e.target.value === OTHER;
                        setOtherTitle(other);
                        setTitle(other ? "" : e.target.value);
                      }}
                      className="flex-1 min-w-48 text-sm px-3 py-1.5 rounded-xl outline-none"
                      style={inputStyle}
                    >
                      <option value="">Choose a session…</option>
                      {bcTitles.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value={OTHER}>Other…</option>
                    </select>
                    {(otherTitle || (title && !titleIsListed)) && (
                      <input
                        type="text"
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Name of the session"
                        className="flex-1 min-w-48 text-sm px-3 py-1.5 rounded-xl outline-none"
                        style={inputStyle}
                      />
                    )}
                  </div>
                </Field>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-xs flex-1 min-w-64" style={{ color: "var(--muted-foreground)" }}>
                {needsTitle
                  ? "Name the Beyond Coding session to start marking."
                  : session
                    ? "Editing a session you already recorded."
                    : "New session. It's created when you save."}{" "}
                Leave someone unmarked if the session wasn't scheduled for them.
              </p>
              {!needsTitle && people.length > 0 && (
                <button
                  type="button"
                  onClick={() => markEveryone("attended")}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Mark unmarked as attended
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-sm py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
                Loading…
              </p>
            ) : people.length === 0 ? (
              <div
                className="text-sm py-6 text-center"
                style={{ color: "var(--muted-foreground)" }}
              >
                {scope === "mine" && inCohort.length > 0 ? (
                  <>
                    <p className="mb-3 max-w-lg mx-auto">
                      {assignmentsFailed ? (
                        <>
                          Mentor assignments couldn&apos;t be read from Notion. Run{" "}
                          <code>supabase/sql/2026-10-15-attendance.sql</code> in the Supabase SQL
                          editor, then reload.
                        </>
                      ) : Object.keys(assignments).length === 0 ? (
                        <>
                          No participant has a mentor from Notion yet. Fill in the Mentor field in
                          Notion, then press Refresh on the founder dashboard to sync it.
                        </>
                      ) : (
                        <>
                          Nobody in Notion has you as their mentor
                          {myName ? (
                            <>
                              {" "}
                              (looked for <strong>{myName}</strong>)
                            </>
                          ) : null}
                          .
                          {unmatchedLabels.length > 0 && (
                            <>
                              {" "}
                              These Mentor values in Notion don&apos;t match any mentor:{" "}
                              <strong>{unmatchedLabels.join(", ")}</strong>. If one is you, ask an
                              admin to set your <code>notion_name</code> to it.
                            </>
                          )}
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setScope("everyone")}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ border: "1px solid var(--sidebar-border)" }}
                    >
                      Show everyone
                    </button>
                  </>
                ) : (
                  "No participants in this cohort yet."
                )}
              </div>
            ) : (
              <div
                className="rounded-xl divide-y"
                style={{ border: "1px solid var(--sidebar-border)", opacity: needsTitle ? 0.5 : 1 }}
              >
                {people.map((p) => {
                  const current = markOf(p.user_id);
                  return (
                    <div
                      key={p.user_id}
                      className="flex flex-wrap items-center gap-3 px-3 py-2"
                      style={{ borderColor: "var(--sidebar-border)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 basis-48">
                        <Avatar row={p} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                            {displayName(p)}
                          </p>
                          {scope === "everyone" && (
                            <p
                              className="text-[11px] truncate"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {mentorOf(p.user_id) ?? "No mentor in Notion"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {STATUSES.map((s) => {
                          const on = current === s.value;
                          return (
                            <button
                              key={s.value}
                              type="button"
                              disabled={needsTitle}
                              onClick={() =>
                                setMarks((prev) => ({ ...prev, [p.user_id]: on ? null : s.value }))
                              }
                              className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                              style={{
                                background: on ? s.color : "transparent",
                                color: on ? "white" : "var(--muted-foreground)",
                                border: `1px solid ${on ? s.color : "var(--sidebar-border)"}`,
                              }}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              {dirty && (
                <button
                  type="button"
                  onClick={() => setMarks({})}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Discard changes
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!dirty || needsTitle || saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save attendance"}
              </button>
            </div>
          </section>

          <RecentSessions
            sessions={sessions}
            records={records.filter((r) => shownIds.has(r.user_id))}
            onOpen={(s) => {
              setKind(s.kind);
              setHeldOn(s.held_on);
              setTitle(s.title ?? "");
              setOtherTitle(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </>
  );
}

/**
 * Everyone's attendance on one screen, one row per participant. Leave,
 * holiday and pause are excused, as in the sheet.
 */
function Summary({
  people,
  sessions,
  records,
  loading,
  mentorOf,
}: {
  people: ParticipantRow[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  loading: boolean;
  /** Passed when showing everyone, to add a Mentor column. */
  mentorOf?: (userId: string) => string | null;
}) {
  const byId = new Map(sessions.map((s) => [s.id, s]));

  const rows = people.map((p) => {
    const mine = records.filter((r) => r.user_id === p.user_id && byId.has(r.session_id));
    const of = (k: SessionKind) =>
      mine.filter((r) => byId.get(r.session_id)!.kind === k).map((r) => r.status);
    const bcTitles = mine
      .filter((r) => r.status === "attended" && byId.get(r.session_id)!.kind === "beyond_coding")
      .map((r) => byId.get(r.session_id)!.title ?? "");
    return {
      p,
      oneOnOne: rateWithCounts(of("one_on_one")),
      mentorHours: rateWithCounts(of("mentor_hours")),
      bc: beyondCodingCoverage(bcTitles),
    };
  });

  if (loading || sessions.length === 0) {
    return (
      <p className="text-sm py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
        {loading
          ? "Loading…"
          : "No attendance recorded for this cohort yet. Record a session to see the summary."}
      </p>
    );
  }

  return (
    <section className="mb-8">
      <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        1:1s and mentor hours: attended out of sessions that counted (leave, holiday and pause
        don't). Beyond Coding: sessions attended at least once, out of{" "}
        {BEYOND_CODING_SESSIONS.length}.
      </p>
      <div
        className="rounded-2xl overflow-x-auto"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "var(--muted-foreground)" }}>
              <Th>Participant</Th>
              {mentorOf && <Th>Mentor</Th>}
              <Th right title="Attended ÷ (attended + absent)">
                1:1s
              </Th>
              <Th right title="Attended ÷ (attended + absent)">
                Mentor hours
              </Th>
              <Th right title="Sessions attended at least once, out of the curriculum">
                Beyond Coding
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, oneOnOne, mentorHours, bc }) => (
              <tr
                key={p.user_id}
                className="border-t"
                style={{ borderColor: "var(--sidebar-border)" }}
              >
                <td className="px-4 py-2" style={{ color: "var(--foreground)" }}>
                  {displayName(p)}
                </td>
                {mentorOf && (
                  <td className="px-4 py-2" style={{ color: "var(--muted-foreground)" }}>
                    {mentorOf(p.user_id) ?? "—"}
                  </td>
                )}
                <RateCell value={oneOnOne} />
                <RateCell value={mentorHours} />
                <td
                  className="px-4 py-2 text-right font-mono"
                  title={
                    bc.missing.length ? `Still to attend: ${bc.missing.join(", ")}` : undefined
                  }
                  style={{
                    color: bc.covered === 0 ? "var(--muted-foreground)" : "var(--foreground)",
                  }}
                >
                  {bc.covered === 0 ? "—" : `${bc.covered}/${bc.total}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentSessions({
  sessions,
  records,
  onOpen,
}: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  onOpen: (s: AttendanceSession) => void;
}) {
  // `records` covers only the people on screen, so this drops sessions other
  // mentors recorded for their own participants, which would read "0/0".
  const withMarks = new Set(records.map((r) => r.session_id));
  const shown = sessions.filter((s) => withMarks.has(s.id));
  if (shown.length === 0) return null;
  return (
    <section>
      <SectionTitle>Recorded sessions</SectionTitle>
      <div
        className="rounded-2xl divide-y"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        {shown.slice(0, 30).map((s) => {
          const mine = records.filter((r) => r.session_id === s.id);
          const attended = mine.filter((r) => r.status === "attended").length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpen(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              <CalendarCheck
                className="w-4 h-4 shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
              <span
                className="font-mono text-xs w-24 shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              >
                {s.held_on}
              </span>
              <span className="flex-1 truncate" style={{ color: "var(--foreground)" }}>
                {kindLabel(s.kind)}
                {s.title ? ` · ${s.title}` : ""}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {attended}/{mine.length} attended
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--sidebar-border)",
  color: "var(--foreground)",
};

function Field({
  label,
  grow,
  children,
}: {
  label: string;
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={grow ? "flex-1 min-w-48" : undefined}>
      <p
        className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
      {children}
    </h3>
  );
}

function Th({
  children,
  right,
  title,
}: {
  children: React.ReactNode;
  right?: boolean;
  title?: string;
}) {
  return (
    <th
      title={title}
      className={`px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] font-semibold ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

interface RateWithCounts {
  rate: number | null;
  attended: number;
  counted: number;
}

function rateWithCounts(statuses: AttendanceStatus[]): RateWithCounts {
  const attended = statuses.filter((s) => s === "attended").length;
  const counted = attended + statuses.filter((s) => s === "absent").length;
  return { rate: attendanceRate(statuses), attended, counted };
}

function RateCell({ value }: { value: RateWithCounts }) {
  const { rate, attended, counted } = value;
  return (
    <td
      className="px-4 py-2 text-right font-mono"
      style={{
        color:
          rate === null
            ? "var(--muted-foreground)"
            : rate < 60
              ? "var(--destructive)"
              : "var(--foreground)",
      }}
    >
      {rate === null ? (
        "—"
      ) : (
        <>
          {rate}%
          <span className="ml-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {attended}/{counted}
          </span>
        </>
      )}
    </td>
  );
}
