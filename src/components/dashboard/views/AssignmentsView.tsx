import React, { useState } from "react";
import { Filter, Link as LinkIcon } from "lucide-react";
import type { ParticipantRow, CohortFilter } from "../types";
import { cohortLabel } from "../format";
import { SUBTASK_INDEX } from "../progress";
import { TableShell } from "../ui";
import { Pager } from "./DailyUpdatesView";

const PAGE_SIZE = 15;

interface SubmissionRow {
  rowKey: string;
  participantName: string;
  cohort: string;
  chapter: string;
  exercise: string;
  submittedAt?: string;
  paste: string;
  link: string;
  link2: string;
}

/** Every assignment submission across both cohorts, newest first. */
export function AssignmentsView({
  participants,
  cohortMemberMap,
}: {
  participants: ParticipantRow[];
  cohortMemberMap: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [page, setPage] = useState(0);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const rows: SubmissionRow[] = participants
    .flatMap((p) =>
      Object.entries(p.submissions ?? {}).map(([subId, sub]) => ({
        rowKey: `${p.user_id}__${subId}`,
        participantName: p.display_name || p.email?.split("@")[0] || "Unknown",
        cohort: cohortMemberMap[p.user_id] ?? "full-stack",
        chapter: SUBTASK_INDEX[subId]?.chapterTitle ?? subId,
        exercise: SUBTASK_INDEX[subId]?.subtaskLabel ?? subId,
        submittedAt: sub.submittedAt,
        paste: sub.paste ?? "",
        link: sub.link ?? "",
        link2: sub.link2 ?? "",
      })),
    )
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (cohort !== "all" && r.cohort !== cohort) return false;
    if (!q) return true;
    return (
      r.participantName.toLowerCase().includes(q) ||
      r.chapter.toLowerCase().includes(q) ||
      r.exercise.toLowerCase().includes(q)
    );
  });

  const pages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5">
          {(
            [
              { value: "all", label: "All" },
              { value: "full-stack", label: "Full Stack" },
              { value: "coding-fundamentals", label: "Coding Fundamentals" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setCohort(value);
                setPage(0);
              }}
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
        </div>
        <div className="relative flex-1 max-w-xs">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="text"
            placeholder="Search by name or exercise…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2"
            style={{
              background: "var(--sidebar)",
              borderColor: "var(--sidebar-border)",
              color: "var(--foreground)",
            }}
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
        <TableShell
          headers={["Date", "Participant", "Cohort", "Chapter", "Exercise", "Answer"]}
          footer={
            <>
              <span>
                {filtered.length} {filtered.length === 1 ? "submission" : "submissions"}
              </span>
              {pages > 1 && <Pager page={page} pages={pages} onChange={setPage} />}
            </>
          }
        >
          {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r, i) => {
            const expanded = expandedKey === r.rowKey;
            const dateStr = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—";
            const hasMore = !!(r.paste || r.link || r.link2);
            const rowBg = i % 2 === 0 ? "transparent" : "var(--sidebar)";
            return (
              <React.Fragment key={r.rowKey}>
                <tr
                  style={{
                    background: rowBg,
                    borderBottom: expanded ? "none" : "1px solid var(--sidebar-border)",
                  }}
                >
                  <td
                    className="px-4 py-3 text-[12px] whitespace-nowrap"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {dateStr}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px] font-medium whitespace-nowrap"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.participantName}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] whitespace-nowrap"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {cohortLabel(r.cohort)}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] whitespace-nowrap"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.chapter}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] max-w-[180px] truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.exercise}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {r.paste ? (
                      <p
                        className="text-[12px] leading-relaxed whitespace-pre-wrap line-clamp-2"
                        style={{ color: "var(--foreground)" }}
                      >
                        {r.paste}
                      </p>
                    ) : r.link || r.link2 ? (
                      <div className="flex flex-col gap-1">
                        {[r.link, r.link2].filter(Boolean).map((href) => (
                          <a
                            key={href}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: "var(--primary)" }}
                          >
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[160px]">{href}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        —
                      </span>
                    )}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setExpandedKey(expanded ? null : r.rowKey)}
                        className="text-[11px] mt-1"
                        style={{ color: "var(--primary)" }}
                      >
                        {expanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded && (
                  <tr
                    style={{ background: rowBg, borderBottom: "1px solid var(--sidebar-border)" }}
                  >
                    <td colSpan={6} className="px-4 pb-4 pt-0">
                      <div
                        className="rounded-xl p-4 space-y-3"
                        style={{
                          background: "var(--background)",
                          border: "1px solid var(--sidebar-border)",
                        }}
                      >
                        <div
                          className="flex items-center gap-3 flex-wrap text-[11px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <span className="font-semibold uppercase tracking-wider">
                            {r.participantName}
                          </span>
                          <span>·</span>
                          <span>{r.exercise}</span>
                          <span>·</span>
                          <span>{dateStr}</span>
                        </div>
                        {r.paste && (
                          <p
                            className="text-[13px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: "var(--foreground)" }}
                          >
                            {r.paste}
                          </p>
                        )}
                        {(r.link || r.link2) && (
                          <div className="flex flex-col gap-1.5">
                            {[r.link, r.link2].filter(Boolean).map((href) => (
                              <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[12px] break-all"
                                style={{ color: "var(--primary)" }}
                              >
                                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                                {href}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </TableShell>
      )}
    </>
  );
}
