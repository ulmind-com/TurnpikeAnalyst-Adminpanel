import { createFileRoute } from "@tanstack/react-router";
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
import { useCourses } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  type CourseCategory,
  type CourseLevel,
  type CourseResponse,
} from "@turnpike/shared/types/api";
import { formatCurrency, titleCase } from "@turnpike/shared/utils/format";
import { CourseFormDialog } from "@/features/courses/course-form-dialog";
import { useCreateCourse, useUpdateCourse, useDeleteCourse } from "@turnpike/shared/hooks/use-api";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@turnpike/shared/components/ui/button";

export const Route = createFileRoute("/admin/courses")({
  head: () => ({
    meta: [
      { title: "Training Courses — Turnpike Analyst Console" },
      { name: "description", content: "Catalog of ECM, cloud and AI training courses." },
      { property: "og:title", content: "Training Courses — Turnpike Analyst Console" },
      { property: "og:description", content: "Catalog of ECM, cloud and AI training courses." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [category, setCategory] = useState<CourseCategory | "ALL">("ALL");
  const [level, setLevel] = useState<CourseLevel | "ALL">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseResponse | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const query = useCourses({
    skip: 0,
    limit: 10000,
    ...(category === "ALL" ? {} : { category }),
    ...(level === "ALL" ? {} : { level }),
  });

  const columns: DataGridColumn<CourseResponse>[] = [
    {
      key: "title",
      header: "Course",
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
      key: "category",
      header: "Category",
      sortable: true,
      value: (row) => row.category,
      cell: (row) => <span className="text-xs">{titleCase(row.category)}</span>,
    },
    {
      key: "level",
      header: "Level",
      sortable: true,
      value: (row) => row.level,
      cell: (row) => <StatusBadge value={row.level} />,
    },
    {
      key: "duration_hours",
      header: "Duration",
      sortable: true,
      value: (row) => row.duration_hours,
      cell: (row) => <span className="text-xs">{row.duration_hours} h</span>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      value: (row) => row.price,
      cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.price)}</span>,
    },
    {
      key: "curriculum",
      header: "Modules",
      value: (row) => row.curriculum?.length ?? 0,
      cell: (row) => <span className="text-xs">{row.curriculum?.length ?? 0}</span>,
    },
    {
      key: "is_published",
      header: "Status",
      sortable: true,
      value: (row) => (row.is_published ? "Published" : "Draft"),
      cell: (row) => <StatusBadge value={row.is_published ? "PUBLISHED" : "DRAFT"} />,
    },
    {
      key: "actions",
      header: "",
      value: (row) => "",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => {
              setEditingCourse(row);
              setIsDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleteConfirmSlug(row.slug)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleFormSubmit = (values: any) => {
    if (editingCourse) {
      updateCourse.mutate(
        { slug: editingCourse.slug, data: values },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingCourse(null);
          },
        }
      );
    } else {
      createCourse.mutate(values, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <CourseFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}
        course={editingCourse ?? undefined}
        onSubmit={handleFormSubmit}
      />
      <PageHeader
        title="Training Courses"
        description="Manage the catalog of ECM, cloud, and AI training courses."
        actions={
          <Button
            onClick={() => {
              setEditingCourse(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        }
      />

      <DataGrid
        rows={query.data}
        columns={columns}
        getRowId={(row) => row._id ?? row.slug}
        isLoading={query.isLoading}
        error={query.error ? { message: describeError(query.error) } : null}
        onRetry={() => void query.refetch()}
        searchPlaceholder="Search courses…"
        exportName="turnpike-courses"
        selectable={false}
        emptyTitle="No courses match these filters"
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        filters={
          <>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value as CourseCategory | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-48" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {COURSE_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {titleCase(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={level}
              onValueChange={(value) => {
                setLevel(value as CourseLevel | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-40" aria-label="Filter by level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All levels</SelectItem>
                {COURSE_LEVELS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {titleCase(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {deleteConfirmSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Course</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmSlug(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
                disabled={deleteCourse.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteCourse.mutate(deleteConfirmSlug, {
                    onSuccess: () => setDeleteConfirmSlug(null)
                  });
                }}
                disabled={deleteCourse.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteCourse.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
