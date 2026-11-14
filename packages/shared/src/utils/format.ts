export const titleCase = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const dateStr = value.endsWith("Z") || value.match(/[+-]\d{2}:\d{2}$/) ? value : value + "Z";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const dateStr = value.endsWith("Z") || value.match(/[+-]\d{2}:\d{2}$/) ? value : value + "Z";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const relativeTime = (value?: string | null) => {
  if (!value) return "—";
  const dateStr = value.endsWith("Z") || value.match(/[+-]\d{2}:\d{2}$/) ? value : value + "Z";
  const date = new Date(dateStr).getTime();
  if (Number.isNaN(date)) return "—";
  const diff = date - Date.now();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
};

export const formatCurrency = (value?: number | null) =>
  typeof value === "number"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
    : "—";

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T | string; label: string; value?: (row: T) => unknown }[],
) {
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""').replace(/\n/g, " ")}"`;
  };

  const csv = [
    columns.map((column) => escape(column.label)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => escape(column.value ? column.value(row) : row[column.key as keyof T]))
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
