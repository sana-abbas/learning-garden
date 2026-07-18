import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Leaf, LogOut, Flame, ChevronDown, ExternalLink,
  MessageCircle, CheckCircle2, Circle, X, Users, TrendingUp, Clock,
  Video, Link as LinkIcon, Eye, ClipboardList, Download, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { STEPS, CURRICULUM_STEPS } from "@/data/curriculum";
import { CF_STEPS, CF_CURRICULUM_STEPS } from "@/data/curriculum-cf";
import type { Submission } from "@/hooks/useProgress";

export const Route = createFileRoute("/mentor")({
  component: MentorDashboard,
});

interface ParticipantRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  submissions: Record<string, Submission>;
  streak_count: number;
  streak_date: string | null;
  updated_at: string;
}

function getCompletion(checked: Record<string, boolean>): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  STEPS.forEach((s) => {
    if (s.subtasks && s.subtasks.length > 0) {
      map[s.id] = s.subtasks.every((sub) => checked[sub.id]);
    } else {
      map[s.id] = !!checked[s.id];
    }
  });
  return map;
}

function getCompletedCount(checked: Record<string, boolean>): number {
  const completion = getCompletion(checked);
  return CURRICULUM_STEPS.filter((s) => completion[s.id]).length;
}

function getCurrentChapter(checked: Record<string, boolean>): string {
  const completion = getCompletion(checked);
  const current = STEPS.find((s) => !completion[s.id]);
  return current?.title ?? "All complete!";
}

function getCFCompletion(checked: Record<string, boolean>): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  CF_STEPS.forEach((s) => {
    if (s.subtasks && s.subtasks.length > 0) {
      map[s.id] = s.subtasks.every((sub) => checked[sub.id]);
    } else {
      map[s.id] = !!checked[s.id];
    }
  });
  return map;
}

function getCFCompletedCount(checked: Record<string, boolean>): number {
  const completion = getCFCompletion(checked);
  return CF_CURRICULUM_STEPS.filter((s) => completion[s.id]).length;
}

function getCFCurrentChapter(checked: Record<string, boolean>): string {
  const completion = getCFCompletion(checked);
  const current = CF_STEPS.find((s) => !completion[s.id]);
  return current?.title ?? "All complete!";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function initials(name: string | null, email: string | null): string {
  const src = name || email?.split("@")[0] || "?";
  return src.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function displayName(p: ParticipantRow): string {
  return p.display_name || p.email?.split("@")[0] || "Anonymous";
}

// ── Avatar component (Google photo with initials fallback) ────────────────────

function Avatar({ row, size = "md" }: { row: ParticipantRow; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!row.avatar_url && !imgError;
  const sizeClass = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  const radiusClass = size === "lg" ? "rounded-2xl" : "rounded-xl";

  return (
    <div className={`${sizeClass} ${radiusClass} overflow-hidden shrink-0 relative`}>
      {showImg ? (
        <img
          src={row.avatar_url!}
          alt={displayName(row)}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${sizeClass}`}
          style={{ background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))", fontSize: undefined }}
        >
          <span>{initials(row.display_name, row.email)}</span>
        </div>
      )}
    </div>
  );
}

// ── Participant detail panel ──────────────────────────────────────────────────

function DetailPanel({ participant, cohortSlug, onClose }: { participant: ParticipantRow; cohortSlug: string; onClose: () => void }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const isCF = cohortSlug === "coding-fundamentals";
  const steps = isCF ? CF_STEPS : STEPS;
  const curriculumSteps = isCF ? CF_CURRICULUM_STEPS : CURRICULUM_STEPS;
  const completion = isCF ? getCFCompletion(participant.checked) : getCompletion(participant.checked);
  const completedCount = curriculumSteps.filter((s) => completion[s.id]).length;

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Collect all chapters that have notes
  const chaptersWithNotes = steps.filter((s) => participant.notes[s.id]);
  // Collect all subtasks that have submissions
  const allSubmissions = steps.flatMap((s) =>
    (s.subtasks ?? []).flatMap((sub) => {
      const submission = participant.submissions[sub.id];
      if (!submission) return [];
      return [{ step: s, sub, submission }];
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-xl h-full flex flex-col overflow-hidden"
        style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--sidebar-border)" }}
      >
        {/* Header */}
        <div className="shrink-0 p-6 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar row={participant} size="lg" />
              <div>
                <p className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                  {displayName(participant)}
                </p>
                {participant.email && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {participant.email}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  {completedCount}/{curriculumSteps.length} chapters · last active {timeAgo(participant.updated_at)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.04 85)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(completedCount / curriculumSteps.length) * 100}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Assignment submissions — quick view */}
          {allSubmissions.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-2.5" style={{ color: "var(--muted-foreground)" }}>
                Submitted assignments
              </p>
              <div className="space-y-2">
                {allSubmissions.map(({ step, sub, submission }) => (
                  <div
                    key={sub.id}
                    className="rounded-xl p-3 space-y-1.5"
                    style={{ background: "oklch(0.97 0.02 130 / 0.5)", border: "1px solid oklch(0.85 0.06 145 / 0.3)" }}
                  >
                    <p className="text-[11px] font-medium leading-snug" style={{ color: "var(--foreground)" }}>
                      {step.title} — {sub.label}
                    </p>
                    {submission.link && (
                      <a href={submission.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: "var(--primary)" }}>
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{submission.link}</span>
                      </a>
                    )}
                    {submission.link2 && (
                      <a href={submission.link2} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: "var(--primary)" }}>
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{submission.link2}</span>
                      </a>
                    )}
                    {submission.video && (
                      <a href={submission.video} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: "var(--bloom-magenta)" }}>
                        <Video className="w-3 h-3 shrink-0" />
                        <span className="truncate">{submission.video}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reflection notes — quick view */}
          {chaptersWithNotes.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-2.5" style={{ color: "var(--muted-foreground)" }}>
                Reflection notes
              </p>
              <div className="space-y-2">
                {chaptersWithNotes.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl p-3"
                    style={{ background: "oklch(0.96 0.03 90 / 0.7)", border: "1px solid var(--sidebar-border)" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--primary)" }}>
                      {step.title}
                    </p>
                    <p className="text-[12.5px] leading-relaxed italic" style={{ color: "var(--foreground)" }}>
                      "{participant.notes[step.id]}"
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Full chapter list */}
          <section>
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-2.5" style={{ color: "var(--muted-foreground)" }}>
              Chapter progress
            </p>
            <div className="space-y-2">
              {steps.map((step) => {
                const isCall = step.kind === "call";
                const isDone = completion[step.id];
                const isOpen = openIds.has(step.id);
                const hasSubs = !!(step.subtasks && step.subtasks.length);
                const note = participant.notes[step.id];
                const callSub = participant.submissions[step.id];
                const subDone = hasSubs ? step.subtasks!.filter((s) => participant.checked[s.id]).length : 0;

                return (
                  <div
                    key={step.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: isDone ? "oklch(0.7 0.15 145 / 0.3)" : "var(--sidebar-border)",
                      background: isDone ? "var(--sidebar-accent)" : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                      onClick={() => hasSubs && toggleOpen(step.id)}
                    >
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
                        : <Circle className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                            {step.title}
                          </span>
                          {isCall && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: "oklch(0.94 0.04 340)", color: "var(--bloom-magenta)" }}>
                              Call
                            </span>
                          )}
                        </div>
                        {hasSubs && (
                          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                            {subDone}/{step.subtasks!.length} tasks
                          </span>
                        )}
                        {isCall && callSub?.claimedAt && (
                          <span className="text-[11px]" style={{ color: "var(--primary)" }}>
                            Claimed {new Date(callSub.claimedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      {hasSubs && (
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      )}
                    </button>

                    {hasSubs && isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: "var(--sidebar-border)" }}>
                        <ul className="space-y-1 pt-2">
                          {step.subtasks!.map((sub) => {
                            const subChecked = !!participant.checked[sub.id];
                            const subSubmission = participant.submissions[sub.id];
                            return (
                              <li key={sub.id} className="flex items-start gap-2 py-1">
                                {subChecked
                                  ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
                                  : <Circle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                }
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="text-[12.5px] leading-snug"
                                    style={{
                                      color: subChecked ? "var(--muted-foreground)" : "var(--sidebar-foreground)",
                                      textDecoration: subChecked ? "line-through" : "none",
                                    }}
                                  >
                                    {sub.label}
                                  </span>
                                  {subSubmission && (
                                    <div className="mt-1 space-y-0.5">
                                      {subSubmission.link && (
                                        <a href={subSubmission.link} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] hover:underline"
                                          style={{ color: "var(--primary)" }}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          <span className="truncate">{subSubmission.link}</span>
                                        </a>
                                      )}
                                      {subSubmission.link2 && (
                                        <a href={subSubmission.link2} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] hover:underline"
                                          style={{ color: "var(--primary)" }}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          <span className="truncate">{subSubmission.link2}</span>
                                        </a>
                                      )}
                                      {subSubmission.video && (
                                        <a href={subSubmission.video} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] hover:underline"
                                          style={{ color: "var(--bloom-magenta)" }}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          Video
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        {note && (
                          <div
                            className="rounded-xl p-3"
                            style={{ background: "oklch(0.95 0.03 85)", border: "1px solid var(--sidebar-border)" }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <MessageCircle className="w-3 h-3" style={{ color: "var(--primary)" }} />
                              <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>
                                Reflection
                              </span>
                            </div>
                            <p className="text-[12.5px] leading-relaxed italic" style={{ color: "var(--foreground)" }}>
                              "{note}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Participant card ──────────────────────────────────────────────────────────

function ParticipantCard({ p, cohortSlug, onClick }: { p: ParticipantRow; cohortSlug: string; onClick: () => void }) {
  const isCF = cohortSlug === "coding-fundamentals";
  const curriculumSteps = isCF ? CF_CURRICULUM_STEPS : CURRICULUM_STEPS;
  const completedCount = isCF ? getCFCompletedCount(p.checked) : getCompletedCount(p.checked);
  const pct = Math.round((completedCount / curriculumSteps.length) * 100);
  const isIdle = Date.now() - new Date(p.updated_at).getTime() > 7 * 86400000;
  const currentChapter = isCF ? getCFCurrentChapter(p.checked) : getCurrentChapter(p.checked);
  const hasNotes = Object.values(p.notes).some(Boolean);
  const submissionCount = Object.values(p.submissions).filter(Boolean).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
      style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
    >
      {/* Top row — avatar + name + idle badge */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar row={p} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {displayName(p)}
            </span>
            {isIdle && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: "oklch(0.95 0.05 50)", color: "oklch(0.55 0.15 50)" }}
              >
                Idle
              </span>
            )}
          </div>
          {p.email && (
            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {p.email}
            </p>
          )}
        </div>
      </div>

      {/* Currently on */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
          Currently on
        </p>
        <p className="text-[12.5px] font-medium leading-snug" style={{ color: "var(--foreground)" }}>
          {currentChapter}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono" style={{ color: "var(--muted-foreground)" }}>
            {completedCount}/{curriculumSteps.length} chapters
          </span>
          {p.streak_count > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3" style={{ color: "oklch(0.65 0.18 55)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "oklch(0.55 0.15 50)" }}>
                {p.streak_count}
              </span>
            </div>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.04 85)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
            }}
          />
        </div>
      </div>

      {/* Bottom row — last seen + submission/notes count */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {timeAgo(p.updated_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {submissionCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.92 0.07 145 / 0.4)", color: "var(--primary)" }}>
              {submissionCount} {submissionCount === 1 ? "submission" : "submissions"}
            </span>
          )}
          {hasNotes && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.94 0.04 85 / 0.5)", color: "oklch(0.55 0.12 85)" }}>
              notes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Daily updates ─────────────────────────────────────────────────────────────

interface DailyUpdateRow {
  id: string;
  user_id: string;
  date: string;
  today: string;
  tomorrow: string;
  blockers: string | null;
  created_at: string;
}

function exportCSV(
  updates: DailyUpdateRow[],
  participants: ParticipantRow[],
  cohortMemberMap: Record<string, string>,
) {
  const header = ["Date", "Name", "Email", "Cohort", "What I did today", "What I'll do tomorrow", "Blockers"];
  const rows = updates.map((u) => {
    const p = participants.find((pr) => pr.user_id === u.user_id);
    const name = p ? (p.display_name || p.email?.split("@")[0] || "Anonymous") : u.user_id;
    const email = p?.email ?? "";
    const cohort = cohortMemberMap[u.user_id] ?? "full-stack";
    const cohortLabel = cohort === "coding-fundamentals" ? "Coding Fundamentals" : "Full Stack";
    return [u.date, name, email, cohortLabel, u.today, u.tomorrow, u.blockers ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-updates-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main mentor dashboard ─────────────────────────────────────────────────────

function MentorDashboard() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [cohortMemberMap, setCohortMemberMap] = useState<Record<string, string>>({});
  const [cohortTab, setCohortTab] = useState<"full-stack" | "coding-fundamentals">("full-stack");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ParticipantRow | null>(null);
  const [selectedCohortSlug, setSelectedCohortSlug] = useState<string>("full-stack");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"progress" | "active" | "streak">("progress");

  // Daily updates view
  const [view, setView] = useState<"participants" | "daily-updates" | "assignments">("participants");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentCohort, setAssignmentCohort] = useState<"all" | "full-stack" | "coding-fundamentals">("all");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdateRow[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [updateSearch, setUpdateSearch] = useState("");
  const [updateCohort, setUpdateCohort] = useState<"all" | "full-stack" | "coding-fundamentals">("all");
  const [updateDateFrom, setUpdateDateFrom] = useState("");
  const [updateDateTo, setUpdateDateTo] = useState("");
  const [todayUpdateUserIds, setTodayUpdateUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUser(session.user);

      const { data: mentorRow } = await supabase
        .from("mentors")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!mentorRow) { navigate({ to: "/" }); return; }

      const today = new Date().toISOString().split("T")[0];
      const [{ data }, { data: members }, { data: todayUpdates }, { data: allMentors }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("user_id, display_name, email, avatar_url, checked, notes, submissions, streak_count, streak_date, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("cohort_members")
          .select("user_id, cohorts(slug)"),
        supabase
          .from("daily_updates")
          .select("user_id")
          .eq("date", today),
        supabase
          .from("mentors")
          .select("user_id"),
      ]);
      setTodayUpdateUserIds(new Set((todayUpdates || []).map((r: { user_id: string }) => r.user_id)));

      const mentorUserIds = new Set((allMentors || []).map((m: { user_id: string }) => m.user_id));

      const map: Record<string, string> = {};
      (members || []).forEach((m: any) => {
        map[m.user_id] = m.cohorts?.slug ?? "full-stack";
      });
      setCohortMemberMap(map);
      setParticipants(((data as ParticipantRow[]) || []).filter((p) => !mentorUserIds.has(p.user_id)));
      setLoading(false);
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const fetchDailyUpdates = async () => {
    if (loadingUpdates) return;
    setLoadingUpdates(true);
    const { data } = await supabase
      .from("daily_updates")
      .select("id, user_id, date, today, tomorrow, blockers, created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setDailyUpdates((data as DailyUpdateRow[]) || []);
    setLoadingUpdates(false);
  };

  const cohortParticipants = participants.filter((p) => {
    const slug = cohortMemberMap[p.user_id] ?? "full-stack";
    return slug === cohortTab;
  });

  const filtered = cohortParticipants
    .filter((p) => {
      const name = displayName(p).toLowerCase();
      const email = (p.email || "").toLowerCase();
      const q = search.toLowerCase();
      return name.includes(q) || email.includes(q);
    })
    .sort((a, b) => {
      const isCF = cohortTab === "coding-fundamentals";
      const getCount = isCF ? getCFCompletedCount : getCompletedCount;
      if (sort === "progress") return getCount(b.checked) - getCount(a.checked);
      if (sort === "streak") return (b.streak_count || 0) - (a.streak_count || 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const isCFTab = cohortTab === "coding-fundamentals";
  const getCount = isCFTab ? getCFCompletedCount : getCompletedCount;

  const postedToday = cohortParticipants.filter((p) => todayUpdateUserIds.has(p.user_id)).length;
  const atRisk = cohortParticipants.filter((p) => {
    const diff = Date.now() - new Date(p.updated_at).getTime();
    return diff > 7 * 86400000;
  }).length;
  const onStreak = cohortParticipants.filter((p) => (p.streak_count || 0) > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b px-6 py-4 flex items-center gap-4" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))" }}
        >
          <Leaf className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-base tracking-tight" style={{ color: "var(--foreground)" }}>
            Code Blossom
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
            Mentor Dashboard
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/", search: { garden: true } })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
          style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          title="Preview Full Stack garden"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Full Stack</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/cf" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
          style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          title="Preview CF garden"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CF</span>
        </button>
        <button type="button" onClick={toggleTheme} className="p-2 rounded-xl transition-colors" style={{ color: "var(--muted-foreground)" }}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button type="button" onClick={handleSignOut} className="p-2 rounded-xl transition-colors" style={{ color: "var(--muted-foreground)" }} title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Top-level view tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("participants")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: view === "participants" ? "var(--primary)" : "var(--sidebar)",
                color: view === "participants" ? "white" : "var(--muted-foreground)",
                border: "1px solid var(--sidebar-border)",
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Participants
            </button>
            <button
              type="button"
              onClick={() => { setView("daily-updates"); fetchDailyUpdates(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: view === "daily-updates" ? "var(--primary)" : "var(--sidebar)",
                color: view === "daily-updates" ? "white" : "var(--muted-foreground)",
                border: "1px solid var(--sidebar-border)",
              }}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Daily Updates
            </button>
            <button
              type="button"
              onClick={() => setView("assignments")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: view === "assignments" ? "var(--primary)" : "var(--sidebar)",
                color: view === "assignments" ? "white" : "var(--muted-foreground)",
                border: "1px solid var(--sidebar-border)",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assignments
            </button>
          </div>
        </div>

        {view === "participants" && (
          <>
            {/* Cohort tabs */}
            <div className="flex gap-2 mb-6">
              {([
                { slug: "full-stack", label: "Full Stack" },
                { slug: "coding-fundamentals", label: "Coding Fundamentals" },
              ] as const).map(({ slug, label }) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setCohortTab(slug)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: cohortTab === slug ? "var(--primary)" : "var(--sidebar)",
                    color: cohortTab === slug ? "white" : "var(--muted-foreground)",
                    border: "1px solid var(--sidebar-border)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { icon: Users, label: "Total participants", value: cohortParticipants.length, sub: "in this cohort", accent: "var(--muted-foreground)" },
                { icon: ClipboardList, label: "Posted today", value: postedToday, sub: `of ${cohortParticipants.length}`, accent: "var(--primary)" },
                { icon: Clock, label: "At risk", value: atRisk, sub: "no activity 7+ days", accent: "oklch(0.55 0.15 50)" },
                { icon: Flame, label: "On a streak", value: onStreak, sub: `of ${cohortParticipants.length}`, accent: "oklch(0.65 0.18 55)" },
              ].map(({ icon: Icon, label, value, sub, accent }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                    <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>
                      {label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-serif" style={{ color: "var(--foreground)" }}>{value}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-3 mb-6">
              <input
                type="text"
                placeholder="Search participants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)", color: "var(--foreground)" }}
              />
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--sidebar-border)" }}>
                {(["progress", "active", "streak"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSort(s)}
                    className="px-3 py-2.5 text-xs font-medium capitalize transition-colors"
                    style={{
                      background: sort === s ? "var(--primary)" : "var(--sidebar)",
                      color: sort === s ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Card grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20" style={{ color: "var(--muted-foreground)" }}>
                {search ? "No participants match your search." : "No participants yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <ParticipantCard
                    key={p.user_id}
                    p={p}
                    cohortSlug={cohortMemberMap[p.user_id] ?? "full-stack"}
                    onClick={() => {
                      setSelected(p);
                      setSelectedCohortSlug(cohortMemberMap[p.user_id] ?? "full-stack");
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === "daily-updates" && (() => {
          const filteredUpdates = dailyUpdates.filter((u) => {
            const p = participants.find((pr) => pr.user_id === u.user_id);
            const name = (p?.display_name || p?.email?.split("@")[0] || "").toLowerCase();
            const email = (p?.email || "").toLowerCase();
            const q = updateSearch.toLowerCase();
            const matchesSearch = !q || name.includes(q) || email.includes(q);
            const cohort = cohortMemberMap[u.user_id] ?? "full-stack";
            const matchesCohort = updateCohort === "all" || cohort === updateCohort;
            const matchesFrom = !updateDateFrom || u.date >= updateDateFrom;
            const matchesTo = !updateDateTo || u.date <= updateDateTo;
            return matchesSearch && matchesCohort && matchesFrom && matchesTo;
          });

          return (
            <>
              {/* Filters + export */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                  <Filter className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Filter</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={updateSearch}
                  onChange={(e) => setUpdateSearch(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)", color: "var(--foreground)", minWidth: "160px" }}
                />
                <select
                  value={updateCohort}
                  onChange={(e) => setUpdateCohort(e.target.value as typeof updateCohort)}
                  className="text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)", color: "var(--foreground)" }}
                >
                  <option value="all">All cohorts</option>
                  <option value="full-stack">Full Stack</option>
                  <option value="coding-fundamentals">Coding Fundamentals</option>
                </select>
                <input
                  type="date"
                  value={updateDateFrom}
                  onChange={(e) => setUpdateDateFrom(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)", color: "var(--foreground)" }}
                />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>to</span>
                <input
                  type="date"
                  value={updateDateTo}
                  onChange={(e) => setUpdateDateTo(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)", color: "var(--foreground)" }}
                />
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => exportCSV(filteredUpdates, participants, cohortMemberMap)}
                  disabled={filteredUpdates.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {/* Table */}
              {loadingUpdates ? (
                <div className="flex justify-center py-20">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)" }} />
                </div>
              ) : filteredUpdates.length === 0 ? (
                <div className="text-center py-20" style={{ color: "var(--muted-foreground)" }}>
                  No daily updates found.
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--sidebar-border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--sidebar)", borderBottom: "1px solid var(--sidebar-border)" }}>
                          {["Date", "Participant", "Cohort", "What I did today", "What I'll do tomorrow", "Blockers"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUpdates.map((u, i) => {
                          const p = participants.find((pr) => pr.user_id === u.user_id);
                          const name = p?.display_name || p?.email?.split("@")[0] || "Unknown";
                          const cohort = cohortMemberMap[u.user_id] ?? "full-stack";
                          const cohortLabel = cohort === "coding-fundamentals" ? "Coding Fundamentals" : "Full Stack";
                          return (
                            <tr
                              key={u.id}
                              style={{
                                background: i % 2 === 0 ? "transparent" : "var(--sidebar-accent)",
                                borderBottom: "1px solid var(--sidebar-border)",
                              }}
                            >
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                                {u.date}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-medium text-[13px]" style={{ color: "var(--foreground)" }}>{name}</div>
                                {p?.email && <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{p.email}</div>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: "oklch(0.92 0.07 145 / 0.3)", color: "var(--primary)" }}>
                                  {cohortLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{u.today}</p>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{u.tomorrow}</p>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                {u.blockers
                                  ? <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(0.55 0.15 50)" }}>{u.blockers}</p>
                                  : <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 text-[11px]" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--sidebar-border)" }}>
                    {filteredUpdates.length} {filteredUpdates.length === 1 ? "update" : "updates"}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {view === "assignments" && (() => {
          // Flatten all submissions across all participants
          const allSteps = [...STEPS, ...CF_STEPS];
          const subtaskMap: Record<string, { chapterTitle: string; subtaskLabel: string }> = {};
          allSteps.forEach((s) => {
            (s.subtasks ?? []).forEach((sub) => {
              subtaskMap[sub.id] = { chapterTitle: s.title, subtaskLabel: sub.label };
            });
          });

          const rows = participants.flatMap((p) =>
            Object.entries(p.submissions).map(([subId, sub]) => ({
              participantName: p.display_name || p.email?.split("@")[0] || "Unknown",
              cohort: cohortMemberMap[p.user_id] ?? "full-stack",
              subId,
              chapter: subtaskMap[subId]?.chapterTitle ?? subId,
              exercise: subtaskMap[subId]?.subtaskLabel ?? subId,
              submittedAt: sub.submittedAt,
              paste: sub.paste ?? "",
              link: sub.link ?? "",
              link2: sub.link2 ?? "",
              rowKey: `${p.user_id}__${subId}`,
            }))
          ).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

          const q = assignmentSearch.trim().toLowerCase();
          const filtered = rows.filter((r) => {
            if (assignmentCohort !== "all" && r.cohort !== assignmentCohort) return false;
            if (q && !r.participantName.toLowerCase().includes(q) && !r.chapter.toLowerCase().includes(q) && !r.exercise.toLowerCase().includes(q)) return false;
            return true;
          });

          return (
            <>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex gap-1.5">
                  {([
                    { value: "all", label: "All" },
                    { value: "full-stack", label: "Full Stack" },
                    { value: "coding-fundamentals", label: "Coding Fundamentals" },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAssignmentCohort(value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: assignmentCohort === value ? "var(--primary)" : "var(--sidebar)",
                        color: assignmentCohort === value ? "white" : "var(--muted-foreground)",
                        border: "1px solid var(--sidebar-border)",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    type="text"
                    placeholder="Search by name or exercise…"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2"
                    style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)", color: "var(--foreground)" }}
                  />
                </div>
                <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {filtered.length} {filtered.length === 1 ? "submission" : "submissions"}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No submissions found.
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--sidebar-border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--sidebar)", borderBottom: "1px solid var(--sidebar-border)" }}>
                          {["Date", "Participant", "Cohort", "Chapter", "Exercise", "Answer"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r, i) => {
                          const isExpanded = expandedAssignmentId === r.rowKey;
                          const cohortLabel = r.cohort === "coding-fundamentals" ? "Coding Fundamentals" : "Full Stack";
                          const dateStr = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—";
                          return (
                            <tr
                              key={r.rowKey}
                              style={{
                                background: i % 2 === 0 ? "transparent" : "var(--sidebar)",
                                borderBottom: "1px solid var(--sidebar-border)",
                              }}
                            >
                              <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{dateStr}</td>
                              <td className="px-4 py-3 text-[13px] font-medium whitespace-nowrap" style={{ color: "var(--foreground)" }}>{r.participantName}</td>
                              <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{cohortLabel}</td>
                              <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "var(--foreground)" }}>{r.chapter}</td>
                              <td className="px-4 py-3 text-[12px] max-w-[180px] truncate" style={{ color: "var(--foreground)" }}>{r.exercise}</td>
                              <td className="px-4 py-3 max-w-xs">
                                {r.paste ? (
                                  <div>
                                    <p
                                      className={`text-[12px] leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}
                                      style={{ color: "var(--foreground)" }}
                                    >
                                      {r.paste}
                                    </p>
                                    {r.paste.length > 120 && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedAssignmentId(isExpanded ? null : r.rowKey)}
                                        className="text-[11px] mt-1"
                                        style={{ color: "var(--primary)" }}
                                      >
                                        {isExpanded ? "Show less" : "Show more"}
                                      </button>
                                    )}
                                    {(r.link || r.link2) && (
                                      <div className="mt-1.5 flex flex-col gap-1">
                                        {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px]" style={{ color: "var(--primary)" }}><LinkIcon className="w-3 h-3" /><span className="truncate max-w-[160px]">{r.link}</span></a>}
                                        {r.link2 && <a href={r.link2} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px]" style={{ color: "var(--primary)" }}><LinkIcon className="w-3 h-3" /><span className="truncate max-w-[160px]">{r.link2}</span></a>}
                                      </div>
                                    )}
                                  </div>
                                ) : (r.link || r.link2) ? (
                                  <div className="flex flex-col gap-1">
                                    {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px]" style={{ color: "var(--primary)" }}><LinkIcon className="w-3 h-3" /><span className="truncate max-w-[160px]">{r.link}</span></a>}
                                    {r.link2 && <a href={r.link2} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px]" style={{ color: "var(--primary)" }}><LinkIcon className="w-3 h-3" /><span className="truncate max-w-[160px]">{r.link2}</span></a>}
                                  </div>
                                ) : (
                                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          );
        })()}

      </div>

      {selected && (
        <DetailPanel participant={selected} cohortSlug={selectedCohortSlug} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
