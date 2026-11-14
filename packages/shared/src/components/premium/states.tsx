import { AlertTriangle, Inbox, PlugZap, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { Button } from "@turnpike/shared/components/ui/button";
import { Skeleton } from "@turnpike/shared/components/ui/skeleton";

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center" role="alert">
      <div className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="font-medium">We couldn&apos;t load this data</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          <RefreshCw className="size-4" /> Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Shown for surfaces the Turnpike API does not expose yet. We never fabricate
 * data — the exact missing endpoint is named instead.
 */
export function ApiUnavailable({
  feature,
  endpoint,
  note,
}: {
  feature: string;
  endpoint: string;
  note?: string;
}) {
  return (
    <GlassCard interactive={false} className="p-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary/12 text-secondary">
          <PlugZap className="size-5" />
        </div>
        <p className="text-lg font-semibold">{feature} is not exposed by the API yet</p>
        <p className="max-w-xl text-sm text-muted-foreground">
          This console only renders live backend data — no placeholders. Ship{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{endpoint}</code> and
          this page activates immediately.
        </p>
        {note && <p className="max-w-xl text-xs text-muted-foreground">{note}</p>}
      </div>
    </GlassCard>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-5 shimmer" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl glass-panel p-6">
      <Skeleton className="h-4 w-24 shimmer" />
      <Skeleton className="h-8 w-32 shimmer" />
      <Skeleton className="h-3 w-40 shimmer" />
    </div>
  );
}
