"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import type { MealDto } from "@/lib/types";
import { useUser } from "@/components/user-context";
import { dayKeyFor } from "@/lib/client-date";
import { Card, CardContent } from "@/components/ui";

const DISMISS_PREFIX = "kaja-forgot-dismiss-";

export function ForgotBanner() {
  const user = useUser();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return (
        localStorage.getItem(DISMISS_PREFIX + dayKeyFor(Date.now(), new Date().getTimezoneOffset())) === "1"
      );
    } catch {
      return false;
    }
  });

  const { data } = useQuery({
    queryKey: ["meals"],
    queryFn: () => api<{ meals: MealDto[] }>("/api/meals?limit=40"),
  });

  const now = new Date();
  const todayKey = dayKeyFor(now.getTime(), now.getTimezoneOffset());
  const hour = now.getHours();

  if (!user || dismissed) return null;
  const loggedToday = (data?.meals ?? []).some(
    (m) => dayKeyFor(new Date(m.createdAt).getTime(), now.getTimezoneOffset()) === todayKey
  );

  // gentle nudge only: nothing logged today, and it is evening
  if (loggedToday || hour < 18) return null;

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
      <CardContent className="flex items-center justify-between gap-3 py-2.5">
        <p className="text-sm">
          Nothing logged today yet - want to record your meal?
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_PREFIX + todayKey, "1");
            } catch {
              // ignore
            }
            setDismissed(true);
          }}
          className="shrink-0 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
        >
          Dismiss
        </button>
      </CardContent>
    </Card>
  );
}
