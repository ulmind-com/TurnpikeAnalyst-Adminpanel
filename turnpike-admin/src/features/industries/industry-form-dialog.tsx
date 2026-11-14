import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

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
import { useCreateIndustry, useUpdateIndustry } from "@turnpike/shared/hooks/use-api";
import {
  type IndustryCreate,
  type IndustryResponse,
} from "@turnpike/shared/types/api";
import { titleCase } from "@turnpike/shared/utils/format";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const EMPTY: IndustryCreate = {
  title: "",
  slug: "",
  parent_category: "FINANCE & PROFESSIONAL",
  short_description: "",
  full_description: "",
  supported_platforms: [],
  is_featured: false,
  sections: [],
};

export function IndustryFormDialog({ open, onOpenChange, industry }: { open: boolean; onOpenChange: (open: boolean) => void; industry: IndustryResponse | null }) {
  const [data, setData] = useState<IndustryCreate>(EMPTY);

  const create = useCreateIndustry();
  const update = useUpdateIndustry();

  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setData(industry ? { ...industry } : { ...EMPTY });
    }
  }, [open, industry]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (industry?._id) {
      update.mutate(
        { id: industry._id, payload: data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{industry ? "Edit Industry" : "New Industry"}</DialogTitle>
            <DialogDescription>
              Fill in the industry details below. It will appear on the public website.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) =>
                  setData({
                    ...data,
                    title: e.target.value,
                    slug: industry ? data.slug : slugify(e.target.value),
                  })
                }
                placeholder="e.g. Banking"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={data.slug}
                onChange={(e) => setData({ ...data, slug: e.target.value })}
                placeholder="e.g. banking"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parent_category">Category</Label>
              <Select
                value={data.parent_category}
                onValueChange={(value) => setData({ ...data, parent_category: value })}
              >
                <SelectTrigger id="parent_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINANCE & PROFESSIONAL">Finance & Professional</SelectItem>
                  <SelectItem value="HEALTH & LIFE SCIENCES">Health & Life Sciences</SelectItem>
                  <SelectItem value="INDUSTRIAL & RESOURCES">Industrial & Resources</SelectItem>
                  <SelectItem value="CONSUMER & TRANSPORT">Consumer & Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="short_description">Short Description (Sub-title)</Label>
              <Input
                id="short_description"
                value={data.short_description}
                onChange={(e) => setData({ ...data, short_description: e.target.value })}
                placeholder="Brief summary"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_description">Full Description</Label>
              <Textarea
                id="full_description"
                value={data.full_description}
                onChange={(e) => setData({ ...data, full_description: e.target.value })}
                placeholder="Detailed overview..."
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Switch
                id="is_featured"
                checked={data.is_featured}
                onCheckedChange={(c) => setData({ ...data, is_featured: c })}
              />
              <div className="space-y-0.5">
                <Label htmlFor="is_featured">Featured Industry</Label>
                <p className="text-[13px] text-muted-foreground">
                  Highlight this industry prominently on the website.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {industry ? "Save changes" : "Create industry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
