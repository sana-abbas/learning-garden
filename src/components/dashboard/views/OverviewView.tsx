import { useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  Sprout,
  Globe2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import type { RosterRow } from "../types";
import { cohortLabel, pct } from "../format";
import { statusStyle } from "../status";
import {
  chapterDropOff,
  cohortEngagement,
  dataQualityIssues,
  fullStackGraduateJobs,
  headlineKpis,
  scopeRows,
  startsByMonth,
  rosterName,
  statusBreakdown,
  trackScores,
  type TrackScope,
} from "../metrics";
import { CF_SLUG, curriculumFor } from "../progress";
import { BarList, ColumnChart, EmptyNote, Panel, StatCard, StatusBar } from "../ui";

/** How many affected records the Data quality panel names before summarising. */
const DQ_LIST_LIMIT = 15;

/**
 * Shown instead of 0 on an outcome nobody has reached yet.
 *
 * Coding Fundamentals has no graduates and no paid projects: the cohort is new
 * and the paid-project column is "N/A" on every row. A 0 there reads as a
 * result — a track that fails everyone — when the truth is that there is
 * nothing to report yet. The em dash says that, and the sub-line says why.
 * Offboarded and Active now keep their real zeros, because those are measured.
 */
const DASH = "—";

/**
 * The Overview's own tabs.
 *
 * Founders asked to read Full Stack and Coding Fundamentals apart from each
 * other, which the all-tracks totals hid: Full Stack is 147 of the 214
 * enrolments, so it drowns out every other track in every headline number.
 *
 * Only the two garden cohorts get a tab. The remaining Notion tracks
 * (Data-Analytics, Test-Automation, Classical ML, the AI curricula) are taught
 * elsewhere and have no chapter data, so a tab for them would be half empty.
 * They stay visible under All and in the track scorecard.
 */
const SCOPES: { value: TrackScope; label: string }[] = [
  { value: "all", label: "All tracks" },
  { value: "full-stack", label: "Full Stack" },
  { value: CF_SLUG, label: "Coding Fundamentals" },
];

/** The tab's own name, for a card explaining why it has nothing to show. */
function scopeLabel(scope: TrackScope): string {
  return SCOPES.find((s) => s.value === scope)?.label ?? "this track";
}

/**
 * The derivation behind each card.
 *
 * Kept to a line or two. These are read standing at a card, not sat down with a
 * spec: anything longer and the panel covers half the page and gets skipped.
 * The reasoning behind each choice lives in metrics.ts, next to the code.
 */
const FORMULAS = {
  activeNow:
    "Notion status = Enrolled. “Active in the garden” means they also opened it in the last 14 days.",
  graduates:
    "People marked Graduated, counted once each. Rate = graduates ÷ people whose 1st Paid Project is “Paid”. Only Full Stack records paid projects.",
  offboarded:
    "Enrolments marked Offboarded. Counts enrolments, so leaving two tracks counts twice.",
  paidWork: "People whose 1st Paid Project is Paid, once each.",
  jobs: "Graduates with Job Status Working for Full Stack",
} as const;

/**
 * The founder overview.
 *
 * Laid out to answer, in order: how many people are there, how many finish,
 * which track finishes them, and where is the data lying to us. Notion's
 * outcome numbers and the garden's engagement numbers sit in separate panels
 * on purpose — a Test-Automation graduate has no garden chapters, so averaging
 * the two would invent a number.
 */
export function OverviewView({ rows }: { rows: RosterRow[] }) {
  const [scope, setScope] = useState<TrackScope>("all");

  // Every panel below reads `scoped`, so switching tab moves the whole page at
  // once. Memoised because the roster is a few hundred rows and each metric
  // walks it several times.
  const scoped = useMemo(() => scopeRows(rows, scope), [rows, scope]);

  const kpis = headlineKpis(scoped);
  const statuses = statusBreakdown(scoped);
  const tracks = trackScores(scoped);
  // `rows`, not `scoped`: this card stays on Full Stack whichever tab is open.
  // Which also means a tab that excludes Full Stack has nothing for it to
  // report — showing Full Stack's fraction on a Coding Fundamentals view would
  // read as that cohort's number.
  const jobs = fullStackGraduateJobs(rows);
  const jobsApply = scope === "all" || scope === "full-stack";
  const months = startsByMonth(scoped);
  const engagement = cohortEngagement(scoped);
  const issues = dataQualityIssues(scoped);

  return (
    <div className="space-y-6">
      <ScopeTabs active={scope} onChange={setScope} />

      {kpis.rosterTotal === 0 ? (
        <EmptyNote>
          {scope === "all"
            ? "The roster is empty. Run the Notion sync (Refresh, above) to load participants."
            : "Nobody is enrolled on this track yet."}
        </EmptyNote>
      ) : (
        <>
          {/* ── Headline ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Sprout}
              label="Active now"
              value={kpis.enrolled}
              sub={`${kpis.paused} paused · ${kpis.activeInGarden} active in the garden`}
              formula={FORMULAS.activeNow}
              accent="var(--status-enrolled)"
              emphasis
            />
            {/* One graduation card, not two. The pair that stood here divided by
                different things — all people ever on the roster, and only the
                enrolments that had ended — and read as a contradiction. */}
            <StatCard
              icon={GraduationCap}
              label="Graduates"
              value={kpis.graduatedPeople || DASH}
              sub={graduationSub(kpis)}
              formula={FORMULAS.graduates}
              accent="var(--status-graduated)"
            />
            <StatCard
              icon={Users}
              label="Offboarded"
              value={kpis.offboarded}
              sub="left before finishing"
              formula={FORMULAS.offboarded}
              accent="var(--status-offboarded)"
            />
            <StatCard
              icon={Briefcase}
              label="Reached paid work"
              value={kpis.tracksPaidWork ? kpis.reachedPaidWork : DASH}
              sub={
                kpis.tracksPaidWork
                  ? `${kpis.reachedSecondPaidWork} reached a second project`
                  : "no paid projects recorded on this track"
              }
              formula={FORMULAS.paidWork}
              accent="var(--primary)"
            />
            {/* The one card that does not follow the tab: always Full Stack.
                It says so in its own sub-line, because an unqualified
                "graduates employed" beside 14 of 17 would be read as belonging
                to whichever tab is open. On a tab that is not Full Stack it
                dashes out, like the other cards with nothing to report. */}
            <StatCard
              icon={Building2}
              label="Grads in work"
              value={!jobsApply || jobs.total === 0 ? DASH : `${jobs.working} of ${jobs.total}`}
              sub={
                !jobsApply
                  ? `not tracked for ${scopeLabel(scope)}`
                  : jobs.total === 0
                    ? "no Full Stack graduates yet"
                    : "Full Stack graduates employed"
              }
              formula={FORMULAS.jobs}
              accent="var(--primary)"
            />
          </div>

          {/* ── Where everyone stands ──
          Counts enrolments, not people, because a status has to belong to one
          enrolment: someone who graduated one track and is now on another
          genuinely sits in two segments. The people figure is spelled out in
          the hint so the two never look like a contradiction. */}
          <Panel
            title="Every enrolment, by current status"
            hint={
              `${kpis.rosterTotal} enrolments by ${kpis.people} people across ${kpis.tracks} ${kpis.tracks === 1 ? "track" : "tracks"}.` +
              (kpis.multiTrack > 0
                ? ` ${kpis.multiTrack} ${kpis.multiTrack === 1 ? "person has" : "people have"} taken more than one track, so ${kpis.multiTrack === 1 ? "they appear" : "they each appear"} in two segments.`
                : "")
            }
          >
            <StatusBar
              segments={statuses.map((s) => ({
                label: s.status,
                count: s.count,
                ...statusStyle(s.status),
              }))}
            />
          </Panel>

          {/* ── The finding: tracks are not equal ──
          Only on All. On a track tab this collapses to the one row the tab is
          already about, and a one-row table says less than the cards above it.
          The full-stack 1.0 / 2.0 split still lives here, under All. */}
          {scope === "all" && (
            <Panel
              title="Outcomes by curriculum track"
              hint="Ranked by graduation rate among ended journeys. Tracks where nobody has finished yet sort last — an unknown rate is not a zero."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
                      {[
                        { label: "Track", align: "left" },
                        { label: "Total", align: "right" },
                        { label: "Enrolled", align: "right" },
                        { label: "Graduated", align: "right" },
                        { label: "Offboarded", align: "right" },
                        { label: "Paid work", align: "right" },
                        { label: "Grad rate", align: "right" },
                      ].map((h) => (
                        <th
                          key={h.label}
                          className={`pb-2 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${
                            h.align === "right" ? "text-right pl-3" : "text-left"
                          }`}
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((t) => (
                      <tr key={t.track} style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
                        <td
                          className="py-2.5 text-[12.5px] font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          {t.track}
                        </td>
                        <td
                          className="py-2.5 pl-3 text-right text-[12.5px] tabular-nums"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {t.total}
                        </td>
                        <td
                          className="py-2.5 pl-3 text-right text-[12.5px] tabular-nums"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {t.enrolled}
                        </td>
                        <td
                          className="py-2.5 pl-3 text-right text-[12.5px] tabular-nums font-semibold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {t.graduated}
                        </td>
                        <td
                          className="py-2.5 pl-3 text-right text-[12.5px] tabular-nums"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {t.offboarded}
                        </td>
                        <td
                          className="py-2.5 pl-3 text-right text-[12.5px] tabular-nums"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {t.reachedPaidWork}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          {t.graduationRate === null ? (
                            <span
                              className="text-[11px]"
                              style={{ color: "var(--muted-foreground)" }}
                              title="No journey on this track has ended yet"
                            >
                              —
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="hidden sm:block h-1.5 w-14 rounded-full overflow-hidden"
                                style={{ background: "var(--sidebar-accent)" }}
                              >
                                <span
                                  className="block h-full"
                                  style={{
                                    width: `${t.graduationRate}%`,
                                    background: "var(--status-graduated)",
                                    borderRadius: 4,
                                  }}
                                />
                              </span>
                              <span
                                className="text-[12.5px] font-semibold tabular-nums"
                                style={{ color: "var(--foreground)" }}
                              >
                                {t.graduationRate}%
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* ── Intake over time ── */}
          <Panel
            title="Enrolments by month"
            hint="From Notion's Start Date. Months with no intake are shown as gaps rather than skipped."
          >
            <ColumnChart data={months} />
          </Panel>

          {/* ── The garden's own numbers, kept separate ── */}
          <Panel
            title="In-app engagement by cohort"
            hint="The garden only teaches Full Stack and Coding Fundamentals, so these are the two cohorts with chapters to complete. Counted from user_progress, not from Notion."
          >
            {engagement.length === 0 ? (
              <EmptyNote>Nobody on the roster has a garden account yet.</EmptyNote>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {engagement.map((c) => (
                  <div
                    key={c.cohort}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--sidebar-border)",
                    }}
                  >
                    <div className="flex items-baseline justify-between mb-3">
                      <h3
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {cohortLabel(c.cohort)}
                      </h3>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {c.participants} with accounts
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          Average progress
                        </span>
                        <span
                          className="text-[12px] font-semibold tabular-nums"
                          style={{ color: "var(--foreground)" }}
                        >
                          {c.avgProgressPct}%
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: "var(--sidebar-accent)" }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${c.avgProgressPct}%`,
                            background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>

                    {/* Each value sits right after its own label, for the reason
                    described on the legend in ui.tsx: spread across the column
                    with justify-between, a value ended up 140px from its label
                    and 16px from the next one along. */}
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                      {[
                        ["Median chapters", `${c.medianChapters} of ${c.totalChapters}`],
                        ["Finished the curriculum", `${c.completedCurriculum}`],
                        ["Active in last 7 days", `${c.active7}`],
                        ["Idle 14+ days", `${c.idle}`],
                        ["Never started", `${c.neverStarted}`],
                        ["Updates this week", `${c.updatesLast7d}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-baseline gap-1.5">
                          <dt style={{ color: "var(--muted-foreground)" }}>{label}</dt>
                          <dd
                            className="font-semibold tabular-nums shrink-0"
                            style={{ color: "var(--foreground)" }}
                          >
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* ── Where people stall ── */}
          {engagement.map((c) => (
            <Panel
              key={c.cohort}
              title={`Where ${cohortLabel(c.cohort)} participants stall`}
              hint={`Of the ${c.participants} with an account, how many have completed each chapter. The chapter where the bar drops sharply is where people give up.`}
            >
              <BarList
                data={chapterDropOff(scoped, c.cohort, curriculumFor(c.cohort)).map((step) => ({
                  label: step.title,
                  value: step.completed,
                  valueLabel: `${step.completed} · ${pct(step.completed, step.total)}%`,
                }))}
                max={c.participants}
              />
            </Panel>
          ))}

          {/* ── Fix at the source, not in code ── */}
          {issues.length > 0 && (
            <Panel
              title="Data quality"
              hint="Gaps in the Notion roster that make the numbers above less certain. Each one is a fix in Notion, not in the app."
            >
              <ul className="space-y-5">
                {issues.map((issue) => (
                  <li key={issue.label} className="flex items-start gap-3">
                    <AlertTriangle
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: "var(--status-paused)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[12.5px] font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {issue.rows.length} · {issue.label}
                      </span>
                      {issue.detail && (
                        <p
                          className="text-[11px] leading-snug"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {issue.detail}
                        </p>
                      )}

                      {/* The records to open, not just how many there are. The
                      email is the identifier to search the roster by; the icon
                      links straight to that Notion entry where we have its
                      URL. Capped so one badly-filled column cannot bury the
                      rest of the panel. */}
                      <ul className="mt-2 space-y-1">
                        {issue.rows.slice(0, DQ_LIST_LIMIT).map((r, i) => (
                          <li
                            key={r.notion_page_id ?? i}
                            className="flex items-baseline gap-2 flex-wrap text-[11px]"
                          >
                            <span style={{ color: "var(--foreground)" }}>{rosterName(r)}</span>
                            {r.email?.trim() ? (
                              <span
                                className="font-mono"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {r.email.trim()}
                              </span>
                            ) : (
                              <span className="italic" style={{ color: "var(--muted-foreground)" }}>
                                no email address
                              </span>
                            )}
                            {r.track && (
                              <span style={{ color: "var(--muted-foreground)" }}>· {r.track}</span>
                            )}
                            {r.notion_page_url && (
                              <a
                                href={r.notion_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open this row in Notion"
                                style={{ color: "var(--primary)" }}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                      {issue.rows.length > DQ_LIST_LIMIT && (
                        <p
                          className="text-[11px] mt-1"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          + {issue.rows.length - DQ_LIST_LIMIT} more
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <p
            className="text-[11px] flex items-start gap-2 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Status, track and paid-project figures come from the Notion roster. Chapter progress,
              streaks and daily updates come from the garden. Where the two disagree about the same
              person, the Attention tab lists them.
            </span>
          </p>
        </>
      )}
    </div>
  );
}

/**
 * The sub-line under the Graduates headline.
 *
 * The headline is a plain count, which needs no denominator; the rate has to
 * name the group it was measured over, or 28 graduates beside a 38% rate reads
 * as an error. Where a track records no paid projects the rate is withheld
 * rather than shown as 0% — nobody reaching a milestone that is not recorded is
 * not the same claim as nobody reaching it.
 */
function graduationSub(kpis: ReturnType<typeof headlineKpis>): string {
  if (kpis.tracksPaidWork) {
    return `${kpis.reachedPaidWork} reached a paid project · ${kpis.graduatedOfPaid} of them graduated (${kpis.graduationRateOfPaid}%)`;
  }
  return kpis.graduatedPeople === 0
    ? "no graduates yet on this track"
    : "no paid projects recorded on this track, so no rate is shown";
}

/** All tracks / Full Stack / Coding Fundamentals, scoping the whole Overview. */
function ScopeTabs({
  active,
  onChange,
}: {
  active: TrackScope;
  onChange: (next: TrackScope) => void;
}) {
  return (
    <div
      className="inline-flex gap-1 p-1 rounded-xl"
      role="tablist"
      aria-label="Curriculum track"
      style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
    >
      {SCOPES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
          style={{
            background: active === value ? "var(--primary)" : "transparent",
            color: active === value ? "white" : "var(--muted-foreground)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
