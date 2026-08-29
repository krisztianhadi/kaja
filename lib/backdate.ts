/**
 * Backdate a meal when the description mentions a relative time
 * ("yesterday", "last night", "2 days ago", "this morning").
 * Lets people record whenever they remember, without pressure.
 * Deterministic regex parsing - no AI involved.
 */

const MS_DAY = 86_400_000;

interface Rule {
  re: RegExp; // full match on the description
  phrase: RegExp; // the phrase to strip from the copy sent to the AI
  shift: (now: Date, m: RegExpExecArray) => Date;
}

const RULES: Rule[] = [
  {
    // "3 days ago" / "2 day ago"
    re: /(\d+)\s+days?\s+ago/i,
    phrase: /(\d+\s+days?\s+ago)/i,
    shift: (now, m) => new Date(now.getTime() - Number(m[1]) * MS_DAY),
  },
  {
    re: /the\s+day\s+before\s+yesterday/i,
    phrase: /(the\s+day\s+before\s+yesterday)/i,
    shift: (now) => new Date(now.getTime() - 2 * MS_DAY),
  },
  {
    re: /(?:yesterday|last\s+night)/i,
    phrase: /(yesterday|last\s+night)/i,
    shift: (now) => new Date(now.getTime() - MS_DAY),
  },
  {
    re: /this\s+morning/i,
    phrase: /(this\s+morning)/i,
    shift: (now) => {
      const d = new Date(now);
      d.setHours(8, 0, 0, 0);
      return d > now ? now : d;
    },
  },
];

export function parseBackdate(
  description: string,
  now: Date = new Date()
): { clean: string; createdAt: Date | null } {
  const text = description.trim();
  for (const rule of RULES) {
    const m = rule.re.exec(text);
    if (!m) continue;
    const createdAt = rule.shift(now, m);
    const clean = text
      .replace(rule.phrase, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/^[,.\s]+|[,.\s]+$/g, "")
      .trim();
    return { clean: clean || "(no text - photo only)", createdAt };
  }
  return { clean: text, createdAt: null };
}
