/** Fecha/hora → texto en locale y zona horaria del navegador. */

function parseInput(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO / timestamp → «10 jun 2026, 10:37:59» (hora local). */
export function formatLocalDateTime(value) {
  const d = parseInput(value);
  if (!d) return value == null ? "" : String(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Fecha (sin hora) → «10 jun 2026». */
export function formatLocalDate(value) {
  const d = parseInput(value);
  if (!d) return value == null ? "" : String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
