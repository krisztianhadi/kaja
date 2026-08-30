import { cn } from "@/lib/utils";

/** Pill-style segmented control (custom - no shadcn equivalent needed). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  fullWidth,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
  /** stretch to full width, options share the space equally */
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-secondary p-1",
        fullWidth && "grid w-full grid-flow-col",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            fullWidth && "flex-1",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
