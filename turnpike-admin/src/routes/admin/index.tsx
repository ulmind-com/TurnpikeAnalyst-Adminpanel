import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Boxes, FileText, GraduationCap, Mail, Workflow } from "lucide-react";
import { useMemo } from "react";

import { Reveal, Stagger, StaggerItem } from "@turnpike/shared/animations/motion-presets";
import { CountUp } from "@turnpike/shared/components/premium/count-up";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { CardSkeleton, ErrorState } from "@turnpike/shared/components/premium/states";
import { Button } from "@turnpike/shared/components/ui/button";
import {
  useBlogs,
  useCourses,
  useLeads,
  useServices,
  useSubscribers,
} from "@turnpike/shared/hooks/use-api";
import { describeError, useSession } from "@turnpike/shared/hooks/use-auth";
import { formatDateTime, titleCase } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Turnpike Analyst Enterprise Console" },
      {
        name: "description",
        content:
          "Live operational overview of leads, services, products, training and content across the Turnpike Analyst platform.",
      },
      { property: "og:title", content: "Dashboard — Turnpike Analyst Enterprise Console" },
      {
        property: "og:description",
        content: "Live operational overview across the Turnpike Analyst platform.",
      },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function DashboardPage() {
  const { user } = useSession();
  const leads = useLeads({ skip: 0, limit: 100 });
  const services = useServices({ skip: 0, limit: 100 });
  const courses = useCourses({ skip: 0, limit: 100 });
  const blogs = useBlogs({ skip: 0, limit: 100 });
  const subscribers = useSubscribers({ skip: 0, limit: 100 });

  const leadRows = leads.data ?? [];

  const kpis = [
    {
      label: "Total leads",
      value: leadRows.length,
      hint: `${leadRows.filter((lead) => (lead.status ?? "PENDING") === "PENDING").length} pending`,
      icon: Workflow,
      to: "/leads",
    },
    {
      label: "Services",
      value: services.data?.length ?? 0,
      hint: `${services.data?.filter((item) => item.is_featured).length ?? 0} featured`,
      icon: Boxes,
      to: "/services",
    },
    {
      label: "Training courses",
      value: courses.data?.length ?? 0,
      hint: `${courses.data?.filter((item) => item.is_published).length ?? 0} published`,
      icon: GraduationCap,
      to: "/courses",
    },
    {
      label: "Subscribers",
      value: subscribers.data?.length ?? 0,
      hint: `${blogs.data?.length ?? 0} articles live`,
      icon: Mail,
      to: "/newsletter",
    },
  ];

  const trend = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - index));
      return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }), leads: 0 };
    });
    const index = new Map(days.map((day) => [day.key, day]));
    leadRows.forEach((lead) => {
      const key = lead.created_at?.slice(0, 10);
      const bucket = key ? index.get(key) : undefined;
      if (bucket) bucket.leads += 1;
    });
    return days;
  }, [leadRows]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    leadRows.forEach((lead) => {
      const key = lead.status ?? "PENDING";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name: titleCase(name), value }));
  }, [leadRows]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    (services.data ?? []).forEach((service) => {
      const key = titleCase(service.parent_category);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [services.data]);

  const anyError = leads.error ?? services.error;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] ?? "operator"}`}
        description="A live view of the Turnpike Analyst platform — every figure below is read straight from the production API."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/leads">
              Triage leads <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {anyError ? (
        <GlassCard interactive={false}>
          <ErrorState message={describeError(anyError)} onRetry={() => void leads.refetch()} />
        </GlassCard>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) =>
            leads.isLoading ? (
              <CardSkeleton key={kpi.label} />
            ) : (
              <StaggerItem key={kpi.label}>
                <Link to={kpi.to}>
                  <GlassCard className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {kpi.label}
                        </p>
                        <p className="mt-2 text-3xl font-semibold">
                          <CountUp value={kpi.value} />
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                      </div>
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <kpi.icon className="size-5" />
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </StaggerItem>
            ),
          )}
        </Stagger>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lead flow · last 14 days</p>
                <p className="text-xs text-muted-foreground">Grouped by submission date</p>
              </div>
              <StatusBadge value="LIVE" tone="success" />
            </div>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -22, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="leadFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <ReTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#leadFlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </Reveal>

        <Reveal>
          <GlassCard className="p-5">
            <p className="font-medium">Pipeline mix</p>
            <p className="text-xs text-muted-foreground">Leads by status</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2">
              {byStatus.map((entry, index) => (
                <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {entry.name} · {entry.value}
                </span>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <GlassCard className="p-5">
            <p className="font-medium">Service portfolio</p>
            <p className="text-xs text-muted-foreground">Offerings per parent category</p>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ left: -22, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-12} height={50} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <ReTooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--color-chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </Reveal>

        <Reveal>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">Latest leads</p>
              <Button asChild size="sm" variant="ghost">
                <Link to="/admin/leads">All</Link>
              </Button>
            </div>
            <ul className="mt-3 space-y-3">
              {leadRows.slice(0, 6).map((lead) => (
                <li key={lead._id} className="flex items-start gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full gradient-brand" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.subject} · {formatDateTime(lead.created_at)}
                    </p>
                  </div>
                </li>
              ))}
              {!leadRows.length && (
                <li className="py-6 text-center text-sm text-muted-foreground">No leads yet</li>
              )}
            </ul>
          </GlassCard>
        </Reveal>
      </div>

      <Reveal>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Content & catalog snapshot</p>
              <p className="text-xs text-muted-foreground">Products, articles and courses live now</p>
            </div>
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Articles", value: blogs.data?.length ?? 0, to: "/blogs" },
              { label: "Courses", value: courses.data?.length ?? 0, to: "/courses" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-primary/40"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
              </Link>
            ))}
          </div>
        </GlassCard>
      </Reveal>
    </>
  );
}
