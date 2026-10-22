import { useState } from "react";
import type { ParticipantRow, CohortFilter } from "../types";
import { cohortLabel } from "../format";
import { ALL_STEPS } from "../progress";
import { Pill } from "../ui";

interface ReflectionRow {
  rowKey: string;
  participantName: string;
  email: string;
  cohort: string;
  chapterId: string;
  note: string;
  reflection: string;
}

/**
 * Chapter notes and reflections, grouped by chapter in curriculum order.
 *
 * A participant's notes are stored under the chapter id, and their end-of-
 * chapter reflection under the same id with a `__fb` suffix — so both halves
 * fold into one row per person per chapter.
 */
export function ReflectionsView({
  participants,
  cohortMemberMap,
}: {
  participants: ParticipantRow[];
  cohortMemberMap: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (id: string) =>
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rowMap = new Map<string, ReflectionRow>();
  participants.forEach((p) => {
    Object.entries(p.notes ?? {}).forEach(([key, text]) => {
      if (!text?.trim()) return;
      const isReflection = key.endsWith("__fb");
      const chapterId = isReflection ? key.slice(0, -4) : key;
      const mapKey = `${p.user_id}__${chapterId}`;

      let row = rowMap.get(mapKey);
      if (!row) {
        row = {
          rowKey: mapKey,
          participantName: p.display_name || p.email?.split("@")[0] || "Unknown",
          email: p.email || "",
          cohort: cohortMemberMap[p.user_id] ?? "full-stack",
          chapterId,
          note: "",
          reflection: "",
        };
        rowMap.set(mapKey, row);
      }
      if (isReflection) row.reflection = text;
      else row.note = text;
    });
  });

  const q = search.toLowerCase();
  const allRows = [...rowMap.values()].filter((r) => {
    const chapterTitle = (
      ALL_STEPS.find((s) => s.id === r.chapterId)?.title ?? r.chapterId
    ).toLowerCase();
    const matchesSearch =
      !q ||
      r.participantName.toLowerCase().includes(q) ||
      chapterTitle.includes(q) ||
      r.note.toLowerCase().includes(q) ||
      r.reflection.toLowerCase().includes(q);
    const matchesCohort = cohort === "all" || r.cohort === cohort;
    return matchesSearch && matchesCohort;
  });

  // Curriculum order, not alphabetical — reading down the list should follow
  // the journey participants actually take.
  const chapterGroups = ALL_STEPS.map((step) => ({
    stepId: step.id,
    title: step.title,
    rows: allRows.filter((r) => r.chapterId === step.id),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {(
          [
            { value: "all", label: "All cohorts" },
            { value: "full-stack", label: "Full Stack" },
            { value: "coding-fundamentals", label: "Coding Fundamentals" },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setCohort(value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: cohort === value ? "var(--primary)" : "var(--sidebar)",
              color: cohort === value ? "white" : "var(--muted-foreground)",
              border: "1px solid var(--sidebar-border)",
            }}
          >
            {label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search by name, chapter, or text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2"
          style={{
            background: "var(--sidebar)",
            borderColor: "var(--sidebar-border)",
            color: "var(--foreground)",
          }}
        />
        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          {chapterGroups.length} {chapterGroups.length === 1 ? "chapter" : "chapters"} ·{" "}
          {allRows.length} responses
        </span>
      </div>

      {chapterGroups.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          No reflections found.
        </div>
      ) : (
        <div className="space-y-3">
          {chapterGroups.map(({ stepId, title, rows }) => {
            const isOpen = openChapters.has(stepId);
            return (
              <div
                key={stepId}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--sidebar-border)" }}
              >
                <button
                  type="button"
                  onClick={() => toggleChapter(stepId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                  style={{ background: "var(--sidebar)" }}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-medium text-[14px]"
                      style={{ color: "var(--foreground)" }}
                    >
                      {title}
                    </span>
                    <Pill>
                      {rows.length} {rows.length === 1 ? "response" : "responses"}
                    </Pill>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--sidebar-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          style={{
                            background: "var(--background)",
                            borderBottom: "1px solid var(--sidebar-border)",
                          }}
                        >
                          {["Participant", "Cohort", "Notes", "Reflections"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr
                            key={r.rowKey}
                            style={{
                              background: i % 2 === 0 ? "transparent" : "var(--sidebar)",
                              borderBottom: "1px solid var(--sidebar-border)",
                            }}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div
                                className="font-medium text-[13px]"
                                style={{ color: "var(--foreground)" }}
                              >
                                {r.participantName}
                              </div>
                              <div
                                className="text-[11px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {r.email}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Pill>{cohortLabel(r.cohort)}</Pill>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {r.note ? (
                                <p
                                  className="text-[12px] leading-relaxed whitespace-pre-wrap"
                                  style={{ color: "var(--foreground)" }}
                                >
                                  {r.note}
                                </p>
                              ) : (
                                <span
                                  className="text-[11px]"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {r.reflection ? (
                                <p
                                  className="text-[12px] leading-relaxed whitespace-pre-wrap"
                                  style={{ color: "var(--foreground)" }}
                                >
                                  {r.reflection}
                                </p>
                              ) : (
                                <span
                                  className="text-[11px]"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
