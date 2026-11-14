import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import * as api from "@turnpike/shared/api/services/chatbot.api";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { Switch } from "@turnpike/shared/components/ui/switch";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import type { KnowledgeEntry } from "@turnpike/shared/types/chatbot";

export const Route = createFileRoute("/admin/chatbot")({
  component: ChatbotPage,
});

const TABS = ["Knowledge", "Unanswered", "Behaviour"] as const;

function ChatbotPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Knowledge");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support assistant"
        description="The assistant answers only from the entries below. Adding one changes what it says — no deploy, no prompt engineering."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === name
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "Knowledge" ? <KnowledgeTab /> : null}
      {tab === "Unanswered" ? <UnansweredTab /> : null}
      {tab === "Behaviour" ? <BehaviourTab /> : null}
    </div>
  );
}

function KnowledgeTab() {
  const queryClient = useQueryClient();
  const entries = useQuery({ queryKey: ["chatbot", "knowledge"], queryFn: api.adminListKnowledge });
  const [editing, setEditing] = useState<KnowledgeEntry | "new" | null>(null);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["chatbot", "knowledge"] });

  if (entries.isLoading) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  const byTopic = (entries.data ?? []).reduce<Record<string, KnowledgeEntry[]>>((acc, entry) => {
    (acc[entry.topic] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Button onClick={() => setEditing("new")} className="gap-2">
        <Plus className="size-4" />
        New entry
      </Button>

      {Object.entries(byTopic).map(([topic, items]) => (
        <section key={topic}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {topic} · {items.length}
          </h3>
          <ul className="mt-2 space-y-2">
            {items.map((entry) => (
              <li
                key={entry._id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{entry.question}</p>
                    {entry.is_published ? null : (
                      <Badge variant="secondary" className="text-[10px]">
                        unpublished
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.answer}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(entry)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await api.adminDeleteKnowledge(entry._id);
                        toast.success("Entry deleted");
                        invalidate();
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
        </section>
      ))}

      {editing ? (
        <EntryEditor
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EntryEditor({
  entry,
  onClose,
  onSaved,
}: {
  entry: KnowledgeEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [topic, setTopic] = useState(entry?.topic ?? "general");
  const [keywords, setKeywords] = useState((entry?.keywords ?? []).join(", "));
  const [published, setPublished] = useState(entry?.is_published ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        topic: topic.trim() || "general",
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        is_published: published,
      };
      if (entry) await api.adminUpdateKnowledge(entry._id, payload);
      else await api.adminCreateKnowledge(payload);
      toast.success(entry ? "Entry updated" : "Entry created");
      onSaved();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {entry ? "Edit entry" : "New entry"}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div>
          <Label htmlFor="q">Question</Label>
          <Input
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Does the internship cost anything?"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="a">Answer</Label>
          <Textarea
            id="a"
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            The assistant is told not to add anything this answer does not contain, so write
            it the way you would want it said.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="t">Topic</Label>
            <Input
              id="t"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="k">Other phrasings</Label>
            <Input
              id="k"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="fee, price, free"
              className="mt-1.5"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Comma separated. These widen what matches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="pub" checked={published} onCheckedChange={setPublished} />
          <Label htmlFor="pub">Published — the assistant may use this</Label>
        </div>

        <Button onClick={save} disabled={busy || !question.trim() || !answer.trim()} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {entry ? "Save changes" : "Create entry"}
        </Button>
      </div>
    </div>
  );
}

function UnansweredTab() {
  const conversations = useQuery({
    queryKey: ["chatbot", "conversations", "unanswered"],
    queryFn: () => api.adminListConversations(true),
  });

  if (conversations.isLoading) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversations.data?.length) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Nothing unanswered. Every question so far matched something in the knowledge base.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Questions the assistant could not ground. Each one is a candidate for a new entry.
      </p>
      {conversations.data.map((conversation) => (
        <div key={conversation._id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {new Date(conversation.last_message_at).toLocaleString()} ·{" "}
            {conversation.message_count} message
            {conversation.message_count === 1 ? "" : "s"}
          </div>
          <ul className="mt-3 space-y-2">
            {conversation.turns.map((turn, index) => (
              <li
                key={index}
                className={
                  turn.role === "user"
                    ? "text-sm font-medium text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {turn.role}:{" "}
                </span>
                {turn.content}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function BehaviourTab() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["chatbot", "admin-settings"],
    queryFn: api.adminGetChatbotSettings,
  });

  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const save = useMutation({
    mutationFn: () => api.adminUpdateChatbotSettings(draft),
    onSuccess: () => {
      toast.success("Saved");
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ["chatbot"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  if (settings.isLoading || !settings.data) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  const value = (key: keyof typeof settings.data) =>
    (draft[key] as string | undefined) ?? (settings.data![key] as string);

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Switch
          id="enabled"
          checked={(draft.enabled as boolean | undefined) ?? settings.data.enabled}
          onCheckedChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
        />
        <Label htmlFor="enabled">Assistant is live on the public site</Label>
      </div>

      <div>
        <Label htmlFor="greeting">Greeting</Label>
        <Textarea
          id="greeting"
          rows={2}
          value={value("greeting")}
          onChange={(e) => setDraft((d) => ({ ...d, greeting: e.target.value }))}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="persona">Persona</Label>
        <Textarea
          id="persona"
          rows={4}
          value={value("persona")}
          onChange={(e) => setDraft((d) => ({ ...d, persona: e.target.value }))}
          className="mt-1.5"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Prepended to the system prompt. For voice and hard rules — the grounding rules are
          applied separately and cannot be overridden from here.
        </p>
      </div>

      <div>
        <Label htmlFor="fallback">When it cannot answer</Label>
        <Textarea
          id="fallback"
          rows={2}
          value={value("fallback_message")}
          onChange={(e) => setDraft((d) => ({ ...d, fallback_message: e.target.value }))}
          className="mt-1.5"
        />
      </div>

      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending || Object.keys(draft).length === 0}
        className="gap-2"
      >
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save
      </Button>
    </div>
  );
}
