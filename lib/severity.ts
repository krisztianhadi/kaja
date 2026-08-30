/**
 * Progress bar color by severity, harmonized with the bistro theme:
 * sage-olive while comfortable, pine green when close to the target,
 * clay red when over. Applied to every daily-intake bar.
 */
export function severityClass(pct: number): string {
  if (pct > 100) return "bg-[hsl(8_55%_45%)]"; // clay - over
  if (pct >= 70) return "bg-[hsl(150_38%_30%)]"; // pine - close to target
  return "bg-[hsl(80_18%_45%)]"; // sage - comfortable
}
