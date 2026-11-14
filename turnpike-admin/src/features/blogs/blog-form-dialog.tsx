import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@turnpike/shared/components/ui/dialog";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { Switch } from "@turnpike/shared/components/ui/switch";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { useCreateBlog } from "@turnpike/shared/hooks/use-api";
import { useSession } from "@turnpike/shared/hooks/use-auth";
import { BLOG_CATEGORIES, type BlogCategory, type BlogCreate } from "@turnpike/shared/types/api";
import { titleCase } from "@turnpike/shared/utils/format";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function BlogFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useSession();
  const create = useCreateBlog();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<BlogCategory>("UNCATEGORIZED");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setTags("");
    setPublished(true);
    setErrors({});
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = "Title must be at least 4 characters";
    if (summary.trim().length < 20) next.summary = "Summary must be at least 20 characters";
    if (content.trim().length < 50) next.content = "Content must be at least 50 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: BlogCreate = {
      title: title.trim(),
      slug: slugify(slug || title),
      category,
      author: user?.full_name ?? "Turnpike Editorial",
      content_html: content,
      summary: summary.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      is_published: published,
    };

    try {
      await create.mutateAsync(payload);
      reset();
      onOpenChange(false);
    } catch {
      /* surfaced by the mutation hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New article</DialogTitle>
          <DialogDescription>
            Published straight to the live Turnpike Analyst knowledge hub.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={title}
                maxLength={160}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSlug(slugify(event.target.value));
                }}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-slug">Slug</Label>
              <Input
                id="blog-slug"
                value={slug}
                maxLength={160}
                onChange={(event) => setSlug(slugify(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as BlogCategory)}>
              <SelectTrigger aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {titleCase(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blog-summary">Summary</Label>
            <Textarea
              id="blog-summary"
              rows={2}
              maxLength={320}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
            {errors.summary && <p className="text-xs text-destructive">{errors.summary}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blog-content">Content (HTML)</Label>
            <Textarea
              id="blog-content"
              rows={10}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="font-mono text-xs"
              placeholder="<p>Your article…</p>"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blog-tags">Tags</Label>
            <Input
              id="blog-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="ecm, automation, ai"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Publish immediately</p>
              <p className="text-xs text-muted-foreground">Otherwise saved as a draft.</p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} aria-label="Publish immediately" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />} Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
