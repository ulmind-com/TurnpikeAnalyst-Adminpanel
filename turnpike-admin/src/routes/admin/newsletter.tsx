import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DataGrid, type DataGridColumn } from "@turnpike/shared/components/premium/data-grid";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { DEFAULT_PAGE_SIZE } from "@turnpike/shared/constants/config";
import { useSubscribers } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import type { NewsletterResponse } from "@turnpike/shared/types/api";
import { formatDateTime } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter Subscribers — Turnpike Analyst Console" },
      { name: "description", content: "Live newsletter subscriber list with CSV export." },
      { property: "og:title", content: "Newsletter Subscribers — Turnpike Analyst Console" },
      { property: "og:description", content: "Live newsletter subscriber list with CSV export." },
    ],
  }),
  component: NewsletterPage,
});

function NewsletterPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const query = useSubscribers({
    skip: 0,
    limit: 10000,
  });

  const rows = query.data ?? [];
  const active = rows.filter((row) => row.is_active !== false).length;

  const columns: DataGridColumn<NewsletterResponse>[] = [
    {
      key: "email",
      header: "Email",
      sortable: true,
      value: (row) => row.email,
      cell: (row) => (
        <a href={`mailto:${row.email}`} className="font-medium text-primary hover:underline">
          {row.email}
        </a>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      value: (row) => (row.is_active === false ? "Inactive" : "Active"),
      cell: (row) => <StatusBadge value={row.is_active === false ? "INACTIVE" : "ACTIVE"} />,
    },
    {
      key: "subscribed_at",
      header: "Subscribed",
      sortable: true,
      value: (row) => row.subscribed_at,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.subscribed_at)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Newsletter Subscribers"
        description="Everyone who opted in through the Turnpike Analyst website."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "On this page", value: rows.length },
          { label: "Active", value: active },
          { label: "Unsubscribed", value: rows.length - active },
        ].map((item) => (
          <GlassCard key={item.label} className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
          </GlassCard>
        ))}
      </div>

      <DataGrid
        rows={query.data}
        columns={columns}
        getRowId={(row) => row._id ?? row.email}
        isLoading={query.isLoading}
        error={query.error ? { message: describeError(query.error) } : null}
        onRetry={() => void query.refetch()}
        searchPlaceholder="Search subscribers…"
        exportName="turnpike-subscribers"
        emptyTitle="No subscribers yet"
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />
    </>
  );
}
