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

/** Left/right lane offsets (px from the center) for the falling icons. */
const LANES = [
  { x: -64, delay: 0 },
  { x: 0, delay: 0.9 },
  { x: 64, delay: 1.8 },
];

/** Same lanes, offset half a cycle so sheets trail the food. */
const SHEET_LANES = [
  { x: -64, delay: 1.35 },
  { x: 0, delay: 2.25 },
  { x: 64, delay: 0.45 },
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
  const foodIcons = useMemo(() => pickIcons(LANES.length), [show]);
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-8 bg-black/30 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-44 w-64" aria-hidden>
        {/* robot head */}
        <div className="absolute left-1/2 top-1/2">
          <div className="flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/25 bg-card shadow-lifted motion-reduce:animate-none animate-kaja-breathe">
            <Bot className="h-11 w-11 text-primary" strokeWidth={1.75} />
          </div>
        </div>

        {/* food falling in from the top */}
        {LANES.map((lane, i) => {
          const Icon = foodIcons[i] ?? Apple;
          return (
            <div
              key={`in-${i}`}
              className="absolute left-1/2 top-1/2 animate-kaja-fall opacity-0 motion-reduce:hidden"
              style={{
                marginLeft: lane.x,
                animationDelay: `${lane.delay}s`,
              }}
            >
              <Icon className="h-6 w-6 text-foreground/80" strokeWidth={1.75} />
            </div>
          );
        })}

        {/* report sheets coming out below */}
        {SHEET_LANES.map((lane, i) => (
          <div
            key={`out-${i}`}
            className="absolute left-1/2 top-1/2 animate-kaja-out opacity-0 motion-reduce:hidden"
            style={{
              marginLeft: lane.x,
              animationDelay: `${lane.delay}s`,
            }}
          >
            <FileText
              className="h-6 w-6 text-primary/70"
              strokeWidth={1.75}
            />
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}
