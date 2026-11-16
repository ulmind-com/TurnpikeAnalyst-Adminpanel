import { createFileRoute } from "@tanstack/react-router";
import { Eye, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import * as api from "@turnpike/shared/api/services/internship.api";
import { API_BASE_URL } from "@turnpike/shared/constants/config";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import { useAdminTemplates } from "@turnpike/shared/hooks/use-internship";
import type { CertificateTemplate, TemplateField } from "@turnpike/shared/types/internship";

export const Route = createFileRoute("/admin/certificate-templates")({
  component: CertificateTemplatesPage,
});

/** The values a certificate can carry. Positions are set by dragging. */
const FIELD_KEYS: Array<{ key: TemplateField["key"]; label: string; sample: string }> = [
  { key: "recipient_name", label: "Recipient name", sample: "Ananya Chatterjee" },
  { key: "project_title", label: "Project title", sample: "Shipment Trace API" },
  { key: "duration", label: "Duration", sample: "2 months" },
  { key: "issued_on", label: "Issue date", sample: "11 November 2026" },
  { key: "certificate_number", label: "Certificate number", sample: "TA-2026-PREVIEW01" },
];

const defaultField = (key: TemplateField["key"], y: number): TemplateField => ({
  key,
  x: 600,
  y,
  font_size: key === "recipient_name" ? 72 : 28,
  font_weight: key === "recipient_name" ? "bold" : "regular",
  color: "#0B2B33",
  align: "center",
  max_width: 900,
});

function CertificateTemplatesPage() {
  const templates = useAdminTemplates();
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate templates"
        description="Upload the artwork, then drag each value onto it. Only the recipient's name and the project change per certificate — everything else is the template."
      />

      {templates.isLoading ? (
        <div className="grid h-32 place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.data?.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              onEdit={() => setEditing(template)}
              onChanged={() => templates.refetch()}
            />
          ))}
          <NewTemplateCard onCreated={(created) => {
            void templates.refetch();
            setEditing(created);
          }} />
        </div>
      )}

      {editing ? (
        <TemplateEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void templates.refetch();
            toast.success("Template saved");
          }}
        />
      ) : null}
    </div>
  );
}

function TemplateCard({
  template,
  onEdit,
  onChanged,
}: {
  template: CertificateTemplate;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const activate = async () => {
    setBusy(true);
    try {
      await api.adminUpdateTemplate(template._id, { is_active: true });
      toast.success(`"${template.name}" is now the active template`);
      onChanged();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.adminDeleteTemplate(template._id);
      toast.success("Template deleted");
      onChanged();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <img
        src={`${API_BASE_URL}${template.background_url}`}
        alt=""
        className="aspect-[1.414/1] w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-foreground">{template.name}</p>
          {template.is_active ? <Badge className="shrink-0">Active</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {template.width}×{template.height} · {template.fields.length} fields
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit layout
          </Button>
          {template.is_active ? null : (
            <Button size="sm" variant="ghost" onClick={activate} disabled={busy} className="gap-1.5">
              <Star className="size-3.5" />
              Make active
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewTemplateCard({ onCreated }: { onCreated: (template: CertificateTemplate) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      // The server measures the image and returns its real dimensions, which
      // become the coordinate space the editor drags in.
      const uploaded = await api.adminUploadBackground(file);
      const created = await api.adminCreateTemplate({
        name: file.name.replace(/\.[^.]+$/, ""),
        background_url: uploaded.background_url,
        width: uploaded.width,
        height: uploaded.height,
        fields: FIELD_KEYS.map((item, index) =>
          defaultField(item.key, Math.round(uploaded.height * (0.45 + index * 0.1))),
        ),
        is_active: false,
      });
      toast.success("Background uploaded — now position the fields");
      onCreated(created);
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-60"
    >
      <div>
        {busy ? (
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        ) : (
          <Upload className="mx-auto size-6 text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium text-foreground">Upload certificate artwork</p>
        <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG or WebP · up to 10 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </button>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: CertificateTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [fields, setFields] = useState<TemplateField[]>(template.fields);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const field = fields[selected];

  const patch = (changes: Partial<TemplateField>) =>
    setFields((current) =>
      current.map((item, index) => (index === selected ? { ...item, ...changes } : item)),
    );

  /**
   * Dragging works in template pixels, not screen pixels: the preview is
   * scaled to fit the panel, so the pointer position is converted back
   * through that ratio before it is stored.
   */
  const handleDrag = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    setSelected(index);

    const move = (moveEvent: globalThis.PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ratioX = template.width / rect.width;
      const ratioY = template.height / rect.height;
      setFields((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                x: Math.round(Math.max(0, (moveEvent.clientX - rect.left) * ratioX)),
                y: Math.round(Math.max(0, (moveEvent.clientY - rect.top) * ratioY)),
              }
            : item,
        ),
      );
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.adminUpdateTemplate(template._id, { name, fields });
      onSaved();
      onClose();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    setBusy(true);
    try {
      await api.adminUpdateTemplate(template._id, { name, fields });
      const { preview_url } = await api.adminPreviewTemplate(template._id);
      window.open(`${API_BASE_URL}${preview_url}`, "_blank", "noopener");
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Position fields</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag each label onto the artwork. Sample values are shown so you can judge the fit.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div
            ref={canvasRef}
            className="relative w-full select-none overflow-hidden rounded-xl border border-border"
            style={{ aspectRatio: `${template.width} / ${template.height}` }}
          >
            <img
              src={`${API_BASE_URL}${template.background_url}`}
              alt=""
              className="pointer-events-none absolute inset-0 size-full object-contain"
              draggable={false}
            />
            {fields.map((item, index) => {
              const meta = FIELD_KEYS.find((entry) => entry.key === item.key);
              return (
                <div
                  key={`${item.key}-${index}`}
                  onPointerDown={(event) => handleDrag(event, index)}
                  className={`absolute cursor-move whitespace-nowrap rounded px-1.5 py-0.5 text-center ${
                    selected === index ? "ring-2 ring-primary" : "ring-1 ring-border/60"
                  }`}
                  style={{
                    left: `${(item.x / template.width) * 100}%`,
                    top: `${(item.y / template.height) * 100}%`,
                    transform: {
                      left: "translate(0, 0)",
                      center: "translate(-50%, 0)",
                      right: "translate(-100%, 0)",
                    }[item.align],
                    fontSize: `${(item.font_size / template.height) * 100}cqh`,
                    fontWeight: item.font_weight === "bold" ? 700 : 400,
                    color: item.color,
                    containerType: "size",
                  }}
                >
                  {meta?.sample ?? item.text ?? item.key}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Field</Label>
              <div className="mt-1.5 space-y-1">
                {fields.map((item, index) => (
                  <button
                    key={`${item.key}-${index}`}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selected === index
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {FIELD_KEYS.find((entry) => entry.key === item.key)?.label ?? item.key}
                  </button>
                ))}
              </div>
            </div>

            {field ? (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fx" className="text-xs">X</Label>
                    <Input
                      id="fx"
                      type="number"
                      value={field.x}
                      onChange={(event) => patch({ x: Number(event.target.value) })}
                      className="mt-1 h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fy" className="text-xs">Y</Label>
                    <Input
                      id="fy"
                      type="number"
                      value={field.y}
                      onChange={(event) => patch({ y: Number(event.target.value) })}
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fsize" className="text-xs">Font size</Label>
                  <Input
                    id="fsize"
                    type="number"
                    value={field.font_size}
                    onChange={(event) => patch({ font_size: Number(event.target.value) })}
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="fcolor" className="text-xs">Colour</Label>
                  <Input
                    id="fcolor"
                    type="color"
                    value={field.color}
                    onChange={(event) => patch({ color: event.target.value })}
                    className="mt-1 h-8 p-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Weight</Label>
                    <select
                      value={field.font_weight}
                      onChange={(event) =>
                        patch({ font_weight: event.target.value as TemplateField["font_weight"] })
                      }
                      className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="regular">Regular</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Align</Label>
                    <select
                      value={field.align}
                      onChange={(event) =>
                        patch({ align: event.target.value as TemplateField["align"] })
                      }
                      className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Button onClick={save} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Save layout
              </Button>
              <Button variant="outline" onClick={preview} disabled={busy} className="gap-2">
                <Eye className="size-4" />
                Save and preview PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
