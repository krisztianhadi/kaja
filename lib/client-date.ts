/** Client-safe copy of the server date-key helper (uses the browser clock). */
export function dayKeyFor(ts: number, tzOffsetMin: number): string {
  const d = new Date(ts + tzOffsetMin * 60_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
