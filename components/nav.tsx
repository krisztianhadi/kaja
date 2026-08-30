"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Menu,
  Settings as SettingsIcon,
  UtensilsCrossed,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Logbook", icon: BookOpen },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const user = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span>Kaja</span>
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
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {menuOpen && (
          <>
            {/* click-away layer */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            {/* dropdown under the hamburger, like Ghosted */}
            <nav
              role="menu"
              className="absolute right-4 top-full z-40 mt-1 w-48 rounded-2xl border bg-card p-1 shadow-lifted"
            >
              {TABS.map((tab) => (
                <Link
                  key={tab.href}
                  role="menuitem"
                  href={tab.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive(tab.href)
                      ? "bg-accent text-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <tab.icon className="h-4 w-4 text-primary" />
                  {tab.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
