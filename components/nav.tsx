"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { useUser } from "@/components/user-context";
import { Button } from "@/components/ui";

export function Nav() {
  const user = useUser();
  const router = useRouter();
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

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          Kaja
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Logbook
          </Link>
          <Link
            href="/dashboard"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Settings
          </Link>
        </nav>
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
  );
}
