import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";

import { DataGrid, type DataGridColumn } from "@turnpike/shared/components/premium/data-grid";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { MagneticButton } from "@turnpike/shared/components/premium/magnetic-button";
import { Button } from "@turnpike/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@turnpike/shared/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { ServiceFormDialog } from "@/features/services/service-form-dialog";
import { DEFAULT_PAGE_SIZE } from "@turnpike/shared/constants/config";
import { useDeleteService, useServices } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import { PARENT_CATEGORIES, type ParentCategory, type ServiceResponse } from "@turnpike/shared/types/api";
import { formatDate, titleCase } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/services")({
  head: () => ({
    meta: [
      { title: "Services — Turnpike Analyst Console" },
      {
        name: "description",
        content: "Create, edit and publish the Turnpike Analyst service catalog.",
      },
      { property: "og:title", content: "Services — Turnpike Analyst Console" },
      { property: "og:description", content: "Manage the Turnpike Analyst service catalog." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [category, setCategory] = useState<ParentCategory | "ALL">("ALL");
  const [editing, setEditing] = useState<ServiceResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ServiceResponse | null>(null);

  const params = {
    skip: 0,
    limit: 10000,
    exclude_category: "DIGITAL_CONTENT_SERVICES",
    ...(category === "ALL" ? {} : { parent_category: category }),
  };
  const query = useServices(params);
  const remove = useDeleteService();

  const columns: DataGridColumn<ServiceResponse>[] = [
    {
      key: "title",
      header: "Service",
      sortable: true,
      value: (row) => `${row.title} ${row.slug}`,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.title}</p>
          <p className="truncate text-xs text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "parent_category",
      header: "Category",
      sortable: true,
      value: (row) => row.parent_category,
      cell: (row) => <span className="text-xs">{titleCase(row.parent_category)}</span>,
    },
    {
      key: "sub_service_type",
      header: "Sub-service",
      sortable: true,
      value: (row) => row.sub_service_type,
      cell: (row) => <span className="text-xs">{titleCase(row.sub_service_type)}</span>,
    },
    {
      key: "short_description",
      header: "Summary",
      value: (row) => row.short_description,
      className: "max-w-[320px]",
      cell: (row) => (
        <span className="line-clamp-2 text-xs text-muted-foreground">{row.short_description}</span>
      ),
    },
    {
      key: "is_featured",
      header: "Featured",
      sortable: true,
      value: (row) => (row.is_featured ? "Yes" : "No"),
      cell: (row) => <StatusBadge value={row.is_featured ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      value: (row) => row.created_at,
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Services"
        description="The full service catalog served by the Turnpike Analyst API, with live create, update and delete."
        actions={
          <MagneticButton onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New service
          </MagneticButton>
        }
      />

      <DataGrid
        rows={query.data}
        columns={columns}
        getRowId={(row) => row._id ?? row.slug}
        isLoading={query.isLoading}
        error={query.error ? { message: describeError(query.error) } : null}
        onRetry={() => void query.refetch()}
        searchPlaceholder="Search services…"
        exportName="turnpike-services"
        emptyTitle="No services yet"
        emptyDescription="Create your first service offering to populate the public catalog."
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        filters={
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value as ParentCategory | "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-56" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {PARENT_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" aria-label="Edit service" onClick={() => setEditing(row)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete service"
              className="text-destructive"
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      />

      <ServiceFormDialog
        open={creating || !!editing}
        service={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the service from the live platform immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete?._id) remove.mutate(pendingDelete._id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
