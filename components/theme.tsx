"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theme-presets";

export type ThemeMode = "system" | "light" | "dark";

const MODE_KEY = "kaja-theme";
const PRESET_KEY = "kaja-theme-preset";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  preset: ThemePreset;
  setPreset: (p: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  setMode: () => {},
  preset: "emerald",
  setPreset: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

function apply(mode: ThemeMode, preset: ThemePreset) {
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  for (const p of THEME_PRESETS) root.classList.remove(`theme-${p.value}`);
  if (preset !== "emerald") root.classList.add(`theme-${preset}`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [preset, setPresetState] = useState<ThemePreset>("emerald");

  // read stored preferences after mount (the inline script in the layout
  // already applied them pre-hydration to avoid a flash)
  useEffect(() => {
    let storedMode: ThemeMode = "system";
    let storedPreset: ThemePreset = "emerald";
    try {
      const raw = localStorage.getItem(MODE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") {
        storedMode = raw;
      }
      const p = localStorage.getItem(PRESET_KEY);
      if (THEME_PRESETS.some((t) => t.value === p)) {
        storedPreset = p as ThemePreset;
      }
    } catch {
      // ignore
    }
    setModeState(storedMode);
    setPresetState(storedPreset);
    apply(storedMode, storedPreset);
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // ignore
    }
    apply(m, preset);
  };

  const setPreset = (p: ThemePreset) => {
    setPresetState(p);
    try {
      localStorage.setItem(PRESET_KEY, p);
    } catch {
      // ignore
    }
    apply(mode, p);
  };

  // follow OS changes while in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system", preset);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, preset]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, preset, setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}
