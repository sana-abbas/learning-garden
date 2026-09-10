/** Quote a value for CSV: wrap in quotes and double any quote inside. */
function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/**
 * Download `rows` as a CSV named `<prefix>-<today>.csv`.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * has not always started the download by the time the click handler returns,
 * and revoking too early cancels it.
 */
export function downloadCSV(prefix: string, header: string[], rows: unknown[][]) {
  const csv = [header.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
