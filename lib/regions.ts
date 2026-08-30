/** Regions the user can pick so the AI suggests locally available dishes. */
export const REGIONS = [
  { value: "", label: "Worldwide" },
  { value: "thailand", label: "Thailand" },
  { value: "hungary", label: "Hungary" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "france", label: "France" },
  { value: "germany", label: "Germany" },
  { value: "uk", label: "United Kingdom" },
  { value: "usa", label: "United States" },
  { value: "india", label: "India" },
  { value: "japan", label: "Japan" },
  { value: "china", label: "China" },
  { value: "vietnam", label: "Vietnam" },
  { value: "korea", label: "South Korea" },
  { value: "mexico", label: "Mexico" },
  { value: "greece", label: "Greece" },
  { value: "turkey", label: "Turkey" },
  { value: "brazil", label: "Brazil" },
];

export function regionLabel(value: string | null): string {
  if (!value) return "";
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}
