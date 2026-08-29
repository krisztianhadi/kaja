"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  LogOut,
  Settings as SettingsIcon,
  UtensilsCrossed,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Logbook", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Kaja</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.username}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              disabled={signingOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* desktop: pill nav under the header */}
      <nav className="mx-auto hidden w-full max-w-2xl gap-1 px-4 pt-3 sm:flex">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive(tab.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                isActive(tab.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
