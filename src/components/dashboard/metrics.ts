import type { RosterRow } from "./types";
import { STATUS_ORDER } from "./types";
import { DAY_MS, median, pct } from "./format";
import {
  CF_SLUG,
  completedCountFor,
  completionFor,
  gardenCohortForTrack,
  isGraduate,
  totalChapters,
  trackUsesGarden,
} from "./progress";

/**
 * Every number the founder dashboard shows, derived here rather than in JSX.
 *
 * Two vocabularies are deliberately kept apart:
 *
 *   * Notion's **track** and **status** answer outcome questions — who
 *     graduated, who left, which track works. Notion is the system of record
 *     for these, and it has seven tracks where the app has two curricula.
 *   * The garden's **cohort** and chapter progress answer engagement questions
 *     — who is moving, who has stalled. Only full-stack and Coding
 *     Fundamentals have a curriculum, so chapter counts exist only for those.
 *
 * Mixing them produces numbers that look authoritative and are wrong (a
 * Test-Automation graduate has no garden chapters to complete), so no metric
 * below crosses the two except the mismatch checks, which exist precisely to
 * report the disagreement.
 */

export const IDLE_DAYS = 14;

export type StatusName = (typeof STATUS_ORDER)[number] | string;

// ── Row-level helpers ────────────────────────────────────────────────────────

export function rosterName(r: RosterRow): string {
  return r.full_name || r.display_name || r.email?.split("@")[0] || "Unnamed";
}

export function isOnRoster(r: RosterRow): boolean {
  return !!r.notion_page_id;
}

export function isInApp(r: RosterRow): boolean {
  return !!r.user_id;
}

/**
 * Identifies the human behind a row, so the same person on two rows is counted
 * once where that matters.
 *
 * A participant who finishes one track and joins another gets a second Notion
 * row, which is correct — the two enrolments have their own tracks, dates,
 * mentors and outcomes. It does mean a roster row is an *enrolment*, not a
 * person, and anything that says "how many people" has to dedupe.
 *
 * Email is the key, matched case-insensitively, since that is what Notion and
 * the garden are joined on. Rows with no email fall back to their own id, which
 * counts them as their own person — the safe direction, since merging two
 * unidentifiable rows would silently lose someone.
 */
export function personKey(r: RosterRow): string {
  const email = r.email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  if (r.user_id) return `user:${r.user_id}`;
  return `page:${r.notion_page_id ?? Math.random()}`;
}

/** Distinct humans in `rows`, collapsing anyone with more than one enrolment. */
export function countPeople(rows: RosterRow[]): number {
  return new Set(rows.map(personKey)).size;
}

/** People with more than one roster row — i.e. who have taken another track. */
export function countMultiTrackPeople(rows: RosterRow[]): number {
  const seen = new Map<string, number>();
  rows.filter(isOnRoster).forEach((r) => {
    const key = personKey(r);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return [...seen.values()].filter((n) => n > 1).length;
}

// ── Track scope, for the Overview tabs ───────────────────────────────────────

/**
 * Which slice of the roster the Overview is showing.
 *
 * "all" is every track including the five the garden does not teach; the other
 * two are the cohorts with a curriculum. Scoping is by Notion's Curriculum
 * Track, not by the garden account, so someone enrolled on Full Stack who has
 * never signed in still counts towards Full Stack — which is the whole point of
 * asking "how is this track doing".
 */
export type TrackScope = "all" | "full-stack" | typeof CF_SLUG;

/**
 * Notion has "full-stack 1.0" and "full-stack 2.0" as separate options and will
 * have more; gardenCohortForTrack() already folds them by prefix, so a new
 * version appears in the right tab without a code change.
 */
export function inScope(r: RosterRow, scope: TrackScope): boolean {
  if (scope === "all") return true;
  return gardenCohortForTrack(r.track) === scope;
}

export function scopeRows(rows: RosterRow[], scope: TrackScope): RosterRow[] {
  return scope === "all" ? rows : rows.filter((r) => inScope(r, scope));
}

/** Days since this participant last touched the garden; null if never. */
export function idleDays(r: RosterRow): number | null {
  if (!r.last_active) return null;
  return Math.floor((Date.now() - new Date(r.last_active).getTime()) / DAY_MS);
}

/**
 * Chapters completed, but only where the app actually has a curriculum for
 * them. Returns null for a track the garden does not teach — which reads as
 * "not applicable" on the dashboard rather than a misleading zero.
 */
export function appProgress(r: RosterRow): { done: number; total: number } | null {
  if (!r.user_id || !r.app_cohort || !r.checked) return null;
  const total = totalChapters(r.app_cohort);
  if (total === 0) return null;
  return { done: completedCountFor(r.app_cohort, r.checked), total };
}

/** Completed the whole in-app curriculum. Distinct from Notion's "Graduated". */
export function completedGarden(r: RosterRow): boolean {
  if (!r.app_cohort || !r.checked) return false;
  return isGraduate(r.app_cohort, r.checked);
}

// ── Headline KPIs ────────────────────────────────────────────────────────────

export interface HeadlineKpis {
  /**
   * Roster rows — i.e. **enrolments**, not people. Someone who finished one
   * track and joined another counts twice here, which is right for asking
   * "how many enrolments have we run".
   */
  rosterTotal: number;
  /** Distinct humans behind those enrolments. */
  people: number;
  /** How many of them have enrolled on more than one track. */
  multiTrack: number;
  enrolled: number;
  paused: number;
  graduated: number;
  offboarded: number;
  /** Applied + accepted-but-not-enrolled — the top of the funnel. */
  pipeline: number;
  declined: number;
  /** Distinct people who have graduated at least one track. */
  graduatedPeople: number;
  /**
   * Of the people who reached a first paid project, how many also graduated.
   *
   * The denominator is `reachedPaidWork`, so numerator and denominator describe
   * the same population — the previous all-time rate divided graduates by the
   * entire roster, which included applicants and declined candidates who were
   * never enrolled at all, and sank every time a new application was added.
   *
   * Both halves are measured on the same enrolment: "graduated" and "paid" have
   * to be true of one row, not of two different tracks the person took.
   */
  graduatedOfPaid: number;
  /** graduatedOfPaid ÷ reachedPaidWork. Meaningless where nothing is recorded. */
  graduationRateOfPaid: number;
  /**
   * True when this scope records paid projects at all.
   *
   * Only the Full Stack tracks use the "1st Paid Project" column — every Coding
   * Fundamentals row is "N/A" and the remaining tracks are blank. Without this,
   * a cohort that has simply never recorded a paid project is indistinguishable
   * from one where nobody ever reached one, and the card would read 0%.
   */
  tracksPaidWork: boolean;
  reachedPaidWork: number;
  reachedSecondPaidWork: number;
  countries: number;
  tracks: number;
  /** Roster rows with a garden account. */
  inApp: number;
  /** Currently enrolled and using the garden in the last IDLE_DAYS. */
  activeInGarden: number;
}

export function headlineKpis(rows: RosterRow[]): HeadlineKpis {
  const roster = rows.filter(isOnRoster);
  const by = (status: string) => roster.filter((r) => r.status === status).length;

  const graduated = by("Graduated");
  const offboarded = by("Offboarded");

  const activeInGarden = roster.filter((r) => {
    if (r.status !== "Enrolled") return false;
    const days = idleDays(r);
    return days !== null && days <= IDLE_DAYS;
  }).length;

  const people = countPeople(roster);
  const graduatedPeople = countPeople(roster.filter((r) => r.status === "Graduated"));

  // "Paid" only. "Unpaid" and "N/A" are both recorded values that mean the
  // person did not reach a paid project, and neither belongs in this population.
  const paidRows = roster.filter((r) => r.paid_project_1 === "Paid");
  const reachedPaidWork = countPeople(paidRows);
  const graduatedOfPaid = countPeople(paidRows.filter((r) => r.status === "Graduated"));

  return {
    rosterTotal: roster.length,
    people,
    multiTrack: countMultiTrackPeople(roster),
    enrolled: by("Enrolled"),
    paused: by("Paused"),
    graduated,
    offboarded,
    pipeline: by("Applied") + by("Accepted; not yet enrolled"),
    declined: by("Declined"),
    graduatedPeople,
    graduatedOfPaid,
    graduationRateOfPaid: pct(graduatedOfPaid, reachedPaidWork),
    tracksPaidWork: reachedPaidWork > 0,
    // Per person: someone paid on two tracks has still reached paid work once.
    reachedPaidWork,
    reachedSecondPaidWork: countPeople(roster.filter((r) => r.paid_project_2 === "Paid")),
    countries: new Set(roster.map((r) => normaliseCountry(r.country)).filter(Boolean)).size,
    tracks: new Set(roster.map((r) => r.track).filter(Boolean)).size,
    inApp: roster.filter(isInApp).length,
    activeInGarden,
  };
}

/**
 * Country is free text in Notion, so it has drifted — "Zimbabwean" alongside
 * proper country names. Trimming and title-casing collapses casing and spacing
 * variants; a demonym is left alone rather than guessed at, and shows up in the
 * data-quality panel so it gets fixed at the source instead of in code.
 */
export function normaliseCountry(country: string | null | undefined): string {
  const trimmed = country?.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// ── Breakdowns ───────────────────────────────────────────────────────────────

export interface StatusCount {
  status: string;
  count: number;
}

export function statusBreakdown(rows: RosterRow[]): StatusCount[] {
  const roster = rows.filter(isOnRoster);
  const counts = new Map<string, number>();
  roster.forEach((r) => {
    const key = r.status ?? "No status";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  // Known statuses in journey order first, then anything unexpected.
  const known = STATUS_ORDER.filter((s) => counts.has(s)).map((s) => ({
    status: s as string,
    count: counts.get(s)!,
  }));
  const extra = [...counts.entries()]
    .filter(([s]) => !(STATUS_ORDER as readonly string[]).includes(s))
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
  return [...known, ...extra];
}

/**
 * Outcomes per Notion track. Sorted by graduation rate because the ranking is
 * the finding — the tracks differ enormously and the roster order hides it.
 * Tracks with no completed journeys sort last: a 0% rate and an unknown rate
 * are not the same claim.
 */
export interface TrackScore {
  track: string;
  total: number;
  enrolled: number;
  paused: number;
  graduated: number;
  offboarded: number;
  ended: number;
  graduationRate: number | null;
  reachedPaidWork: number;
}

export function trackScores(rows: RosterRow[]): TrackScore[] {
  const groups = groupBy(rows.filter(isOnRoster), (r) => r.track ?? "No track");

  return [...groups.entries()]
    .map(([track, members]) => {
      const graduated = members.filter((r) => r.status === "Graduated").length;
      const offboarded = members.filter((r) => r.status === "Offboarded").length;
      const ended = graduated + offboarded;
      return {
        track,
        total: members.length,
        enrolled: members.filter((r) => r.status === "Enrolled").length,
        paused: members.filter((r) => r.status === "Paused").length,
        graduated,
        offboarded,
        ended,
        graduationRate: ended > 0 ? pct(graduated, ended) : null,
        reachedPaidWork: members.filter((r) => r.paid_project_1 === "Paid").length,
      };
    })
    .sort((a, b) => {
      if (a.graduationRate === null && b.graduationRate === null) return b.total - a.total;
      if (a.graduationRate === null) return 1;
      if (b.graduationRate === null) return -1;
      if (b.graduationRate !== a.graduationRate) return b.graduationRate - a.graduationRate;
      return b.total - a.total;
    });
}

/** Enrolments per calendar month, oldest first, with empty months filled in. */
export function startsByMonth(rows: RosterRow[]): { month: string; count: number }[] {
  const dates = rows
    .filter(isOnRoster)
    .map((r) => r.start_date)
    .filter((d): d is string => !!d)
    .map((d) => d.slice(0, 7))
    .sort();
  if (dates.length === 0) return [];

  const counts = new Map<string, number>();
  dates.forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1));

  // Gaps matter — a month with no intake should read as a trough, not vanish.
  const out: { month: string; count: number }[] = [];
  const [firstYear, firstMonth] = dates[0].split("-").map(Number);
  const [lastYear, lastMonth] = dates[dates.length - 1].split("-").map(Number);
  const cursor = new Date(Date.UTC(firstYear, firstMonth - 1, 1));
  const end = new Date(Date.UTC(lastYear, lastMonth - 1, 1));

  while (cursor <= end) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ month: key, count: counts.get(key) ?? 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

// ── Job outcomes ─────────────────────────────────────────────────────────────

export interface JobOutcomes {
  /** People in scope. */
  total: number;
  /** Of them, recorded as Working. */
  working: number;
}

/**
 * How many people in `rows` are recorded as Working.
 *
 * Counted per person, not per enrolment — someone who took two tracks holds
 * one job outcome, not two. Where their rows disagree, a recorded status wins
 * over a blank one.
 *
 * Only "Working" is counted. A blank Job Status means nobody has recorded an
 * outcome yet, so it is neither working nor not working, and no rate is
 * derived here: with the column still filling in, any percentage would move
 * with the record-keeping rather than with reality.
 */
export function jobOutcomes(rows: RosterRow[]): JobOutcomes {
  const byPerson = new Map<string, RosterRow>();
  rows.forEach((r) => {
    const key = personKey(r);
    const existing = byPerson.get(key);
    if (!existing || (!existing.job_status && r.job_status)) byPerson.set(key, r);
  });

  const people = [...byPerson.values()];
  return {
    total: people.length,
    working: people.filter((r) => r.job_status === "Working").length,
  };
}

/** The Full Stack programme, either version of the curriculum. */
export function isFullStackTrack(track: string | null | undefined): boolean {
  const name = track?.trim().toLowerCase();
  return !!name && (name.startsWith("full-stack") || name.startsWith("full stack"));
}

/**
 * Job outcomes for people who graduated a Full Stack track.
 *
 * The one metric on the Overview that ignores the track tab: it is always Full
 * Stack, whichever tab is selected. Employment is only tracked for that
 * programme in practice — Job Status is blank on 92% of the roster and the
 * recorded outcomes are Full Stack's — so scoping it to the tab would have put
 * an authoritative-looking fraction on a track nobody has followed up.
 *
 * Because it ignores the tab, it must be passed the *unscoped* rows, and the
 * card has to name Full Stack on its face rather than only in its tooltip.
 */
export function fullStackGraduateJobs(rows: RosterRow[]): JobOutcomes {
  return jobOutcomes(
    rows.filter((r) => isOnRoster(r) && r.status === "Graduated" && isFullStackTrack(r.track)),
  );
}

// ── Garden-side engagement, per app cohort ───────────────────────────────────

export interface CohortEngagement {
  cohort: string;
  participants: number;
  totalChapters: number;
  medianChapters: number;
  avgProgressPct: number;
  completedCurriculum: number;
  active7: number;
  idle: number;
  neverStarted: number;
  onStreak: number;
  updatesLast7d: number;
}

export function cohortEngagement(rows: RosterRow[]): CohortEngagement[] {
  const inApp = oneRowPerGardenAccount(rows.filter((r) => isInApp(r) && r.app_cohort));
  const groups = groupBy(inApp, (r) => r.app_cohort!);

  return [...groups.entries()]
    .map(([cohort, members]) => {
      const chapterCounts = members.map((r) => appProgress(r)?.done ?? 0);
      const total = totalChapters(cohort);
      return {
        cohort,
        participants: members.length,
        totalChapters: total,
        medianChapters: median(chapterCounts),
        avgProgressPct: total
          ? Math.round((chapterCounts.reduce((a, b) => a + b, 0) / members.length / total) * 100)
          : 0,
        completedCurriculum: members.filter(completedGarden).length,
        active7: members.filter((r) => {
          const days = idleDays(r);
          return days !== null && days <= 7;
        }).length,
        idle: members.filter(isIdle).length,
        neverStarted: chapterCounts.filter((c) => c === 0).length,
        onStreak: members.filter((r) => (r.streak_count ?? 0) > 0).length,
        updatesLast7d: members.reduce((sum, r) => sum + r.updates_last_7d, 0),
      };
    })
    .sort((a, b) => b.participants - a.participants);
}

/** How many participants have completed each chapter — where people stall. */
export function chapterDropOff(
  rows: RosterRow[],
  cohort: string,
  steps: { id: string; title: string }[],
): { id: string; title: string; completed: number; total: number }[] {
  const members = oneRowPerGardenAccount(
    rows.filter((r) => isInApp(r) && r.app_cohort === cohort && r.checked),
  );
  return steps.map((step) => ({
    id: step.id,
    title: step.title,
    completed: members.filter((r) => completionOf(r)[step.id]).length,
    total: members.length,
  }));
}

// ── Attention lists — what the join is for ───────────────────────────────────

export function isIdle(r: RosterRow): boolean {
  const days = idleDays(r);
  return days === null || days > IDLE_DAYS;
}

export interface AttentionLists {
  /** Enrolled in Notion, no garden account at all. */
  neverSignedIn: RosterRow[];
  /** Enrolled with an account, but nothing checked yet. */
  signedInNeverStarted: RosterRow[];
  /** Enrolled and started, but nothing for over IDLE_DAYS. */
  idle: RosterRow[];
  /** Marked Offboarded or Declined, yet active in the garden this fortnight. */
  activeButOffboarded: RosterRow[];
  /** Using the garden but absent from the Notion roster. */
  missingFromRoster: RosterRow[];
  /** Notion says Graduated, the in-app curriculum is unfinished. */
  graduatedButIncomplete: RosterRow[];
}

export function attentionLists(rows: RosterRow[]): AttentionLists {
  const enrolled = rows.filter((r) => r.status === "Enrolled");
  // Only the tracks the garden actually teaches. Someone on Data-Analytics or
  // Test-Automation has no garden account by design, so their absence from it
  // is not a leak to chase.
  const enrolledInGarden = enrolled.filter((r) => trackUsesGarden(r.track));

  return {
    neverSignedIn: enrolledInGarden.filter((r) => !isInApp(r)),

    signedInNeverStarted: enrolled.filter((r) => {
      const progress = appProgress(r);
      return isInApp(r) && progress !== null && progress.done === 0;
    }),

    idle: enrolled.filter((r) => {
      const progress = appProgress(r);
      return isInApp(r) && progress !== null && progress.done > 0 && isIdle(r);
    }),

    activeButOffboarded: rows.filter(
      (r) => (r.status === "Offboarded" || r.status === "Declined") && isInApp(r) && !isIdle(r),
    ),

    missingFromRoster: rows.filter((r) => !isOnRoster(r) && isInApp(r)),

    // Only meaningful for the two tracks the garden teaches; a Data-Analytics
    // graduate has no garden curriculum to have left unfinished.
    graduatedButIncomplete: rows.filter(
      (r) => r.status === "Graduated" && appProgress(r) !== null && !completedGarden(r),
    ),
  };
}

/**
 * Missing-value problems worth fixing in Notion, not in code.
 *
 * Carries the affected rows, not just a count: a number tells you something is
 * wrong, the rows tell you which records to open. Each row keeps its
 * notion_page_url, so the dashboard can link straight to the entry to edit.
 */
export interface DataQualityIssue {
  label: string;
  /** Only where the consequence is not obvious from the label. */
  detail?: string;
  rows: RosterRow[];
}

export function dataQualityIssues(rows: RosterRow[]): DataQualityIssue[] {
  const roster = rows.filter(isOnRoster);

  const checks: { label: string; detail?: string; failing: (r: RosterRow) => boolean }[] = [
    {
      // No detail line: "no email address" already says what is wrong, and the
      // row beneath names who it is. Anything explaining why email matters was
      // more confusing than the plain fact.
      label: "No email address",
      failing: (r) => !r.email?.trim(),
    },
    {
      label: "No start date",
      detail: "Excluded from the enrolments-by-month chart.",
      failing: (r) => !r.start_date,
    },
    {
      label: "No curriculum track",
      detail: "Grouped under “No track” in the scorecard.",
      failing: (r) => !r.track,
    },
    {
      label: "No status",
      detail: "Counted in the roster total but in no outcome.",
      failing: (r) => !r.status,
    },
    {
      label: "No mentor assigned",
      detail: "Includes anyone set to “N/A”.",
      failing: (r) => !r.mentor || r.mentor === "N/A",
    },
  ];

  // Repeated emails are deliberately NOT checked. They are how a second
  // enrolment looks: someone finishes one track and joins another, so the same
  // address legitimately appears twice with different tracks and outcomes.
  // countPeople() handles the deduping instead.

  return checks
    .map(({ label, detail, failing }) => ({ label, detail, rows: roster.filter(failing) }))
    .filter((issue) => issue.rows.length > 0);
}

// ── Small utilities ──────────────────────────────────────────────────────────

/**
 * One row per garden account, for metrics counting app engagement.
 *
 * Two roster rows sharing an email both join to the same user_progress row, so
 * without this a re-enrolled participant is counted twice in every garden
 * figure — chapters, streaks, idle counts — and their updates are added twice.
 * Keeps the most recently started enrolment, which is the one they are actually
 * working on.
 */
function oneRowPerGardenAccount(rows: RosterRow[]): RosterRow[] {
  const best = new Map<string, RosterRow>();
  rows.forEach((r) => {
    const key = r.user_id ?? personKey(r);
    const existing = best.get(key);
    if (!existing || (r.start_date ?? "") > (existing.start_date ?? "")) best.set(key, r);
  });
  return [...best.values()];
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  });
  return map;
}

/**
 * Chapter completion per participant, memoised on the row object.
 *
 * The drop-off view asks "did this person finish this chapter?" once per
 * chapter per participant — around 20 × 200 lookups — and each call otherwise
 * walks the whole curriculum. The rule itself stays in progress.ts.
 */
const completionMemo = new WeakMap<RosterRow, Record<string, boolean>>();

function completionOf(r: RosterRow): Record<string, boolean> {
  const cached = completionMemo.get(r);
  if (cached) return cached;
  const fresh = r.app_cohort && r.checked ? completionFor(r.app_cohort, r.checked) : {};
  completionMemo.set(r, fresh);
  return fresh;
}
