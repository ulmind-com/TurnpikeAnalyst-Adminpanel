import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { Switch } from "@turnpike/shared/components/ui/switch";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import * as api from "@turnpike/shared/api/services/internship.api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import { useAdminTracks } from "@turnpike/shared/hooks/use-internship";
import type {
  CourseLevel,
  InternshipTrack,
  TrackCategory,
} from "@turnpike/shared/types/internship";

export const Route = createFileRoute("/admin/internship-tracks")({
  component: TracksPage,
});

const CATEGORIES: TrackCategory[] = [
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "DATA_ENGINEERING",
  "DEVOPS",
  "AI_ML",
];
const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Multi-line textarea in, trimmed non-empty lines out. */
const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function TracksPage() {
  const tracks = useAdminTracks();
  const [editing, setEditing] = useState<InternshipTrack | "new" | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internship projects"
        description="The briefs interns choose from. Unpublished projects stay hidden from the public site."
        actions={
          <Button onClick={() => setEditing("new")} className="gap-2">
            <Plus className="size-4" />
            New project
          </Button>
        }
      />

      {tracks.isLoading ? (
        <div className="grid h-32 place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : !tracks.data?.length ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No projects yet. Create one for interns to choose.
        </p>
      ) : (
        <ul className="space-y-2">
          {tracks.data.map((track) => (
            <li
              key={track._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{track.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {track.category.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                  {track.is_published ? null : (
                    <Badge variant="secondary" className="text-[10px]">
                      draft
                    </Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  /{track.slug} · {track.build_days} days · {track.level.toLowerCase()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(track)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await api.adminDeleteTrack(track._id);
                      toast.success("Project deleted");
                      void tracks.refetch();
                    } catch (error) {
                      toast.error(describeError(error));
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <TrackEditor
          track={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void tracks.refetch();
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TrackEditor({
  track,
  onClose,
  onSaved,
}: {
  track: InternshipTrack | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: track?.title ?? "",
    slug: track?.slug ?? "",
    category: track?.category ?? ("FRONTEND" as TrackCategory),
    level: track?.level ?? ("BEGINNER" as CourseLevel),
    summary: track?.summary ?? "",
    brief: track?.brief ?? "",
    requirements: (track?.requirements ?? []).join("\n"),
    deliverables: (track?.deliverables ?? []).join("\n"),
    suggested_stack: (track?.suggested_stack ?? []).join("\n"),
    build_days: track?.build_days ?? 30,
    is_published: track?.is_published ?? true,
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        category: form.category,
        level: form.level,
        summary: form.summary.trim(),
        brief: form.brief.trim(),
        requirements: toLines(form.requirements),
        deliverables: toLines(form.deliverables),
        suggested_stack: toLines(form.suggested_stack),
        build_days: Number(form.build_days),
        cover_image_url: track?.cover_image_url ?? null,
        is_published: form.is_published,
      };
      if (track) {
        await api.adminUpdateTrack(track._id, payload);
      } else {
        await api.adminCreateTrack(payload);
      }
      toast.success(track ? "Project updated" : "Project created");
      onSaved();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {track ? "Edit project" : "New project"}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => {
                  set("title", event.target.value);
                  // The slug only auto-fills for a new project, so editing a
                  // published title never silently breaks its URL.
                  if (!track) set("slug", slugify(event.target.value));
                }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => set("slug", event.target.value)}
                className="mt-1.5 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(event) => set("category", event.target.value as TrackCategory)}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Level</Label>
              <select
                value={form.level}
                onChange={(event) => set("level", event.target.value as CourseLevel)}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="days">Build days</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={365}
                value={form.build_days}
                onChange={(event) => set("build_days", Number(event.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">One-line summary</Label>
            <Input
              id="summary"
              value={form.summary}
              maxLength={500}
              onChange={(event) => set("summary", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="brief">Full brief (Markdown)</Label>
            <Textarea
              id="brief"
              rows={10}
              value={form.brief}
              onChange={(event) => set("brief", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["requirements", "Requirements"],
                ["deliverables", "Deliverables"],
                ["suggested_stack", "Suggested stack"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Textarea
                  id={key}
                  rows={6}
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                  placeholder="One per line"
                  className="mt-1.5 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="published"
              checked={form.is_published}
              onCheckedChange={(checked) => set("is_published", checked)}
            />
            <Label htmlFor="published">Published — visible on the public site</Label>
          </div>

          <Button onClick={save} disabled={busy || !form.title.trim()} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {track ? "Save changes" : "Create project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
