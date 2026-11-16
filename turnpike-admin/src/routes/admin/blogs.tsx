import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { DataGrid, type DataGridColumn } from "@turnpike/shared/components/premium/data-grid";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { StatusBadge } from "@turnpike/shared/components/premium/status-badge";
import { MagneticButton } from "@turnpike/shared/components/premium/magnetic-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { BlogFormDialog } from "@/features/blogs/blog-form-dialog";
import { DEFAULT_PAGE_SIZE } from "@turnpike/shared/constants/config";
import { useBlogs } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import { BLOG_CATEGORIES, type BlogCategory, type BlogResponse } from "@turnpike/shared/types/api";
import { formatDateTime, titleCase } from "@turnpike/shared/utils/format";

export const Route = createFileRoute("/admin/blogs")({
  head: () => ({
    meta: [
      { title: "Blogs — Turnpike Analyst Console" },
      { name: "description", content: "Author and publish articles to the Turnpike Analyst blog." },
      { property: "og:title", content: "Blogs — Turnpike Analyst Console" },
      { property: "og:description", content: "Author and publish articles to the blog." },
    ],
  }),
  component: BlogsPage,
});

function BlogsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [category, setCategory] = useState<BlogCategory | "ALL">("ALL");
  const [composing, setComposing] = useState(false);

  const query = useBlogs({
    skip: 0,
    limit: 10000,
    ...(category === "ALL" ? {} : { category }),
  });

  const columns: DataGridColumn<BlogResponse>[] = [
    {
      key: "title",
      header: "Article",
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
      key: "summary",
      header: "Summary",
      value: (row) => row.summary,
      className: "max-w-[320px]",
      cell: (row) => <span className="line-clamp-2 text-xs text-muted-foreground">{row.summary}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      value: (row) => row.category,
      cell: (row) => <span className="text-xs">{titleCase(row.category)}</span>,
    },
    {
      key: "author",
      header: "Author",
      sortable: true,
      value: (row) => row.author,
      cell: (row) => <span className="text-xs">{row.author}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      value: (row) => (row.tags ?? []).join(", "),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "is_published",
      header: "Status",
      sortable: true,
      value: (row) => (row.is_published ? "Published" : "Draft"),
      cell: (row) => <StatusBadge value={row.is_published ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "published_at",
      header: "Published",
      sortable: true,
      value: (row) => row.published_at,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.published_at)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Editorial pipeline for the Turnpike Analyst knowledge hub."
        actions={
          <MagneticButton onClick={() => setComposing(true)}>
            <Plus className="size-4" /> New article
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
        searchPlaceholder="Search articles…"
        exportName="turnpike-blogs"
        selectable={false}
        emptyTitle="No articles yet"
        emptyDescription="Publish your first article to populate the knowledge hub."
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
              setCategory(value as BlogCategory | "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-48" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {BLOG_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <BlogFormDialog open={composing} onOpenChange={setComposing} />
    </>
  );
}
