import { useMemo, useState } from "react";
import { Mail, Phone } from "lucide-react";

import { DataGrid, type DataGridColumn } from "@turnpike/shared/components/premium/data-grid";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { Button } from "@turnpike/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@turnpike/shared/components/ui/sheet";
import { DEFAULT_PAGE_SIZE } from "@turnpike/shared/constants/config";
import { useLeads, useUpdateLeadStatus } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import { LEAD_STATUSES, type LeadResponse, type LeadStatus, type LeadType } from "@turnpike/shared/types/api";
import { formatDateTime, relativeTime, titleCase } from "@turnpike/shared/utils/format";

export function LeadsWorkspace({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  /** Restrict the pipeline to a single lead type (client-side filter). */
  type?: LeadType;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [active, setActive] = useState<LeadResponse | null>(null);

  const params = {
    skip: 0,
    limit: 10000,
    ...(status === "ALL" ? {} : { status }),
  };
  const query = useLeads(params);
  const updateStatus = useUpdateLeadStatus(params);

  const rows = useMemo(
    () => (type ? (query.data ?? []).filter((lead) => lead.type === type) : query.data),
    [query.data, type],
  );

  const columns: DataGridColumn<LeadResponse>[] = [
    {
      key: "full_name",
      header: "Contact",
      sortable: true,
      value: (row) => `${row.full_name} ${row.email} ${row.company}`,
      cell: (row) => (
        <button
          type="button"
          onClick={() => setActive(row)}
          className="text-left transition-colors hover:text-primary"
        >
          <span className="block font-medium">{row.full_name}</span>
          <span className="block text-xs text-muted-foreground">{row.company}</span>
        </button>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      value: (row) => row.subject,
      className: "max-w-[280px]",
      cell: (row) => <span className="line-clamp-1 text-muted-foreground">{row.subject}</span>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      value: (row) => row.type,
      cell: (row) => <span className="text-xs">{titleCase(row.type)}</span>,
    },
    {
      key: "department",
      header: "Department",
      value: (row) => row.department,
      cell: (row) => <span className="text-xs">{titleCase(row.department) || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (row) => row.status,
      cell: (row) => (
        <Select
          value={row.status ?? "PENDING"}
          onValueChange={(value) =>
            updateStatus.mutate({ id: row._id!, status: value as LeadStatus })
          }
        >
          <SelectTrigger className="h-8 w-36 border-transparent bg-transparent px-1" aria-label="Lead status">
            <StatusBadge value={row.status} />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {titleCase(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "sla_reply_deadline",
      header: "SLA",
      sortable: true,
      value: (row) => row.sla_reply_deadline,
      cell: (row) => {
        const overdue =
          row.sla_reply_deadline &&
          new Date(row.sla_reply_deadline).getTime() < Date.now() &&
          row.status !== "RESOLVED";
        return (
          <span className={overdue ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
            {relativeTime(row.sla_reply_deadline)}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Received",
      sortable: true,
      value: (row) => row.created_at,
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</span>,
    },
  ];

  const counts = LEAD_STATUSES.map((value) => ({
    value,
    total: (rows ?? []).filter((lead) => (lead.status ?? "PENDING") === value).length,
  }));

  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map((item) => (
          <GlassCard key={item.value} className="p-4">
            <p className="text-xs text-muted-foreground">{titleCase(item.value)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{item.total}</p>
          </GlassCard>
        ))}
      </div>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row._id ?? row.email}
        isLoading={query.isLoading}
        error={query.error ? { message: describeError(query.error) } : null}
        onRetry={() => void query.refetch()}
        searchPlaceholder="Search leads by name, company, subject…"
        exportName="turnpike-leads"
        emptyTitle="No leads in this view"
        emptyDescription="New submissions from the website land here in real time."
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        filters={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as LeadStatus | "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-40" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {LEAD_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        bulkActions={(selected, clear) => (
          <>
            {(["IN_PROGRESS", "RESOLVED"] as LeadStatus[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                onClick={() => {
                  selected.forEach((lead) =>
                    lead._id ? updateStatus.mutate({ id: lead._id, status: value }) : null,
                  );
                  clear();
                }}
              >
                Mark {titleCase(value)}
              </Button>
            ))}
          </>
        )}
        rowActions={(row) => (
          <Button size="sm" variant="ghost" onClick={() => setActive(row)}>
            View
          </Button>
        )}
      />

      <Sheet open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.full_name}</SheetTitle>
                <SheetDescription>
                  {active.company} · {titleCase(active.type)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-8">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={active.status} />
                  {active.department && <StatusBadge value={active.department} tone="neutral" />}
                </div>

                <div className="grid gap-2 text-sm">
                  <a
                    href={`mailto:${active.email}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="size-4" /> {active.email}
                  </a>
                  <a
                    href={`tel:${active.phone}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="size-4" /> {active.phone}
                  </a>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
                  <p className="mt-1 font-medium">{active.subject}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{active.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Received</p>
                    <p className="mt-1">{formatDateTime(active.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">SLA deadline</p>
                    <p className="mt-1">{formatDateTime(active.sla_reply_deadline)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {LEAD_STATUSES.map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={active.status === value ? "default" : "outline"}
                      onClick={() => {
                        if (!active._id) return;
                        updateStatus.mutate({ id: active._id, status: value });
                        setActive({ ...active, status: value });
                      }}
                    >
                      {titleCase(value)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
