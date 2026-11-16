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
import { useCreateService, useUpdateService } from "@turnpike/shared/hooks/use-api";
import {
  PARENT_CATEGORIES,
  SUB_SERVICE_TYPES,
  type ParentCategory,
  type ServiceCreate,
  type ServiceResponse,
  type SubServiceType,
} from "@turnpike/shared/types/api";
import { titleCase } from "@turnpike/shared/utils/format";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const EMPTY: ServiceCreate = {
  title: "",
  slug: "",
  parent_category: "CONSULTING",
  sub_service_type: "MANAGED_SERVICES",
  short_description: "",
  full_description: "",
  supported_platforms: [],
  is_featured: false,
};

export function ServiceFormDialog({
  open,
  service,
  defaultCategory,
  onOpenChange,
}: {
  open: boolean;
  service: ServiceResponse | null;
  defaultCategory?: ParentCategory;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<ServiceCreate>(EMPTY);
  const [platforms, setPlatforms] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateService();
  const update = useUpdateService();
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    if (service) {
      const { _id, created_at, ...rest } = service;
      void _id;
      void created_at;
      setForm(rest);
      setPlatforms((service.supported_platforms ?? []).join(", "));
    } else {
      setForm({ ...EMPTY, parent_category: defaultCategory || EMPTY.parent_category });
      setPlatforms("");
    }
    setErrors({});
  }, [open, service, defaultCategory]);

  const set = <K extends keyof ServiceCreate>(key: K, value: ServiceCreate[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = "Title must be at least 3 characters";
    if (!slugify(form.slug || form.title)) next.slug = "A valid slug is required";
    if (form.short_description.trim().length < 10)
      next.short_description = "Summary must be at least 10 characters";
    if (form.full_description.trim().length < 20)
      next.full_description = "Description must be at least 20 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: ServiceCreate = {
      ...form,
      slug: slugify(form.slug || form.title),
      supported_platforms: platforms
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    try {
      if (service?._id) {
        await update.mutateAsync({ id: service._id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      /* toast handled in the mutation hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "New service"}</DialogTitle>
          <DialogDescription>
            Changes are written directly to the live Turnpike Analyst catalog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => {
                  set("title", event.target.value);
                  if (!service) set("slug", slugify(event.target.value));
                }}
                maxLength={140}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => set("slug", slugify(event.target.value))}
                maxLength={140}
              />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Parent category</Label>
              <Select
                value={form.parent_category}
                onValueChange={(value) => set("parent_category", value as ParentCategory)}
              >
                <SelectTrigger aria-label="Parent category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARENT_CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {titleCase(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub-service type</Label>
              <Select
                value={form.sub_service_type}
                onValueChange={(value) => set("sub_service_type", value as SubServiceType)}
              >
                <SelectTrigger aria-label="Sub-service type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_SERVICE_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {titleCase(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="short">Short description</Label>
            <Textarea
              id="short"
              rows={2}
              maxLength={280}
              value={form.short_description}
              onChange={(event) => set("short_description", event.target.value)}
            />
            {errors.short_description && (
              <p className="text-xs text-destructive">{errors.short_description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full">Full description</Label>
            <Textarea
              id="full"
              rows={6}
              maxLength={4000}
              value={form.full_description}
              onChange={(event) => set("full_description", event.target.value)}
            />
            {errors.full_description && (
              <p className="text-xs text-destructive">{errors.full_description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="platforms">Supported platforms</Label>
            <Input
              id="platforms"
              placeholder="Kofax, Hyland, IBM FileNet"
              value={platforms}
              onChange={(event) => setPlatforms(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma separated.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Featured service</p>
              <p className="text-xs text-muted-foreground">Highlighted on the marketing site.</p>
            </div>
            <Switch
              checked={!!form.is_featured}
              onCheckedChange={(checked) => set("is_featured", checked)}
              aria-label="Featured service"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {service ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
