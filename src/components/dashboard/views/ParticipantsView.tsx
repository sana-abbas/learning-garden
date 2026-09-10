import { useState } from "react";
import { Clock, Flame, Users, ClipboardList } from "lucide-react";
import type { ParticipantRow } from "../types";
import { DAY_MS, displayName, timeAgo } from "../format";
import { completedCountFor, currentChapterFor, curriculumFor } from "../progress";
import { Avatar } from "../Avatar";
import { DetailPanel } from "../DetailPanel";
import { StatCard } from "../ui";

type Sort = "progress" | "active" | "streak";

/**
 * The mentor's participant view: cards per person, one cohort at a time.
 *
 * Card-shaped because a mentor works one participant at a time — they open a
 * card, read the reflections, and follow up. Founders get the same people as
 * a flat table instead (see RosterView), since they read across everyone.
 */
export function ParticipantsView({
  participants,
  cohortMemberMap,
  todayUpdateUserIds,
}: {
  participants: ParticipantRow[];
  cohortMemberMap: Record<string, string>;
  todayUpdateUserIds: Set<string>;
}) {
  const [cohortTab, setCohortTab] = useState<"full-stack" | "coding-fundamentals">("full-stack");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("progress");
  const [selected, setSelected] = useState<ParticipantRow | null>(null);

  const slugOf = (p: ParticipantRow) => cohortMemberMap[p.user_id] ?? "full-stack";
  const cohortParticipants = participants.filter((p) => slugOf(p) === cohortTab);

  const filtered = cohortParticipants
    .filter((p) => {
      const q = search.toLowerCase();
      return displayName(p).toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "progress") {
        return completedCountFor(cohortTab, b.checked) - completedCountFor(cohortTab, a.checked);
      }
      if (sort === "streak") return (b.streak_count || 0) - (a.streak_count || 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const postedToday = cohortParticipants.filter((p) => todayUpdateUserIds.has(p.user_id)).length;
  const atRisk = cohortParticipants.filter(
    (p) => Date.now() - new Date(p.updated_at).getTime() > 7 * DAY_MS,
  ).length;
  const onStreak = cohortParticipants.filter((p) => (p.streak_count || 0) > 0).length;

  // Participants with no cohort_members row show up in the Full Stack tab by
  // default, which is exactly how the CF-routing bug stayed invisible — so
  // surface them rather than letting the default hide them.
  const unassigned = participants.filter((p) => !cohortMemberMap[p.user_id]);

  return (
    <>
      <div className="flex gap-2 mb-6">
        {(
          [
            { slug: "full-stack", label: "Full Stack" },
            { slug: "coding-fundamentals", label: "Coding Fundamentals" },
          ] as const
        ).map(({ slug, label }) => (
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total participants"
          value={cohortParticipants.length}
          sub="in this cohort"
        />
        <StatCard
          icon={ClipboardList}
          label="Posted today"
          value={postedToday}
          sub={`of ${cohortParticipants.length}`}
          accent="var(--primary)"
        />
        <StatCard
          icon={Clock}
          label="At risk"
          value={atRisk}
          sub="no activity 7+ days"
          accent="oklch(0.55 0.15 50)"
        />
        <StatCard
          icon={Flame}
          label="On a streak"
          value={onStreak}
          sub={`of ${cohortParticipants.length}`}
          accent="oklch(0.65 0.18 55)"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search participants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
          style={{
            background: "var(--sidebar)",
            border: "1px solid var(--sidebar-border)",
            color: "var(--foreground)",
          }}
        />
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--sidebar-border)" }}
        >
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

      {unassigned.length > 0 && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--sidebar)",
            border: "1px solid var(--destructive)",
            color: "var(--foreground)",
          }}
        >
          <strong>
            {unassigned.length} participant{unassigned.length === 1 ? "" : "s"} have no cohort
          </strong>{" "}
          — shown here by default, and may see the wrong curriculum:{" "}
          {unassigned.map((p) => p.email || displayName(p)).join(", ")}
        </div>
      )}

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
              cohortSlug={slugOf(p)}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailPanel
          participant={selected}
          cohortSlug={cohortMemberMap[selected.user_id] ?? "full-stack"}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function ParticipantCard({
  p,
  cohortSlug,
  onClick,
}: {
  p: ParticipantRow;
  cohortSlug: string;
  onClick: () => void;
}) {
  const curriculumSteps = curriculumFor(cohortSlug);
  const completedCount = completedCountFor(cohortSlug, p.checked);
  const percent = curriculumSteps.length
    ? Math.round((completedCount / curriculumSteps.length) * 100)
    : 0;
  const isIdle = Date.now() - new Date(p.updated_at).getTime() > 7 * DAY_MS;
  const currentChapter = currentChapterFor(cohortSlug, p.checked);
  const hasNotes = Object.values(p.notes ?? {}).some(Boolean);
  const submissionCount = Object.values(p.submissions ?? {}).filter(Boolean).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
      style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
    >
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

      <div className="mb-3">
        <p
          className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          Currently on
        </p>
        <p
          className="text-[12.5px] font-medium leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {currentChapter}
        </p>
      </div>

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
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.88 0.04 85)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {timeAgo(p.updated_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {submissionCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.92 0.07 145 / 0.4)", color: "var(--primary)" }}
            >
              {submissionCount} {submissionCount === 1 ? "submission" : "submissions"}
            </span>
          )}
          {hasNotes && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.94 0.04 85 / 0.5)", color: "oklch(0.55 0.12 85)" }}
            >
              notes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
