import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, ExternalLink } from "lucide-react";
import type { RosterRow } from "../types";
import { cohortLabel, timeAgo } from "../format";
import { downloadCSV } from "../export";
import { statusStyle } from "../status";
import { appProgress, normaliseCountry, rosterName } from "../metrics";
import { Pill, TableShell } from "../ui";
import { Pager } from "./DailyUpdatesView";

const PAGE_SIZE = 25;

type SortKey = "name" | "status" | "track" | "country" | "start" | "mentor" | "progress" | "active";

/**
 * One row per participant — the roster as a table rather than as cards.
 *
 * Notion's columns and the garden's columns sit side by side so a founder can
 * see, on one line, that someone is marked Enrolled and has not opened the app
 * in two months. An em dash in a garden column means no account; "n/a" means
 * their track has no in-app curriculum.
 */
export function RosterView({ rows }: { rows: RosterRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [track, setTrack] = useState("all");
  const [country, setCountry] = useState("all");
  const [mentor, setMentor] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(0);

  const options = useMemo(() => {
    const uniq = (values: (string | null)[]) =>
      [...new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v))].sort();
    return {
      statuses: uniq(rows.map((r) => r.status)),
      tracks: uniq(rows.map((r) => r.track)),
      countries: uniq(rows.map((r) => normaliseCountry(r.country))),
      mentors: uniq(rows.map((r) => r.mentor)),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && (r.status ?? "") !== status) return false;
      if (track !== "all" && (r.track ?? "") !== track) return false;
      if (country !== "all" && normaliseCountry(r.country) !== country) return false;
      if (mentor !== "all" && (r.mentor ?? "") !== mentor) return false;
      if (!q) return true;
      return (
        rosterName(r).toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        normaliseCountry(r.country).toLowerCase().includes(q)
      );
    });
  }, [rows, search, status, track, country, mentor]);

  const sorted = useMemo(() => {
    // Sortable value per row: null means "no value", which is not the same as
    // a low value. Those rows are held out and appended, so reversing the sort
    // does not float every empty cell to the top.
    const valueOf = (r: RosterRow): string | number | null => {
      switch (sort) {
        case "status":
          return r.status;
        case "track":
          return r.track;
        case "country":
          return normaliseCountry(r.country) || null;
        case "mentor":
          return r.mentor && r.mentor !== "N/A" ? r.mentor : null;
        case "start":
          return r.start_date;
        case "active":
          return r.last_active;
        case "progress": {
          const p = appProgress(r);
          return p ? p.done / p.total : null;
        }
        default:
          return rosterName(r);
      }
    };

    const present: RosterRow[] = [];
    const missing: RosterRow[] = [];
    filtered.forEach((r) => (valueOf(r) === null ? missing : present).push(r));

    const direction = descending ? -1 : 1;
    present.sort((a, b) => {
      const av = valueOf(a)!;
      const bv = valueOf(b)!;
      const result =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      // Ties fall back to name so the order is stable and predictable.
      return (result || rosterName(a).localeCompare(rosterName(b))) * direction;
    });
    missing.sort((a, b) => rosterName(a).localeCompare(rosterName(b)));

    return [...present, ...missing];
  }, [filtered, sort, descending]);

  const pages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDescending((d) => !d);
    else {
      setSort(key);
      setDescending(key === "progress" || key === "active" || key === "start");
    }
    setPage(0);
  };

  const exportRows = () =>
    downloadCSV(
      "participants",
      [
        "Name",
        "Email",
        "Country",
        "Track",
        "Status",
        "Start date",
        "Mentor",
        "1st paid project",
        "2nd paid project",
        "Job status",
        "Garden cohort",
        "Chapters done",
        "Chapters total",
        "Submissions",
        "Reflections",
        "Streak",
        "Last active",
        "Updates total",
        "Updates last 7d",
      ],
      sorted.map((r) => {
        const progress = appProgress(r);
        return [
          rosterName(r),
          r.email ?? "",
          normaliseCountry(r.country),
          r.track ?? "",
          r.status ?? "",
          r.start_date ?? "",
          r.mentor ?? "",
          r.paid_project_1 ?? "",
          r.paid_project_2 ?? "",
          r.job_status ?? "",
          r.app_cohort ? cohortLabel(r.app_cohort) : "",
          progress?.done ?? "",
          progress?.total ?? "",
          r.submissions_count ?? "",
          r.notes_count ?? "",
          r.streak_count ?? "",
          r.last_active ?? "",
          r.updates_total,
          r.updates_last_7d,
        ];
      }),
    );

  const controlStyle = {
    background: "var(--sidebar)",
    border: "1px solid var(--sidebar-border)",
    color: "var(--foreground)",
  };

  const filters: { value: string; set: (v: string) => void; all: string; items: string[] }[] = [
    { value: status, set: setStatus, all: "All statuses", items: options.statuses },
    { value: track, set: setTrack, all: "All tracks", items: options.tracks },
    { value: country, set: setCountry, all: "All countries", items: options.countries },
    { value: mentor, set: setMentor, all: "All mentors", items: options.mentors },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <input
          type="text"
          placeholder="Search name, email, or country…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="text-sm px-3 py-2 rounded-xl outline-none flex-1"
          style={{ ...controlStyle, minWidth: "200px" }}
        />
        {filters.map((f) => (
          <select
            key={f.all}
            value={f.value}
            onChange={(e) => {
              f.set(e.target.value);
              setPage(0);
            }}
            className="text-sm px-3 py-2 rounded-xl outline-none"
            style={controlStyle}
          >
            <option value="all">{f.all}</option>
            {f.items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ))}
        <button
          type="button"
          onClick={exportRows}
          disabled={sorted.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--primary)", color: "white" }}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          No participants match these filters.
        </div>
      ) : (
        <TableShell
          headers={[
            "Participant",
            "Country",
            "Track",
            "Status",
            "Started",
            "Mentor",
            { label: "Garden progress", align: "right" },
            { label: "Last active", align: "right" },
            { label: "Paid", align: "right" },
          ]}
          footer={
            <>
              <span>
                {sorted.length} of {rows.length}{" "}
                {rows.length === 1 ? "participant" : "participants"}
              </span>
              {pages > 1 && <Pager page={page} pages={pages} onChange={setPage} />}
            </>
          }
        >
          {pageRows.map((r, i) => {
            const progress = appProgress(r);
            const { color, textured } = statusStyle(r.status);
            return (
              <tr
                key={r.notion_page_id ?? r.user_id ?? `${i}`}
                style={{
                  background: i % 2 === 0 ? "transparent" : "var(--sidebar-accent)",
                  borderBottom: "1px solid var(--sidebar-border)",
                }}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-medium text-[13px]"
                      style={{ color: "var(--foreground)" }}
                    >
                      {rosterName(r)}
                    </span>
                    {r.notion_page_url && (
                      <a
                        href={r.notion_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Notion"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {!r.notion_page_id && (
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: "oklch(0.95 0.05 50)", color: "oklch(0.45 0.15 50)" }}
                        title="Has a garden account but no row in the Notion roster"
                      >
                        Not on roster
                      </span>
                    )}
                  </div>
                  {r.email && (
                    <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {r.email}
                    </div>
                  )}
                </td>
                <td
                  className="px-4 py-3 text-[12px] whitespace-nowrap"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {normaliseCountry(r.country) || "—"}
                </td>
                <td
                  className="px-4 py-3 text-[12px] whitespace-nowrap"
                  style={{ color: "var(--foreground)" }}
                >
                  {r.track ?? "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.status ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{
                          background: textured
                            ? `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 4px)`
                            : color,
                          border: textured ? `1px solid ${color}` : undefined,
                        }}
                      />
                      <span className="text-[12px]" style={{ color: "var(--foreground)" }}>
                        {r.status}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      —
                    </span>
                  )}
                </td>
                <td
                  className="px-4 py-3 text-[12px] whitespace-nowrap font-mono"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {r.start_date ?? "—"}
                </td>
                <td
                  className="px-4 py-3 text-[12px] whitespace-nowrap"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {r.mentor && r.mentor !== "N/A" ? r.mentor : "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {!r.user_id ? (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--muted-foreground)" }}
                      title="No garden account"
                    >
                      —
                    </span>
                  ) : progress === null ? (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--muted-foreground)" }}
                      title="This track has no in-app curriculum"
                    >
                      n/a
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="hidden sm:block h-1.5 w-12 rounded-full overflow-hidden"
                        style={{ background: "var(--sidebar-accent)" }}
                      >
                        <span
                          className="block h-full"
                          style={{
                            width: `${(progress.done / progress.total) * 100}%`,
                            background: "var(--primary)",
                            borderRadius: 4,
                          }}
                        />
                      </span>
                      <span
                        className="text-[12px] tabular-nums"
                        style={{ color: "var(--foreground)" }}
                      >
                        {progress.done}/{progress.total}
                      </span>
                    </span>
                  )}
                  {r.app_cohort && (
                    <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {cohortLabel(r.app_cohort)}
                    </div>
                  )}
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] whitespace-nowrap"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {r.last_active ? timeAgo(r.last_active) : "Never"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {r.paid_project_1 === "Paid" ? (
                    <Pill>{r.paid_project_2 === "Paid" ? "2 projects" : "Paid"}</Pill>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      {/* Sort controls live below the table because TableShell's header is
          shared with the mentor views, which do not sort. */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span
          className="text-[11px] uppercase tracking-wider font-medium"
          style={{ color: "var(--muted-foreground)" }}
        >
          Sort by
        </span>
        {(
          [
            ["name", "Name"],
            ["status", "Status"],
            ["track", "Track"],
            ["country", "Country"],
            ["start", "Start date"],
            ["mentor", "Mentor"],
            ["progress", "Garden progress"],
            ["active", "Last active"],
          ] as [SortKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleSort(key)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: sort === key ? "var(--primary)" : "var(--sidebar)",
              color: sort === key ? "white" : "var(--muted-foreground)",
              border: "1px solid var(--sidebar-border)",
            }}
          >
            {label}
            {sort === key &&
              (descending ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
          </button>
        ))}
      </div>
    </>
  );
}
