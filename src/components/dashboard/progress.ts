import { STEPS, CURRICULUM_STEPS } from "@/data/curriculum";
import { CF_STEPS, CF_CURRICULUM_STEPS } from "@/data/curriculum-cf";
import type { Step } from "@/data/curriculum";

/**
 * Progress arithmetic, in one place.
 *
 * A chapter counts as complete when every one of its subtasks is checked (or,
 * for a chapter with no subtasks, when the chapter itself is checked). The
 * denominator is CURRICULUM_STEPS — Full Stack excludes the founders' calls
 * from it, CF has none to exclude.
 */

export const CF_SLUG = "coding-fundamentals";

/**
 * Which garden cohort a Notion curriculum track corresponds to, or null when
 * the track is not taught in the garden at all.
 *
 * The garden only teaches Full Stack and Coding Fundamentals. Data-Analytics,
 * Test-Automation, Classical ML and the AI tracks are run elsewhere, so their
 * participants have no garden account by design — counting them as "enrolled
 * but never signed in" is wrong, not a finding.
 *
 * Matched on a lowercase prefix so "full-stack 2.0" is covered the moment it
 * has participants, without another code change.
 */
export function gardenCohortForTrack(track: string | null | undefined): string | null {
  const name = track?.trim().toLowerCase();
  if (!name) return null;
  if (name.startsWith("full-stack") || name.startsWith("full stack")) return "full-stack";
  if (name.startsWith("coding fundamentals")) return CF_SLUG;
  return null;
}

/** True when someone on this track is expected to have a garden account. */
export function trackUsesGarden(track: string | null | undefined): boolean {
  return gardenCohortForTrack(track) !== null;
}

export function isCFSlug(slug: string | null | undefined): boolean {
  return slug === CF_SLUG;
}

/** The chapter list a participant in `slug` is working through. */
export function stepsFor(slug: string | null | undefined): Step[] {
  return isCFSlug(slug) ? CF_STEPS : STEPS;
}

/** The chapters that count towards completion for `slug`. */
export function curriculumFor(slug: string | null | undefined): Step[] {
  return isCFSlug(slug) ? CF_CURRICULUM_STEPS : CURRICULUM_STEPS;
}

export function totalChapters(slug: string | null | undefined): number {
  return curriculumFor(slug).length;
}

/** chapter id → complete?, for every chapter in the cohort's curriculum. */
export function completionFor(
  slug: string | null | undefined,
  checked: Record<string, boolean>,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  stepsFor(slug).forEach((s) => {
    if (s.subtasks && s.subtasks.length > 0) {
      map[s.id] = s.subtasks.every((sub) => checked[sub.id]);
    } else {
      map[s.id] = !!checked[s.id];
    }
  });
  return map;
}

export function completedCountFor(
  slug: string | null | undefined,
  checked: Record<string, boolean>,
): number {
  const completion = completionFor(slug, checked);
  return curriculumFor(slug).filter((s) => completion[s.id]).length;
}

export function currentChapterFor(
  slug: string | null | undefined,
  checked: Record<string, boolean>,
): string {
  const completion = completionFor(slug, checked);
  const current = stepsFor(slug).find((s) => !completion[s.id]);
  return current?.title ?? "All complete!";
}

/**
 * A graduate has completed every chapter that counts towards their cohort's
 * curriculum. There is no `graduated_at` column, so this is derived — which
 * means it moves if the curriculum grows. Stated on the dashboard so the
 * number is never mistaken for a hand-maintained roll.
 */
export function isGraduate(
  slug: string | null | undefined,
  checked: Record<string, boolean>,
): boolean {
  const total = totalChapters(slug);
  return total > 0 && completedCountFor(slug, checked) === total;
}

/** Every chapter across both curricula, for views that mix cohorts. */
export const ALL_STEPS: Step[] = [...STEPS, ...CF_STEPS];

/** subtask id → { chapterTitle, subtaskLabel }, across both curricula. */
export const SUBTASK_INDEX: Record<string, { chapterTitle: string; subtaskLabel: string }> =
  (() => {
    const map: Record<string, { chapterTitle: string; subtaskLabel: string }> = {};
    ALL_STEPS.forEach((s) => {
      (s.subtasks ?? []).forEach((sub) => {
        map[sub.id] = { chapterTitle: s.title, subtaskLabel: sub.label };
      });
    });
    return map;
  })();
