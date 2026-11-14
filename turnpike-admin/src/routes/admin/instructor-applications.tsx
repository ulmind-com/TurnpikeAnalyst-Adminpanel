import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { DataGrid, type DataGridColumn } from "@turnpike/shared/components/premium/data-grid";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { DEFAULT_PAGE_SIZE } from "@turnpike/shared/constants/config";
import { useInstructorApplications } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type InstructorApplicationResponse,
} from "@turnpike/shared/types/api";
import { formatDateTime, titleCase } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/instructor-applications")({
  head: () => ({
    meta: [
      { title: "Instructor Applications — Turnpike Analyst Console" },
      { name: "description", content: "Review applications from prospective instructors." },
      { property: "og:title", content: "Instructor Applications — Turnpike Analyst Console" },
      { property: "og:description", content: "Review applications from prospective instructors." },
    ],
  }),
  component: InstructorApplicationsPage,
});

function InstructorApplicationsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<ApplicationStatus | "ALL">("ALL");

  const query = useInstructorApplications({
    skip: 0,
    limit: 10000,
    ...(status === "ALL" ? {} : { status }),
  });

  const columns: DataGridColumn<InstructorApplicationResponse>[] = [
    {
      key: "full_name",
      header: "Applicant",
      sortable: true,
      value: (row) => `${row.full_name} ${row.email}`,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      value: (row) => row.phone,
      cell: (row) => <span className="text-xs">{row.phone}</span>,
    },
    {
      key: "expertise_areas",
      header: "Expertise",
      value: (row) => (row.expertise_areas ?? []).join(", "),
      className: "max-w-[280px]",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.expertise_areas ?? []).slice(0, 3).map((area) => (
            <span key={area} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              {area}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "resume_url",
      header: "Résumé",
      value: (row) => row.resume_url,
      cell: (row) => (
        <a
          href={row.resume_url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open <ExternalLink className="size-3" />
        </a>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (row) => row.status,
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "submitted_at",
      header: "Submitted",
      sortable: true,
      value: (row) => row.submitted_at,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.submitted_at)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Instructor Applications"
        description="Applications submitted through the become-an-instructor flow. The API exposes these as read-only."
      />

      <DataGrid
        rows={query.data}
        columns={columns}
        getRowId={(row) => row._id ?? row.email}
        isLoading={query.isLoading}
        error={query.error ? { message: describeError(query.error) } : null}
        onRetry={() => void query.refetch()}
        searchPlaceholder="Search applicants…"
        exportName="turnpike-instructor-applications"
        selectable={false}
        emptyTitle="No applications yet"
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
              setStatus(value as ApplicationStatus | "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {APPLICATION_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </>
  );
}
