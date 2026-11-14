import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

import { Reveal } from "@turnpike/shared/animations/motion-presets";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Button } from "@turnpike/shared/components/ui/button";
import { apiClient } from "@turnpike/shared/api/client";
import { API_BASE_URL, API_PREFIX } from "@turnpike/shared/constants/config";

export const Route = createFileRoute("/admin/system-health")({
  head: () => ({
    meta: [
      { title: "System Health — Turnpike Analyst Console" },
      {
        name: "description",
        content: "Live reachability and latency probes against every Turnpike Analyst API endpoint.",
      },
    ],
  }),
  component: SystemHealthPage,
});

const PROBES: { name: string; path: string; auth?: boolean }[] = [
  { name: "Authentication", path: "/auth/me", auth: true },
  { name: "Services", path: "/services/?limit=1" },
  { name: "Products", path: "/products/" },
  { name: "Leads", path: "/leads/?limit=1", auth: true },
  { name: "Training", path: "/training/courses?limit=1" },
  { name: "Blogs", path: "/blogs/?limit=1" },
  { name: "Newsletter", path: "/newsletter/subscribers?limit=1", auth: true },
  { name: "User Management", path: "/users?limit=1", auth: true },
  { name: "Activity Logs", path: "/activity-logs?limit=1", auth: true },
  { name: "CMS Library", path: "/cms/assets?limit=1", auth: true },
];

interface ProbeResult {
  name: string;
  path: string;
  auth: boolean;
  ok: boolean;
  status: number;
  ms: number;
}

async function runProbes(): Promise<ProbeResult[]> {
  return Promise.all(
    PROBES.map(async (probe) => {
      const started = performance.now();
      try {
        const response = await apiClient.get(probe.path, { validateStatus: () => true });
        return {
          ...probe,
          auth: !!probe.auth,
          ok: response.status < 400,
          status: response.status,
          ms: Math.round(performance.now() - started),
        };
      } catch {
        return { ...probe, auth: !!probe.auth, ok: false, status: 0, ms: Math.round(performance.now() - started) };
      }
    }),
  );
}

function SystemHealthPage() {
  const query = useQuery({
    queryKey: ["system-health"],
    queryFn: runProbes,
    refetchInterval: 30_000,
  });

  const results = query.data ?? [];
  const healthy = results.filter((result) => result.ok).length;
  const avg = results.length
    ? Math.round(results.reduce((total, result) => total + result.ms, 0) / results.length)
    : 0;

  return (
    <>
      <PageHeader
        title="System Health"
        description="Real reachability and latency probes fired from this browser against the production API. Auto-refreshes every 30 seconds."
        actions={
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <Activity className="size-4" /> {query.isFetching ? "Probing…" : "Run probes"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Endpoints healthy", value: `${healthy}/${results.length || PROBES.length}` },
          { label: "Average latency", value: `${avg} ms` },
          { label: "Origin", value: `${API_BASE_URL}${API_PREFIX}` },
        ].map((item) => (
          <GlassCard key={item.label} className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 break-all text-lg font-semibold">{item.value}</p>
          </GlassCard>
        ))}
      </div>

      <Reveal>
        <GlassCard className="p-2">
          <ul className="divide-y divide-border/50">
            {(results.length ? results : PROBES.map((probe) => ({ ...probe, auth: !!probe.auth, ok: false, status: 0, ms: 0 }))).map(
              (result) => (
                <li key={result.path} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  {result.ok ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{result.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {API_PREFIX}
                      {result.path}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3 text-xs">
                    {result.auth && <span className="text-muted-foreground">auth</span>}
                    <span className="tabular-nums text-muted-foreground">{result.ms} ms</span>
                    <span
                      className={
                        result.ok
                          ? "rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                          : "rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive"
                      }
                    >
                      {result.status || "ERR"}
                    </span>
                  </div>
                </li>
              ),
            )}
          </ul>
        </GlassCard>
      </Reveal>
    </>
  );
}
