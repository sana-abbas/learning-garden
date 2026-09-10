import type { ParticipantRow } from "./types";

export const DAY_MS = 86400000;

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function initials(name: string | null, email: string | null): string {
  const src = name || email?.split("@")[0] || "?";
  return src
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function displayName(p: ParticipantRow): string {
  return p.display_name || p.email?.split("@")[0] || "Anonymous";
}

/**
 * Human label for a cohort slug. Falls back to title-casing the slug so a
 * third cohort added in the database reads sensibly without a code change.
 */
export function cohortLabel(slug: string | null | undefined): string {
  if (slug === "coding-fundamentals") return "Coding Fundamentals";
  if (slug === "full-stack") return "Full Stack";
  if (!slug) return "No cohort";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** `todayISO()` in the browser's local day, matching how daily_updates.date is written. */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Monday–Sunday of the week containing `ref`, as ISO date strings. */
export function weekBounds(ref: Date = new Date()): { start: string; end: string } {
  const dayOfWeek = ref.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(ref);
  mon.setDate(ref.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] };
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

/** Median of a numeric list. Returns 0 for an empty list. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
