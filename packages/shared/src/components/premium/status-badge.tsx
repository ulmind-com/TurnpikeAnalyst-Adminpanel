import { cn } from "@turnpike/shared/lib/utils";
import { titleCase } from "@turnpike/shared/utils/format";

type Tone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE_MAP: Record<string, Tone> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CANCELLED: "danger",
  SUBMITTED: "warning",
  UNDER_REVIEW: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  BEGINNER: "success",
  INTERMEDIATE: "info",
  ADVANCED: "warning",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-primary/10 text-primary ring-primary/25",
  warning: "bg-warning/15 text-warning-foreground ring-warning/35",
  info: "bg-secondary/12 text-secondary ring-secondary/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({
  value,
  tone,
  className,
}: {
  value?: string | null;
  tone?: Tone;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const resolved = tone ?? TONE_MAP[value] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset backdrop-blur",
        TONE_CLASS[resolved],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {titleCase(value)}
    </span>
  );
}
