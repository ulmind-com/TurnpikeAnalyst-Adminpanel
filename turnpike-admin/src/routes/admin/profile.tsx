import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, Phone, ShieldCheck } from "lucide-react";

import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { CardSkeleton } from "@turnpike/shared/components/premium/states";
import { Button } from "@turnpike/shared/components/ui/button";
import { useLogout, useSession } from "@turnpike/shared/hooks/use-auth";
import { formatDateTime, titleCase } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Turnpike Analyst Console" },
      { name: "description", content: "Your Turnpike Analyst account details and role." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isLoading } = useSession();
  const logout = useLogout();

  if (isLoading) return <CardSkeleton />;

  const rows = [
    { label: "Email", value: user?.email, icon: Mail },
    { label: "Phone", value: user?.phone ?? "—", icon: Phone },
    { label: "Company", value: user?.company ?? "—", icon: Building2 },
    { label: "Role", value: titleCase(user?.role), icon: ShieldCheck },
  ];

  return (
    <>
      <PageHeader
        title="Profile"
        description="Read live from /auth/me. The API exposes no profile-update endpoint, so this view is read-only."
        actions={
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        }
      />

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl gradient-brand text-xl font-semibold text-primary-foreground shadow-glow">
            {(user?.full_name ?? "?")
              .split(" ")
              .map((part) => part[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <h2 className="text-xl font-semibold">{user?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <StatusBadge value={user?.is_active === false ? "INACTIVE" : "ACTIVE"} />
            <StatusBadge value={user?.role} tone="info" />
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-border/50 bg-background/40 p-4">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <row.icon className="size-3.5" /> {row.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-muted-foreground">
          Member since {formatDateTime(user?.created_at)}
        </p>
      </GlassCard>
    </>
  );
}
