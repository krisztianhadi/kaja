"use client";

import {
  Apple,
  Banana,
  Beef,
  Bot,
  Cake,
  Carrot,
  Coffee,
  Donut,
  Drumstick,
  Egg,
  FileText,
  Fish,
  Pizza,
  Salad,
  Sandwich,
  Soup,
} from "lucide-react";
import { useMemo } from "react";

/**
 * Full-screen loader shown while the model analyzes a meal:
 * a robot head in the middle, food icons falling into it from the top,
 * and report sheets coming out below it. Pure CSS keyframes, no deps.
 * Respects prefers-reduced-motion (the animation is skipped there).
 */

const FOOD_ICONS = [
  Apple,
  Banana,
  Beef,
  Cake,
  Carrot,
  Coffee,
  Donut,
  Drumstick,
  Egg,
  Fish,
  Pizza,
  Salad,
  Sandwich,
  Soup,
];

/** Same count of lanes, half a cycle later so sheets trail the food. */
const LANES = [
  { delay: 0 },
  { delay: 0.9 },
  { delay: 1.8 },
];

const SHEET_LANES = [
  { delay: 1.35 },
  { delay: 2.25 },
  { delay: 0.45 },
];

function pickIcons(count: number) {
  const pool = [...FOOD_ICONS];
  const out: typeof FOOD_ICONS = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export function AnalysisOverlay({
  show,
  label = "Analyzing your meal...",
}: {
  show: boolean;
  label?: string;
}) {
  // random set per analysis, stable for the whole run
  const foodIcons = useMemo(() => pickIcons(LANES.length), []);
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-5 bg-black/30 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-16 w-72" aria-hidden>
        {/* robot head - highest layer, food disappears behind it */}
        <div className="absolute left-1/2 top-1/2 z-10">
          <div className="flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/25 bg-card shadow-lifted motion-reduce:animate-none animate-kaja-breathe">
            <Bot className="h-11 w-11 text-primary" strokeWidth={1.75} />
          </div>
        </div>

        {/* food traveling in from the left, into the robot */}
        {LANES.map((lane, i) => {
          const Icon = foodIcons[i] ?? Apple;
          return (
            <div
              key={`in-${i}`}
              className="absolute left-1/2 top-1/2 animate-kaja-fall opacity-0 motion-reduce:hidden"
              style={{ animationDelay: `${lane.delay}s` }}
            >
              <Icon className="h-6 w-6 text-foreground/80" strokeWidth={1.75} />
            </div>
          );
        })}

        {/* report sheets coming out the right side of the robot */}
        {SHEET_LANES.map((lane, i) => (
          <div
            key={`out-${i}`}
            className="absolute left-1/2 top-1/2 animate-kaja-out opacity-0 motion-reduce:hidden"
            style={{ animationDelay: `${lane.delay}s` }}
          >
            <FileText
              className="h-6 w-6 text-primary/70"
              strokeWidth={1.75}
            />
          </div>
        ))}
      </div>
      <p className="text-base font-semibold text-foreground">{label}</p>
    </div>
  );
}
