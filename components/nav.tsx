"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  Moon,
  Settings as SettingsIcon,
  Sun,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { useTheme } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Logbook", icon: BookOpen },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const user = useUser();
  const { mode, setMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // still navigate away
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span>Kaja</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>

    {menuOpen && (
      <>
        {/* click-away layer - OUTSIDE the header's stacking context so it
            sits above the pinned record box and everything on the page */}
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => setMenuOpen(false)}
        />
        <nav
          role="menu"
          className="fixed right-4 top-[3.875rem] z-[45] w-60 rounded-2xl border bg-card p-2 shadow-lifted"
        >
              {/* user */}
              {user && (
                <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium">
                    {user.username}
                  </span>
                </div>
              )}

              {/* nav links */}
              <div className="space-y-0.5">
                {TABS.map((tab) => (
                  <Link
                    key={tab.href}
                    role="menuitem"
                    href={tab.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(tab.href)
                        ? "bg-accent text-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <tab.icon className="h-4 w-4 text-primary" />
                    {tab.label}
                  </Link>
                ))}
              </div>

              <div className="my-1.5 h-px bg-border" />

              {/* night mode */}
              <button
                type="button"
                role="menuitem"
                onClick={() => setMode(isDark ? "light" : "dark")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-primary" />
                ) : (
                  <Moon className="h-4 w-4 text-primary" />
                )}
                Night mode
                <span
                  className={cn(
                    "ml-auto relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    isDark ? "bg-primary" : "bg-secondary"
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      isDark && "translate-x-4"
                    )}
                  />
                </span>
              </button>

              <div className="my-1.5 h-px bg-border" />

              {/* log out */}
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
          </nav>
        </>
      )}
    </>
  );
}
