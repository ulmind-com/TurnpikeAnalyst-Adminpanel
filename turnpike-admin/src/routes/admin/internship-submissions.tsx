import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Download,
  ExternalLink,
  FileArchive,
  Globe,
  Loader2,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { downloadSourceArchive } from "@turnpike/shared/api/services/internship.api";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { Button } from "@turnpike/shared/components/ui/button";
import { Checkbox } from "@turnpike/shared/components/ui/checkbox";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import { MermaidDiagram } from "@turnpike/shared/components/premium/mermaid-diagram";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import {
  useAdminDecide,
  useAdminDeleteSourceArchive,
  useAdminSubmission,
  useAdminSubmissions,
} from "@turnpike/shared/hooks/use-internship";
import type {
  EnrollmentAdmin,
  InternshipStatus,
  SourceArchive,
} from "@turnpike/shared/types/internship";

export const Route = createFileRoute("/admin/internship-submissions")({
  component: SubmissionsPage,
});

/** Queues an admin actually works through, in the order they matter. */
const FILTERS: Array<{ label: string; value?: InternshipStatus }> = [
  { label: "Needs a decision", value: "UNDER_REVIEW" },
  { label: "Review failed", value: "REVIEW_FAILED" },
  { label: "Answering questions", value: "QUESTIONS_PENDING" },
  { label: "Building", value: "ENROLLED" },
  { label: "Approved", value: "APPROVED" },
  { label: "All", value: undefined },
];

function SubmissionsPage() {
  const [filter, setFilter] = useState<InternshipStatus | undefined>("UNDER_REVIEW");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const submissions = useAdminSubmissions(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internship submissions"
        description="Every attempt, its automated report and the intern's own answers. Approving here is what issues the certificate."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              setFilter(option.value);
              setSelectedId(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {submissions.isLoading ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : !submissions.data?.length ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Nothing in this queue.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <ul className="space-y-2">
            {submissions.data.map((item) => (
              <li key={item._id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedId === item._id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <p className="font-medium text-foreground">{item.project_title}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-foreground/80">
                    {item.user_name || "Unknown intern"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.user_email || (item.submission
                      ? item.submission.repo_url.replace("https://github.com/", "")
                      : "Not submitted yet")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {item.status.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    {item.ai_review ? (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        score {item.ai_review.score}
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div>
            {selectedId ? (
              <SubmissionDetail id={selectedId} />
            ) : (
              <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
                Select a submission to read its report.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionDetail({ id }: { id: string }) {
  const submission = useAdminSubmission(id);
  const decide = useAdminDecide();
  const [notes, setNotes] = useState("");
  const [demoVerified, setDemoVerified] = useState(false);

  if (submission.isLoading) {
    return (
      <div className="grid h-40 place-items-center rounded-2xl border border-border bg-card">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission.data) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Submission not found.
      </p>
    );
  }

  const data: EnrollmentAdmin = submission.data;
  const decidable = ["UNDER_REVIEW", "QUESTIONS_PENDING", "REVIEW_FAILED"].includes(data.status);

  const handleDecision = async (approved: boolean) => {
    try {
      await decide.mutateAsync({
        id,
        approved,
        notes: notes.trim() || undefined,
        demoVerified,
      });
      toast.success(
        approved ? "Approved — the certificate has been issued." : "Marked as not approved.",
      );
      setNotes("");
      setDemoVerified(false);
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {data.project_title}
          </h2>
          <Badge variant="outline" className="text-[10px]">
            {data.duration_months} month{data.duration_months === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {data.mode === "OWN" ? "own project" : "our brief"}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm">
          <span className="font-semibold text-foreground">
            {data.user_name || "Unknown intern"}
          </span>
          {data.user_email ? (
            <a
              href={`mailto:${data.user_email}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              {data.user_email}
            </a>
          ) : null}
        </div>
        {data.project_summary ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {data.project_summary}
          </p>
        ) : null}
        {data.submission ? (
          <>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-muted-foreground">
                {data.submission.repositories && data.submission.repositories.length > 1
                  ? "Repositories"
                  : "Repository"}
              </dt>
              <dd className="space-y-1.5">
                {(data.submission.repositories?.length
                  ? data.submission.repositories
                  : [{ url: data.submission.repo_url, role: "monorepo", label: null }]
                ).map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {r.role || "repo"}
                    </Badge>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      {r.url.replace("https://github.com/", "")}
                      <ExternalLink className="size-3.5" />
                    </a>
                    {r.label ? (
                      <span className="text-xs text-muted-foreground">({r.label})</span>
                    ) : null}
                  </div>
                ))}
              </dd>
            </div>
            {data.submission.live_url ? (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted-foreground">Deployed</dt>
                <dd>
                  <a
                    href={data.submission.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Globe className="size-3.5" />
                    {data.submission.live_url}
                    <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            ) : null}
            {data.submission.notes ? (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted-foreground">Their notes</dt>
                <dd className="whitespace-pre-wrap text-foreground">{data.submission.notes}</dd>
              </div>
            ) : null}
          </dl>

          {data.submission.demo_video_url ? (
            <a
              href={data.submission.demo_video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PlayCircle className="size-4" />
              Watch the demo recording
            </a>
          ) : (
            <p className="mt-5 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
              No demo recording was submitted.
            </p>
          )}

          <SourceArchiveRow
            enrollmentId={data._id}
            archive={data.source_archive ?? null}
          />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nothing submitted yet.</p>
        )}
      </section>

      {data.submission?.purpose ? <DossierPanel submission={data.submission} /> : null}

      {data.review_error ? (
        <section className="rounded-2xl border border-warning/40 bg-warning/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <div>
              <h3 className="font-semibold text-foreground">The automated review did not run</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{data.review_error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Read the repository yourself before deciding. The intern's submission is intact.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {data.ai_review ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold text-foreground">
              Automated report
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data.ai_review.verdict}</Badge>
              <span className="font-mono text-sm font-semibold text-foreground">
                {data.ai_review.score}/100
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated by {data.ai_review.model}. This informs your decision; it does not make it.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-foreground">{data.ai_review.summary}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strengths
              </h4>
              <ul className="mt-2 space-y-1.5">
                {data.ai_review.strengths.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Concerns
              </h4>
              <ul className="mt-2 space-y-1.5">
                {data.ai_review.concerns.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {data.ai_review.claim_checks?.length ? (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Claim check — does the repository back up what they wrote?
              </h4>
              <ul className="mt-2 space-y-2">
                {[...data.ai_review.claim_checks]
                  .sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict])
                  .map((check, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-xl border border-border p-3 text-sm"
                    >
                      <VerdictIcon verdict={check.verdict} />
                      <div>
                        <p className="font-medium text-foreground">{check.claim}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{check.evidence}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {data.ai_review.findings.length ? (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Findings
              </h4>
              <ul className="mt-2 space-y-2">
                {data.ai_review.findings.map((finding, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <Badge
                      variant={finding.severity === "major" ? "destructive" : "outline"}
                      className="h-5 shrink-0 text-[10px]"
                    >
                      {finding.area}
                    </Badge>
                    <span className="text-muted-foreground">{finding.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Repository facts the review was based on
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(
                data.ai_review.repos_facts?.length
                  ? data.ai_review.repos_facts
                  : data.ai_review.repo_facts,
                null,
                2
              )}
            </pre>
          </details>

          {data.ai_review.live_site_facts ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                Live deployment site inspected
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-[11px] text-muted-foreground">
                {JSON.stringify(data.ai_review.live_site_facts, null, 2)}
              </pre>
            </details>
          ) : null}

          {data.ai_review.archive_facts ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                Uploaded source archive the review compared against
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-[11px] text-muted-foreground">
                {JSON.stringify(data.ai_review.archive_facts, null, 2)}
              </pre>
            </details>
          ) : null}
        </section>
      ) : null}

      {data.questions.length ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold text-foreground">
              Follow-up questions and answers
            </h3>
            {data.answer_analysis ? (
              <Badge
                variant={
                  data.answer_analysis.ai_generated_likelihood === "high"
                    ? "destructive"
                    : "outline"
                }
                className="gap-1.5"
              >
                {data.answer_analysis.ai_generated_likelihood === "low" ? (
                  <ShieldCheck className="size-3.5 text-success" />
                ) : (
                  <ShieldAlert className="size-3.5 text-warning" />
                )}
                Authenticity {data.answer_analysis.overall_authenticity_score}/100 (AI Risk:{" "}
                {data.answer_analysis.ai_generated_likelihood})
              </Badge>
            ) : null}
          </div>

          {data.answer_analysis ? (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs ${
                data.answer_analysis.ai_generated_likelihood === "high"
                  ? "border-destructive/40 bg-destructive/5"
                  : data.answer_analysis.ai_generated_likelihood === "medium"
                    ? "border-warning/40 bg-warning/5"
                    : "border-border bg-muted/30"
              }`}
            >
              <p className="font-semibold text-foreground">
                AI Answer Detection Summary ({data.answer_analysis.model})
              </p>
              <p className="mt-1 text-muted-foreground">{data.answer_analysis.summary}</p>
              {data.answer_analysis.flags.length ? (
                <ul className="mt-2 space-y-1 text-destructive">
                  {data.answer_analysis.flags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3 shrink-0" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <ol className="mt-4 space-y-5">
            {data.questions.map((question, index) => {
              const perQ = data.answer_analysis?.per_question?.find(
                (item) => item.question_id === question.id
              );
              const tel = question.telemetry;
              return (
                <li key={question.id} className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {question.question}
                  </p>
                  {question.expects ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      Looking for: {question.expects}
                    </p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm text-foreground">
                    {question.answer || "— not answered —"}
                  </p>
                  {(tel || perQ) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {tel ? (
                        <>
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Time: {tel.time_spent_seconds.toFixed(0)}s
                          </span>
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Keystrokes: {tel.keystrokes}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 ${
                              tel.paste_attempts > 0
                                ? "bg-destructive/15 text-destructive font-semibold"
                                : "bg-muted"
                            }`}
                          >
                            Paste attempts: {tel.paste_attempts}
                          </span>
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Tab switches: {tel.blur_count}
                          </span>
                        </>
                      ) : null}
                      {perQ ? (
                        <span
                          className={`ml-auto rounded-md px-2 py-0.5 font-medium ${
                            perQ.ai_likelihood === "high"
                              ? "bg-destructive/15 text-destructive"
                              : perQ.ai_likelihood === "medium"
                                ? "bg-warning/15 text-warning"
                                : "bg-success/15 text-success"
                          }`}
                        >
                          AI likelihood: {perQ.ai_likelihood} — {perQ.reason}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {data.decision ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-base font-semibold text-foreground">Decision</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.decision.approved ? "Approved" : "Not approved"} on{" "}
            {new Date(data.decision.decided_at).toLocaleString()}.
          </p>
          {data.decision.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {data.decision.notes}
            </p>
          ) : null}
        </section>
      ) : null}

      {decidable ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-base font-semibold text-foreground">Your decision</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Approving issues the certificate immediately. Notes are shown to the intern.
          </p>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Feedback for the intern — what was strong, what to work on."
            className="mt-4"
          />
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox
              checked={demoVerified}
              onCheckedChange={(checked) => setDemoVerified(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              I watched the demo recording and the project runs.
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Nothing automated can confirm this, so the certificate rests on your word
                here. Approval is blocked until it is ticked.
              </span>
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => handleDecision(true)}
              disabled={decide.isPending || !demoVerified}
              className="gap-2"
            >
              {decide.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Approve and issue certificate
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDecision(false)}
              disabled={decide.isPending}
              className="gap-2"
            >
              <XCircle className="size-4" />
              Not approved
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}


/** Unsupported claims first: they are the ones that need a human decision. */
const VERDICT_ORDER: Record<string, number> = {
  unsupported: 0,
  partial: 1,
  supported: 2,
};

function VerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === "supported") {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="supported" />;
  }
  if (verdict === "partial") {
    return <CircleSlash className="mt-0.5 size-4 shrink-0 text-warning" aria-label="partial" />;
  }
  return <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="unsupported" />;
}

/** The intern's own write-up, shown so the claim check can be judged against it. */
function DossierPanel({ submission }: { submission: NonNullable<EnrollmentAdmin["submission"]> }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-base font-semibold text-foreground">
        The intern&apos;s write-up
      </h3>

      <div className="mt-4 space-y-5 text-sm">
        <Block label="Purpose">{submission.purpose}</Block>

        {submission.technologies.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Technologies claimed
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {submission.technologies.map((item) => (
                <Badge key={item} variant="outline" className="text-[10px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <Block label="Architecture">{submission.architecture_text}</Block>
        <DiagramBlock label="Architecture diagram" diagram={submission.architecture_diagram} />
        <Block label="Data flow">{submission.data_flow_text}</Block>
        <DiagramBlock label="Data flow diagram" diagram={submission.data_flow_diagram} />

        {submission.use_cases.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Use cases
            </p>
            <ul className="mt-2 space-y-1 text-foreground">
              {submission.use_cases.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Block label="Benefit">{submission.benefits}</Block>
      </div>
    </section>
  );
}

function SourceArchiveRow({
  enrollmentId,
  archive,
}: {
  enrollmentId: string;
  archive: SourceArchive | null;
}) {
  const [busy, setBusy] = useState(false);
  const deleteArchive = useAdminDeleteSourceArchive();

  if (!archive) {
    return (
      <p className="mt-5 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
        No source archive was uploaded.
      </p>
    );
  }

  const download = async () => {
    setBusy(true);
    try {
      const blob = await downloadSourceArchive(enrollmentId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = archive.filename || "source.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Permanently delete "${archive.filename}" (${(archive.size_bytes / (1024 * 1024)).toFixed(1)} MB) from Cloudinary/storage and database to free up server space?`
    );
    if (!confirmed) return;
    try {
      await deleteArchive.mutateAsync(enrollmentId);
      toast.success("Source archive deleted from Cloudinary & database.");
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <FileArchive className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm text-foreground">{archive.filename}</span>
      <span className="text-xs text-muted-foreground">
        {(archive.size_bytes / (1024 * 1024)).toFixed(1)} MB
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void download()}
          disabled={busy || deleteArchive.isPending}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download .zip
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void handleDelete()}
          disabled={busy || deleteArchive.isPending}
          title="Delete archive from Cloudinary & Database"
        >
          {deleteArchive.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Delete .zip
        </Button>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children?: string | null }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

function DiagramBlock({
  label,
  diagram,
}: {
  label: string;
  diagram?: EnrollmentAdmin["submission"] extends infer S
    ? S extends { architecture_diagram?: infer D }
      ? D
      : never
    : never;
}) {
  if (!diagram) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {diagram.kind === "mermaid" && diagram.mermaid ? (
        <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
          <MermaidDiagram source={diagram.mermaid} />
        </div>
      ) : (
        <p className="mt-2 text-muted-foreground">
          Supplied as an uploaded image — the automated review could not read it.
        </p>
      )}
    </div>
  );
}
