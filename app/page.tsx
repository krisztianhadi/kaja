/* eslint-disable @next/next/no-img-element -- screenshots are static PNGs; next/image adds nothing here */
import {
  BellOff,
  Camera,
  Heart,
  MonitorSmartphone,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

/**
 * Public landing page (/) - open-source + self-hostable marketing page.
 * Position: a quiet food logbook, not a coach - no notifications, no
 * subscriptions. No public instance at all (BYOK / self-host only); the
 * GitHub repo is not published yet, so the only CTA is "Coming soon on
 * GitHub".
 */

const FEATURES = [
  {
    icon: Camera,
    title: "Snap it or type it",
    text: "A photo or a one-liner is enough. Kaja reads it and estimates the numbers.",
  },
  {
    icon: Sparkles,
    title: "Logbook, not coach",
    text: "No workout plans, no diet lectures. It logs what you ate and suggests small ways to counter the intake.",
  },
  {
    icon: BellOff,
    title: "No nagging",
    text: "No notifications, no streaks, no guilt. Best-effort logging - a blurry day is perfectly fine.",
  },
  {
    icon: Shield,
    title: "Your data, your server",
    text: "Self-host with Docker + Postgres in minutes. Data stays yours - only the AI request leaves if you use an external key.",
  },
  {
    icon: MonitorSmartphone,
    title: "Works everywhere",
    text: "A web app for mobile and any browser. Nothing to install, nothing to sync.",
  },
  {
    icon: Wallet,
    title: "No subscriptions",
    text: "Free and open source. It does one simple job and gets out of the way.",
  },
];

/** Screenshot of the real mobile app in a phone frame. */
function PhoneMockup() {
  return (
    <div className="relative w-full overflow-hidden rounded-[1.2rem] border-[6px] border-[hsl(28_20%_25%)] bg-card shadow-[0_25px_60px_-15px_rgba(28,18,10,0.5)] ring-1 ring-black/5">
      <span className="absolute left-1/2 top-2 h-1 w-16 -translate-x-1/2 rounded-full bg-[hsl(28_15%_20%)]" />
      <img
        src="/landing/logbook-mobile.png"
        alt="Kaja food logbook on a phone"
        className="block w-full"
      />
    </div>
  );
}

/** Screenshot of the real desktop logbook in a browser frame. */
function DesktopMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_80px_-24px_rgba(28,18,10,0.4)]">
      {/* slim browser bar */}
      <div className="flex items-center justify-center border-b border-border/60 bg-muted/30 px-4 py-2">
        <div className="flex h-6 w-64 items-center justify-center rounded-md bg-background font-mono text-[10px] text-muted-foreground">
          https://kaja.lostsignals.studio
        </div>
      </div>
      <img
        src="/landing/logbook-desktop.png"
        alt="Kaja food logbook on a computer"
        className="block w-full"
      />
    </div>
  );
}

/** Small GitHub mark (inline SVG - lucide has no brand icons). */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Kaja round logo (user-authored SVG mark). */
function StampLogo({ className }: { className?: string }) {
  return (
    <img
      src="/kaja-logo.svg"
      alt="Kaja"
      width={365}
      height={364}
      className={`mx-auto h-24 w-auto sm:h-28 ${className ?? ""}`}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="landing relative min-h-screen overflow-x-clip">
      <main>
        {/* hero - terracotta band with the logo, ghosted-style inverted band */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(17_45%_50%)] via-[hsl(18_50%_41%)] to-[hsl(18_58%_32%)] px-4 pb-28 pt-12 text-center sm:pb-36 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(55%_100%_at_50%_0%,_hsl(40_60%_98%_/_0.18)_0%,_transparent_100%)]"
          />
          <div className="relative text-[hsl(24_45%_13%)]">
            <StampLogo />
            <h1 className={`mx-auto mt-8 max-w-2xl text-balance text-4xl font-medium text-white sm:mt-7 sm:text-6xl`}>
              What? Another food tracker?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg">
              A quiet food logbook. Type a line or snap a photo - Kaja writes
              the numbers and suggests a small way to counter it. No
              notifications, no streaks, no guilt. No subscriptions, no cloud.
            </p>
            <div className="mt-8 flex justify-center">
              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm">
                <GithubIcon className="h-4 w-4" />
                Coming soon on GitHub
              </span>
            </div>
          </div>
        </section>

        {/* mockups - straddle the hero edge: desktop frame on sm+, phone only on mobile */}
        <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 sm:pb-16">
          <div className="relative -mt-16 sm:-mt-24">
            <div className="hidden sm:block">
              <DesktopMockup />
            </div>
            <div className="mx-auto w-[210px] sm:hidden">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* features */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-12 sm:pb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className={`mt-4 text-base font-medium`}>
                  {f.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* self-host CTA */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-12 sm:pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground shadow-lifted sm:p-12">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(70%_120%_at_85%_0%,_hsl(40_60%_98%_/_0.28)_0%,_transparent_65%)]"
            />
            <div className="relative">
              <h2 className={`text-balance text-3xl font-medium sm:text-4xl`}>
                The best food tracker? No.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                Kaja does one simple job - logging what you ate - and does it
                quietly. If that&apos;s what you need, it might work for you
                too. Self-host in minutes: Docker, Postgres, your own AI key.
              </p>
              <div className="mt-7 flex justify-center">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
                  <GithubIcon className="h-4 w-4" />
                  Coming soon on GitHub
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            Made with
            <Heart
              className="h-3.5 w-3.5 fill-red-500 text-red-500"
              aria-hidden
            />
            by Lost Signals Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
