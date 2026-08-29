/**
 * Progress bar color by severity: blue while comfortable, green when close
 * to the target, red when over. Applied to every daily-intake bar.
 */
export function severityClass(pct: number): string {
  if (pct > 100) return "bg-red-500";
  if (pct >= 70) return "bg-emerald-500";
  return "bg-blue-500";
}
