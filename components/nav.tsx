"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  // viewport coords for the fixed dropdown so it anchors to the hamburger
  // icon (which is mid-screen on desktop, not at the viewport corner)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      if (open) return false;
      const el = menuBtnRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
      }
      return true;
    });
  }, []);

  // close on resize - the fixed menu would detach from the icon otherwise
  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => setMenuOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

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
            ref={menuBtnRef}
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
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
          style={menuPos ?? undefined}
          className="fixed z-[45] w-60 rounded-2xl border bg-card p-2 shadow-lifted"
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
