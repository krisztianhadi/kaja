import Link from "next/link";
import {
  Bot,
  Camera,
  Coffee,
  LineChart,
  Shield,
  Sparkles,
  Star,
  Users,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Public landing page (/) - open-source + self-hostable marketing page.
 * The actual app lives behind /login (logbook at /logbook, stats,
 * settings) so visitors see the pitch, family members sign in.
 */

const FEATURES = [
  {
    icon: Camera,
    title: "Snap it or type it",
    text: "Photo or a one-liner - the AI figures out what it was and estimates the macros.",
  },
  {
    icon: Sparkles,
    title: "Honest estimates",
    text: "Calories, protein, fat, carbs, sugar, sodium. Best-effort numbers, clearly marked as estimates - not a wishlist.",
  },
  {
    icon: LineChart,
    title: "Budget that adapts",
    text: "BMR-based daily budget that learns your activity and goals. See where the day stands at a glance.",
  },
  {
    icon: Users,
    title: "Family logbook",
    text: "Share meals with the household. Everyone sees their own totals and the shared plate gets split fairly.",
  },
  {
    icon: Shield,
    title: "Self-hosted, BYOK",
    text: "Your data stays yours. Bring your own Gemini or OpenRouter key - or use the server's. No accounts, no tracking.",
  },
  {
    icon: Coffee,
    title: "Light on nagging",
    text: "One gentle nudge if you forget to record. Counter-actions when the day tips over - never a blocker.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Utensils className="h-5 w-5 text-primary" />
            Kaja
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="https://github.com/krisztianhadi/kaja"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <Star className="h-4 w-4" />
              GitHub
            </a>
            <Link href="/login" className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary hover:bg-primary/10">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto w-full max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-20">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/25 bg-card shadow-lifted">
            <Bot className="h-11 w-11 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Kaja
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
            The no-fuss food logbook. Tell it what you ate - or snap a photo -
            and it writes the numbers for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start logging
              </Button>
            </Link>
            <a
              href="https://github.com/krisztianhadi/kaja"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Self-host it
              </Button>
            </a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            &ldquo;kaja&rdquo; is Hungarian slang for food. Open source, free,
            runs on a potato.
          </p>
        </section>

        {/* features */}
        <section className="mx-auto w-full max-w-3xl px-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <f.icon className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* self-host CTA */}
        <section className="mx-auto w-full max-w-3xl px-4 pb-20">
          <div className="rounded-3xl border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
            <h2 className="text-xl font-bold">
              Your data, your server, your call
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Docker image + Postgres, deploy anywhere in minutes. Bring your
              own AI key or use the server&apos;s. No telemetry, no signup
              wall.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="https://github.com/krisztianhadi/kaja"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  <Star className="h-4 w-4" />
                  View on GitHub
                </Button>
              </a>
              <Link href="/login">
                <Button size="lg">Try the live instance</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row">
          <span>Kaja - the no-fuss food logbook</span>
          <span className="flex items-center gap-3">
            <a
              href="https://github.com/krisztianhadi/kaja"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <span aria-hidden>·</span>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
