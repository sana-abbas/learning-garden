import {
  Users,
  GraduationCap,
  TrendingDown,
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
  startsByMonth,
  rosterName,
  statusBreakdown,
  trackScores,
} from "../metrics";
import { curriculumFor } from "../progress";
import { BarList, ColumnChart, EmptyNote, Panel, StatCard, StatusBar } from "../ui";

/** How many affected records the Data quality panel names before summarising. */
const DQ_LIST_LIMIT = 15;

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
  const kpis = headlineKpis(rows);
  const statuses = statusBreakdown(rows);
  const tracks = trackScores(rows);
  const fullStackJobs = fullStackGraduateJobs(rows);
  const months = startsByMonth(rows);
  const engagement = cohortEngagement(rows);
  const issues = dataQualityIssues(rows);

  if (kpis.rosterTotal === 0) {
    return (
      <EmptyNote>
        The roster is empty. Run the Notion sync (Refresh, above) to load participants.
      </EmptyNote>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Headline ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Sprout}
          label="Active now"
          value={kpis.enrolled}
          sub={`${kpis.paused} paused · ${kpis.activeInGarden} active in the garden`}
          accent="var(--status-enrolled)"
          emphasis
        />
        <StatCard
          icon={GraduationCap}
          label="Graduates"
          value={kpis.graduatedPeople}
          sub={`${kpis.graduationRateAllTime}% of all ${kpis.people} people ever enrolled`}
          accent="var(--status-graduated)"
        />
        <StatCard
          icon={TrendingDown}
          label="Graduation rate"
          value={`${kpis.graduationRate}%`}
          sub={`of the ${kpis.graduated + kpis.offboarded} enrolments that have ended`}
          accent="var(--status-graduated)"
        />
        <StatCard
          icon={Users}
          label="Offboarded"
          value={kpis.offboarded}
          sub="left before finishing"
          accent="var(--status-offboarded)"
        />
        <StatCard
          icon={Briefcase}
          label="Reached paid work"
          value={kpis.reachedPaidWork}
          sub={`${kpis.reachedSecondPaidWork} reached a second project`}
          accent="var(--primary)"
        />
        <StatCard
          icon={Building2}
          label="Grads in work"
          value={`${fullStackJobs.working} of ${fullStackJobs.total}`}
          sub="Full Stack graduates employed"
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
          `${kpis.rosterTotal} enrolments by ${kpis.people} people across ${kpis.tracks} tracks.` +
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

      {/* ── The finding: tracks are not equal ── */}
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
                  <h3 className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
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
            data={chapterDropOff(rows, c.cohort, curriculumFor(c.cohort)).map((step) => ({
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
                          <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>
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
                    <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
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
    </div>
  );
}
