/**
 * Shared CSV export utility using native Blob and URL.createObjectURL
 * Reused by /audit and /compare per PRD 6.9 & 6.11
 */
export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  headers: { key: keyof T | string; label: string }[],
  rows: T[]
): void {
  const headerLine = headers
    .map((h) => `"${h.label.replace(/"/g, '""')}"`)
    .join(",");

  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key as keyof T];
        if (val === null || val === undefined) return '""';
        const str =
          typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
