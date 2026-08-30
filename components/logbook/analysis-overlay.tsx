"use client";

import { Loader2 } from "lucide-react";

/**
 * Full-screen loader shown while the model analyzes a meal:
 * semi-transparent, blurred backdrop.
 */
export function AnalysisOverlay({
  show,
  label = "Analyzing your meal...",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-4 bg-black/30 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}
