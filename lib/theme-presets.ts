/** shadcn-style theme presets (base color picks, light + dark). */
export const THEME_PRESETS = [
  { value: "emerald", label: "Emerald" },
  { value: "ocean", label: "Ocean" },
  { value: "sunset", label: "Sunset" },
  { value: "violet", label: "Violet" },
  { value: "raspberry", label: "Raspberry" },
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number]["value"];
