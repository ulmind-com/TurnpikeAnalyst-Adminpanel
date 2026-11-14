import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Save, ImagePlus, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { CardSkeleton, ErrorState } from "@turnpike/shared/components/premium/states";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@turnpike/shared/components/ui/accordion";
import { useHomepage, useUpdateHomepage } from "@turnpike/shared/hooks/use-api";
import { uiFx } from "@turnpike/shared/lib/ui-fx";
import {
  uploadHomepageImage,
  type HomepageContent,
  type SectionHeading,
} from "@turnpike/shared/api/services/homepage.api";

export const Route = createFileRoute("/admin/cms")({
  head: () => ({
    meta: [
      { title: "Homepage CMS — Turnpike Analyst Console" },
      { name: "description", content: "Edit every section of the public homepage." },
    ],
  }),
  component: CmsPage,
});

function CmsPage() {
  const query = useHomepage();
  const save = useUpdateHomepage();
  const [draft, setDraft] = useState<HomepageContent | null>(null);

  useEffect(() => {
    if (query.data && !draft) setDraft(structuredClone(query.data));
  }, [query.data, draft]);

  /** Immutably mutate the draft via a structural clone. */
  const patch = (fn: (d: HomepageContent) => void) =>
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  return (
    <>
      <PageHeader
        title="Homepage CMS"
        description="Edit every heading, card and button on the public homepage. Changes go live on save."
        actions={
          <Button
            data-fx="success"
            onClick={() => draft && save.mutate(draft)}
            disabled={!draft || save.isPending}
            className="gap-2"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </Button>
        }
      />

      {query.isLoading || !draft ? (
        <CardSkeleton />
      ) : query.error ? (
        <ErrorState message="Could not load homepage content." />
      ) : (
        <Accordion type="multiple" defaultValue={["hero"]} className="space-y-3">
          {/* ───────── Hero ───────── */}
          <Section value="hero" title="Hero">
            <Field label="Badge" value={draft.hero.badge} onChange={(v) => patch((d) => (d.hero.badge = v))} />
            <StringList
              label="Headline lines"
              items={draft.hero.title_lines}
              onChange={(items) => patch((d) => (d.hero.title_lines = items))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Highlighted word" value={draft.hero.highlight_word} onChange={(v) => patch((d) => (d.hero.highlight_word = v))} />
              <Field label="Suffix line" value={draft.hero.title_suffix} onChange={(v) => patch((d) => (d.hero.title_suffix = v))} />
            </div>
            <Field label="Subtitle" textarea value={draft.hero.subtitle} onChange={(v) => patch((d) => (d.hero.subtitle = v))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <CtaEditor label="Primary button" value={draft.hero.primary_cta} onChange={(v) => patch((d) => (d.hero.primary_cta = v))} />
              <CtaEditor label="Secondary button" value={draft.hero.secondary_cta} onChange={(v) => patch((d) => (d.hero.secondary_cta = v))} />
            </div>
            <List
              label="Hero tiles (card labels)"
              items={draft.hero.tiles}
              blank={() => ({ tag: "", type: "solid" as const, bg: "#e5e7eb", img: null })}
              onChange={(items) => patch((d) => (d.hero.tiles = items))}
              render={(tile, i) => (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Field label="Label" value={tile.tag} onChange={(v) => patch((d) => (d.hero.tiles[i].tag = v))} />
                  <SelectField
                    label="Type"
                    value={tile.type}
                    options={["solid", "photo"]}
                    onChange={(v) => patch((d) => (d.hero.tiles[i].type = v as "solid" | "photo"))}
                  />
                  {tile.type === "solid" ? (
                    <Field label="Colour" value={tile.bg ?? ""} onChange={(v) => patch((d) => (d.hero.tiles[i].bg = v))} />
                  ) : (
                    <ImageField label="Image" value={tile.img ?? ""} onChange={(v) => patch((d) => (d.hero.tiles[i].img = v))} />
                  )}
                </div>
              )}
            />
          </Section>

          {/* ───────── Hero claims ───────── */}
          <Section value="claims" title="Hero claims (rotating)">
            <List
              label="Claims"
              items={draft.hero_claims}
              blank={() => ({ title: "", body: "" })}
              onChange={(items) => patch((d) => (d.hero_claims = items))}
              render={(c, i) => (
                <>
                  <Field label="Title" value={c.title} onChange={(v) => patch((d) => (d.hero_claims[i].title = v))} />
                  <Field label="Body" textarea value={c.body} onChange={(v) => patch((d) => (d.hero_claims[i].body = v))} />
                </>
              )}
            />
          </Section>

          {/* ───────── Platform stats ───────── */}
          <Section value="stats" title="Platform stat labels">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Services label" value={draft.platform_stats.service_label} onChange={(v) => patch((d) => (d.platform_stats.service_label = v))} />
              <Field label="Products label" value={draft.platform_stats.product_label} onChange={(v) => patch((d) => (d.platform_stats.product_label = v))} />
              <Field label="Products value" type="number" value={String(draft.platform_stats.product_value)} onChange={(v) => patch((d) => (d.platform_stats.product_value = Number(v) || 0))} />
              <Field label="Courses label" value={draft.platform_stats.course_label} onChange={(v) => patch((d) => (d.platform_stats.course_label = v))} />
            </div>
          </Section>

          {/* ───────── Section headings ───────── */}
          <Section value="headings" title="Section headings">
            {(
              [
                ["tech_heading", "Technology stack"],
                ["services_heading", "Services"],
                ["industries_heading", "Industries"],
                ["why_heading", "Why choose us"],
                ["awards_heading", "Awards"],
                ["reviews_heading", "Reviews"],
                ["insights_heading", "Insights / blog"],
              ] as [keyof HomepageContent, string][]
            ).map(([key, label]) => (
              <HeadingEditor
                key={key}
                label={label}
                value={draft[key] as SectionHeading}
                onChange={(v) => patch((d) => ((d[key] as SectionHeading) = v))}
              />
            ))}
            <Field label="Why-choose CTA label" value={draft.why_cta_label} onChange={(v) => patch((d) => (d.why_cta_label = v))} />
          </Section>

          {/* ───────── Tech stack ───────── */}
          <Section value="tech" title="Technology stack groups">
            <List
              label="Groups"
              items={draft.tech_stack}
              blank={() => ({ category: "", items: [] })}
              onChange={(items) => patch((d) => (d.tech_stack = items))}
              render={(g, i) => (
                <>
                  <Field label="Category" value={g.category} onChange={(v) => patch((d) => (d.tech_stack[i].category = v))} />
                  <StringList label="Items" items={g.items} onChange={(items) => patch((d) => (d.tech_stack[i].items = items))} />
                </>
              )}
            />
          </Section>

          {/* ───────── Capabilities ───────── */}
          <Section value="capabilities" title="Capabilities">
            <List
              label="Capabilities"
              items={draft.capabilities}
              blank={() => ({ icon: "", title: "", body: "" })}
              onChange={(items) => patch((d) => (d.capabilities = items))}
              render={(c, i) => (
                <>
                  <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                    <Field label="Icon" value={c.icon} onChange={(v) => patch((d) => (d.capabilities[i].icon = v))} />
                    <Field label="Title" value={c.title} onChange={(v) => patch((d) => (d.capabilities[i].title = v))} />
                  </div>
                  <Field label="Body" textarea value={c.body} onChange={(v) => patch((d) => (d.capabilities[i].body = v))} />
                </>
              )}
            />
          </Section>

          {/* ───────── Flagships ───────── */}
          <Section value="flagships" title="Flagship products">
            <List
              label="Flagships"
              items={draft.flagships}
              blank={() => ({ id: "", eyebrow: "", title: "", body: "", bullets: [], cta: "" })}
              onChange={(items) => patch((d) => (d.flagships = items))}
              render={(f, i) => (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Eyebrow" value={f.eyebrow} onChange={(v) => patch((d) => (d.flagships[i].eyebrow = v))} />
                    <Field label="CTA label" value={f.cta} onChange={(v) => patch((d) => (d.flagships[i].cta = v))} />
                  </div>
                  <Field label="Title" value={f.title} onChange={(v) => patch((d) => (d.flagships[i].title = v))} />
                  <Field label="Body" textarea value={f.body} onChange={(v) => patch((d) => (d.flagships[i].body = v))} />
                  <List
                    label="Bullets"
                    items={f.bullets}
                    blank={() => ({ title: "", body: "" })}
                    onChange={(items) => patch((d) => (d.flagships[i].bullets = items))}
                    render={(b, j) => (
                      <>
                        <Field label="Bullet title" value={b.title} onChange={(v) => patch((d) => (d.flagships[i].bullets[j].title = v))} />
                        <Field label="Bullet body" textarea value={b.body} onChange={(v) => patch((d) => (d.flagships[i].bullets[j].body = v))} />
                      </>
                    )}
                  />
                </>
              )}
            />
          </Section>

          {/* ───────── Why choose ───────── */}
          <Section value="why" title="Why choose us (cards)">
            <List
              label="Cards"
              items={draft.why_choose}
              blank={() => ({ title: "", body: "" })}
              onChange={(items) => patch((d) => (d.why_choose = items))}
              render={(c, i) => (
                <>
                  <Field label="Title" value={c.title} onChange={(v) => patch((d) => (d.why_choose[i].title = v))} />
                  <Field label="Body" textarea value={c.body} onChange={(v) => patch((d) => (d.why_choose[i].body = v))} />
                </>
              )}
            />
          </Section>

          {/* ───────── Counters ───────── */}
          <Section value="counters" title="Stat counters">
            <List
              label="Counters"
              items={draft.counters}
              blank={() => ({ label: "", value: 0, suffix: "" })}
              onChange={(items) => patch((d) => (d.counters = items))}
              render={(c, i) => (
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px]">
                  <Field label="Label" value={c.label} onChange={(v) => patch((d) => (d.counters[i].label = v))} />
                  <Field label="Value" type="number" value={String(c.value)} onChange={(v) => patch((d) => (d.counters[i].value = Number(v) || 0))} />
                  <Field label="Suffix" value={c.suffix} onChange={(v) => patch((d) => (d.counters[i].suffix = v))} />
                </div>
              )}
            />
          </Section>
        </Accordion>
      )}
    </>
  );
}

/* ───────────────────────── Primitives ───────────────────────── */

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="rounded-2xl border border-border/70 bg-card px-4 shadow-sm">
      <AccordionTrigger className="text-sm font-semibold">{title}</AccordionTrigger>
      <AccordionContent className="space-y-4 pb-5 pt-1">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CtaEditor({ label, value, onChange }: { label: string; value: { label: string; href: string }; onChange: (v: { label: string; href: string }) => void }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <div className="grid gap-2">
        <Field label="Text" value={value.label} onChange={(v) => onChange({ ...value, label: v })} />
        <Field label="Link" value={value.href} onChange={(v) => onChange({ ...value, href: v })} />
      </div>
    </div>
  );
}

function HeadingEditor({ label, value, onChange }: { label: string; value: SectionHeading; onChange: (v: SectionHeading) => void }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Eyebrow" value={value.eyebrow} onChange={(v) => onChange({ ...value, eyebrow: v })} />
        <Field label="Title" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      </div>
      <div className="mt-2">
        <Field label="Description" textarea value={value.description} onChange={(v) => onChange({ ...value, description: v })} />
      </div>
    </div>
  );
}

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="space-y-1.5">
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={s}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="text-sm"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...items, ""])}>
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}

function List<T>({
  label,
  items,
  blank,
  onChange,
  render,
}: {
  label: string;
  items: T[];
  blank: () => T;
  onChange: (items: T[]) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    uiFx.play("open");
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              setOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`relative space-y-2 rounded-xl border bg-muted/20 p-3 pl-9 pr-10 transition-shadow ${
              overIndex === i && dragIndex !== i ? "border-primary ring-2 ring-primary/30" : "border-border/60"
            } ${dragIndex === i ? "opacity-50" : ""}`}
          >
            <span
              draggable
              onDragStart={() => {
                setDragIndex(i);
                uiFx.play("tick");
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className="absolute left-1.5 top-3 cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing"
              title="Drag to reorder"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-fx="remove"
              className="absolute right-2 top-2"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
            {render(item, i)}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...items, blank()])}>
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const { url } = await uploadHomepageImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className="text-sm" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="icon" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </Button>
      </div>
      {value ? <img src={value} alt="" className="h-16 w-16 rounded-lg border border-border/60 object-cover" /> : null}
    </div>
  );
}
