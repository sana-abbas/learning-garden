import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Chart and card primitives for the founder dashboard.
 *
 * Deliberate choices, so they are not undone by accident:
 *
 *   * **Magnitude uses one hue.** Track, country and drop-off bars are all
 *     brand green: the bar's length carries the number, so varying the hue
 *     would imply a category difference that is not there.
 *   * **Only lifecycle status gets multiple hues**, from the validated
 *     --status-* tokens. Light mode's amber and pink fall below 3:1 against
 *     the card surface, so every segment is directly labelled and the legend
 *     repeats each count — the label is the contrast relief, not decoration.
 *   * **2px gaps between stacked segments.** In dark mode Enrolled and Paused
 *     sit in the CVD floor band, where separation is only legal alongside a
 *     secondary encoding. The gap plus the label is that encoding.
 *   * **One axis, always.** No chart here has two scales.
 */

// ── Cards ────────────────────────────────────────────────────────────────────

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "var(--muted-foreground)",
  emphasis = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--sidebar)",
        border: emphasis ? "1px solid var(--primary)" : "1px solid var(--sidebar-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span
          className="text-[11px] uppercase tracking-wider font-medium"
          style={{ color: "var(--muted-foreground)" }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-2xl font-bold font-serif tabular-nums"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
    >
      <header
        className="px-5 py-3.5 flex items-start justify-between gap-3"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div>
          <h2 className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
            {title}
          </h2>
          {hint && (
            <p
              className="text-[11px] mt-0.5 leading-snug"
              style={{ color: "var(--muted-foreground)" }}
            >
              {hint}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

// ── Horizontal magnitude bars ────────────────────────────────────────────────

export interface BarDatum {
  label: string;
  value: number;
  /** Shown at the row's right edge instead of `value`. */
  valueLabel?: string;
  /** Extra context on hover. */
  hint?: string;
}

/**
 * Ranked horizontal bars. Scaled to the largest value rather than to a total,
 * so the comparison between rows stays readable when one row dominates.
 */
export function BarList({
  data,
  max,
  color = "var(--primary)",
  limit,
}: {
  data: BarDatum[];
  max?: number;
  color?: string;
  limit?: number;
}) {
  const shown = limit ? data.slice(0, limit) : data;
  const scale = max ?? Math.max(...data.map((d) => d.value), 1);

  if (shown.length === 0) return <EmptyNote>Nothing to show yet.</EmptyNote>;

  return (
    <div className="space-y-2.5">
      {shown.map((d) => (
        <div key={d.label} title={d.hint ?? `${d.label}: ${d.valueLabel ?? d.value}`}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-[12px] truncate" style={{ color: "var(--foreground)" }}>
              {d.label}
            </span>
            <span
              className="text-[12px] font-semibold tabular-nums shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              {d.valueLabel ?? d.value}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--sidebar-accent)" }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max((d.value / scale) * 100, d.value > 0 ? 2 : 0)}%`,
                background: color,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
      {limit && data.length > limit && (
        <p className="text-[11px] pt-1" style={{ color: "var(--muted-foreground)" }}>
          + {data.length - limit} more
        </p>
      )}
    </div>
  );
}

// ── Stacked status bar ───────────────────────────────────────────────────────

export interface StatusSegment {
  label: string;
  count: number;
  color: string;
  /** Rendered with a diagonal texture — used for the neutral "other" slot so it
      never reads as a peer hue. */
  textured?: boolean;
}

/**
 * One bar, one segment per status, with a legend that doubles as the table
 * view. Segments under 7% of the total are not labelled in place (the text
 * would not fit) — the legend carries their numbers.
 */
export function StatusBar({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return <EmptyNote>No participants on the roster yet.</EmptyNote>;

  const present = segments.filter((s) => s.count > 0);

  return (
    <div>
      <div
        className="flex gap-0.5 h-9 rounded-lg overflow-hidden"
        role="img"
        aria-label={present.map((s) => `${s.label}: ${s.count}`).join(", ")}
      >
        {present.map((s) => {
          const share = (s.count / total) * 100;
          return (
            <div
              key={s.label}
              className="flex items-center justify-center min-w-0 transition-all duration-500"
              style={{
                width: `${share}%`,
                background: s.textured
                  ? `repeating-linear-gradient(45deg, ${s.color}, ${s.color} 3px, transparent 3px, transparent 6px)`
                  : s.color,
                border: s.textured ? `1px solid ${s.color}` : undefined,
              }}
              title={`${s.label}: ${s.count} (${Math.round(share)}%)`}
            >
              {share >= 7 && (
                <span
                  className="text-[11px] font-semibold text-white tabular-nums px-1 truncate"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                >
                  {s.count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend and table view in one — identity is never colour alone.
          Each count sits immediately after its own label. In a fixed grid with
          the count pushed to the cell's far edge, "Enrolled … 68" left the 68
          nearer the next status than its own, so every number read as
          belonging to the label after it. */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {present.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{
                background: s.textured
                  ? `repeating-linear-gradient(45deg, ${s.color}, ${s.color} 2px, transparent 2px, transparent 4px)`
                  : s.color,
                border: s.textured ? `1px solid ${s.color}` : undefined,
              }}
            />
            <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {s.label}
            </span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: "var(--foreground)" }}
            >
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Time series columns ──────────────────────────────────────────────────────

/**
 * Enrolments per month. Vertical columns anchored to the baseline, one series
 * in one hue, with only the peak and the endpoints labelled — a number on every
 * column is noise at 30+ months.
 */
export function ColumnChart({
  data,
  color = "var(--primary)",
  height = 120,
}: {
  data: { month: string; count: number }[];
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return <EmptyNote>No start dates recorded.</EmptyNote>;

  const max = Math.max(...data.map((d) => d.count), 1);
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="relative">
        {/* Hover readout sits above the plot so it never covers the columns. */}
        <div className="h-5 mb-1 text-[11px] tabular-nums" style={{ color: "var(--foreground)" }}>
          {active ? (
            <span>
              <strong>{monthLabel(active.month)}</strong> — {active.count}{" "}
              {active.count === 1 ? "enrolment" : "enrolments"}
            </span>
          ) : (
            <span style={{ color: "var(--muted-foreground)" }}>
              Peak {max} in {monthLabel(data.reduce((a, b) => (b.count > a.count ? b : a)).month)}
            </span>
          )}
        </div>

        <div className="flex items-end gap-0.5" style={{ height }}>
          {data.map((d, i) => (
            <button
              key={d.month}
              type="button"
              className="flex-1 min-w-0 h-full flex items-end group"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              title={`${monthLabel(d.month)}: ${d.count}`}
              aria-label={`${monthLabel(d.month)}: ${d.count} enrolments`}
            >
              <span
                className="w-full transition-all duration-300"
                style={{
                  height: `${Math.max((d.count / max) * 100, d.count > 0 ? 3 : 1)}%`,
                  background: d.count > 0 ? color : "var(--sidebar-border)",
                  borderRadius: "4px 4px 0 0",
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Only the ends are labelled; the hover readout names the rest. */}
      <div
        className="flex justify-between mt-1.5 text-[10px]"
        style={{ color: "var(--muted-foreground)" }}
      >
        <span>{monthLabel(data[0].month)}</span>
        <span>{monthLabel(data[data.length - 1].month)}</span>
      </div>
    </div>
  );
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const name = new Date(Date.UTC(year, m - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${name} ${year}`;
}

// ── Table shell ──────────────────────────────────────────────────────────────

export function TableShell({
  headers,
  children,
  footer,
}: {
  headers: (string | { label: string; align?: "left" | "right" })[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--sidebar-border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                background: "var(--sidebar)",
                borderBottom: "1px solid var(--sidebar-border)",
              }}
            >
              {headers.map((h) => {
                const { label, align } =
                  typeof h === "string" ? { label: h, align: "left" as const } : h;
                return (
                  <th
                    key={label}
                    className={`px-4 py-3 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap ${
                      align === "right" ? "text-right" : "text-left"
                    }`}
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer && (
        <div
          className="px-4 py-2.5 flex items-center justify-between text-[11px]"
          style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--sidebar-border)" }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/** Small pill for a cohort or track name. */
export function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{
        background: color
          ? `color-mix(in oklab, ${color} 18%, transparent)`
          : "oklch(0.92 0.07 145 / 0.3)",
        color: color ?? "var(--primary)",
      }}
    >
      {children}
    </span>
  );
}
