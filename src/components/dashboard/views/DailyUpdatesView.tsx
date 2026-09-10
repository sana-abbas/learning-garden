import { useState } from "react";
import { Download, Filter } from "lucide-react";
import type { DailyUpdateRow, ParticipantRow, CohortFilter } from "../types";
import { cohortLabel, weekBounds } from "../format";
import { downloadCSV } from "../export";
import { Pill, TableShell } from "../ui";

const PAGE_SIZE = 15;

/**
 * Every daily update, filterable and exportable. Shared by /mentor and
 * /founder — the same rows answer "is this person moving?" for a mentor and
 * "is this cohort engaged?" for a founder.
 */
export function DailyUpdatesView({
  participants,
  cohortMemberMap,
  updates,
  loading,
}: {
  participants: ParticipantRow[];
  cohortMemberMap: Record<string, string>;
  updates: DailyUpdateRow[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const byUserId = new Map(participants.map((p) => [p.user_id, p]));
  const nameOf = (userId: string) => {
    const p = byUserId.get(userId);
    return p?.display_name || p?.email?.split("@")[0] || "Unknown";
  };
  const slugOf = (userId: string) => cohortMemberMap[userId] ?? "full-stack";

  const filtered = updates.filter((u) => {
    const q = search.toLowerCase();
    const p = byUserId.get(u.user_id);
    const matchesSearch =
      !q ||
      nameOf(u.user_id).toLowerCase().includes(q) ||
      (p?.email ?? "").toLowerCase().includes(q);
    const matchesCohort = cohort === "all" || slugOf(u.user_id) === cohort;
    const matchesFrom = !dateFrom || u.date >= dateFrom;
    const matchesTo = !dateTo || u.date <= dateTo;
    return matchesSearch && matchesCohort && matchesFrom && matchesTo;
  });

  // Updates posted in the current Mon–Sun week, per person. Five is the target,
  // so the count is shown against it rather than on its own.
  const { start: weekStart, end: weekEnd } = weekBounds();
  const weeklyCount: Record<string, number> = {};
  updates.forEach((u) => {
    if (u.date >= weekStart && u.date <= weekEnd) {
      weeklyCount[u.user_id] = (weeklyCount[u.user_id] ?? 0) + 1;
    }
  });

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const resetPage = () => setPage(0);

  const exportRows = () =>
    downloadCSV(
      "daily-updates",
      ["Date", "Name", "Email", "Cohort", "What I did today", "What I'll do tomorrow", "Blockers"],
      filtered.map((u) => [
        u.date,
        nameOf(u.user_id),
        byUserId.get(u.user_id)?.email ?? "",
        cohortLabel(slugOf(u.user_id)),
        u.today,
        u.tomorrow,
        u.blockers ?? "",
      ]),
    );

  const inputStyle = {
    background: "var(--sidebar)",
    border: "1px solid var(--sidebar-border)",
    color: "var(--foreground)",
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Filter</span>
        </div>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className="text-sm px-3 py-2 rounded-xl outline-none"
          style={{ ...inputStyle, minWidth: "160px" }}
        />
        <select
          value={cohort}
          onChange={(e) => {
            setCohort(e.target.value as CohortFilter);
            resetPage();
          }}
          className="text-sm px-3 py-2 rounded-xl outline-none"
          style={inputStyle}
        >
          <option value="all">All cohorts</option>
          <option value="full-stack">Full Stack</option>
          <option value="coding-fundamentals">Coding Fundamentals</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetPage();
          }}
          className="text-sm px-3 py-2 rounded-xl outline-none"
          style={inputStyle}
        />
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          to
        </span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetPage();
          }}
          className="text-sm px-3 py-2 rounded-xl outline-none"
          style={inputStyle}
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportRows}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--primary)", color: "white" }}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--primary)" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--muted-foreground)" }}>
          No daily updates found.
        </div>
      ) : (
        <TableShell
          headers={[
            "Date",
            "Participant",
            "Cohort",
            "This week",
            "What I did today",
            "What I'll do tomorrow",
            "Blockers",
          ]}
          footer={
            <>
              <span>
                {filtered.length} {filtered.length === 1 ? "update" : "updates"}
              </span>
              {pages > 1 && <Pager page={page} pages={pages} onChange={setPage} />}
            </>
          }
        >
          {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u, i) => {
            const expanded = expandedId === u.id;
            const clamp = expanded ? "" : "line-clamp-2";
            const count = weeklyCount[u.user_id] ?? 0;
            const countColor =
              count >= 5
                ? "var(--primary)"
                : count >= 3
                  ? "oklch(0.65 0.15 50)"
                  : "var(--muted-foreground)";
            return (
              <tr
                key={u.id}
                style={{
                  background: i % 2 === 0 ? "transparent" : "var(--sidebar-accent)",
                  borderBottom: "1px solid var(--sidebar-border)",
                }}
              >
                <td
                  className="px-4 py-3 whitespace-nowrap font-mono text-[12px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {u.date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-[13px]" style={{ color: "var(--foreground)" }}>
                    {nameOf(u.user_id)}
                  </div>
                  {byUserId.get(u.user_id)?.email && (
                    <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {byUserId.get(u.user_id)!.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Pill>{cohortLabel(slugOf(u.user_id))}</Pill>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color: countColor }}
                    title={`${count} of 5 updates this week`}
                  >
                    {count}/5
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p
                    className={`text-[13px] leading-relaxed whitespace-pre-wrap ${clamp}`}
                    style={{ color: "var(--foreground)" }}
                  >
                    {u.today}
                  </p>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p
                    className={`text-[13px] leading-relaxed whitespace-pre-wrap ${clamp}`}
                    style={{ color: "var(--foreground)" }}
                  >
                    {u.tomorrow}
                  </p>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {u.blockers ? (
                    <p
                      className={`text-[13px] leading-relaxed whitespace-pre-wrap ${clamp}`}
                      style={{ color: "oklch(0.55 0.15 50)" }}
                    >
                      {u.blockers}
                    </p>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      —
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : u.id)}
                    className="text-[11px] mt-1"
                    style={{ color: "var(--primary)" }}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </>
  );
}

export function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const buttonStyle = {
    background: "var(--sidebar)",
    border: "1px solid var(--sidebar-border)",
    color: "var(--foreground)",
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 rounded-lg text-[11px] font-medium transition-opacity disabled:opacity-30"
        style={buttonStyle}
      >
        ← Prev
      </button>
      <span>
        Page {page + 1} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 rounded-lg text-[11px] font-medium transition-opacity disabled:opacity-30"
        style={buttonStyle}
      >
        Next →
      </button>
    </div>
  );
}
