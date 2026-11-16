import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, Loader2, ShieldX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { ErrorState } from "@turnpike/shared/components/premium/states";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import { getCertificateDownloadUrl } from "@turnpike/shared/constants/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@turnpike/shared/components/ui/dialog";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import {
  useAdminCertificates,
  useAdminRevokeCertificate,
} from "@turnpike/shared/hooks/use-internship";

export const Route = createFileRoute("/admin/certificates")({
  head: () => ({
    meta: [
      { title: "Issued Certificates — Turnpike Analyst Console" },
      { name: "description", content: "View and manage issued internship certificates." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const query = useAdminCertificates();
  const revoke = useAdminRevokeCertificate();
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");

  const filtered = (query.data ?? []).filter((c: Record<string, unknown>) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = String(c.recipient_name ?? "").toLowerCase();
    const num = String(c.certificate_number ?? "").toLowerCase();
    return name.includes(q) || num.includes(q);
  });

  const handleRevoke = async () => {
    if (!revokeTarget || !reason.trim()) return;
    try {
      await revoke.mutateAsync({ id: revokeTarget.id, reason: reason.trim() });
      toast.success("Certificate revoked");
      setRevokeTarget(null);
      setReason("");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issued Certificates"
        description="All internship certificates issued by the platform. Revoke a certificate if the intern violated the code of conduct."
      />

      {query.isLoading ? (
        <div className="grid h-32 place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} retry={query.refetch} />
      ) : (
        <>
          <Input
            placeholder="Search by name or certificate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {search ? "No certificates match your search." : "No certificates issued yet."}
            </p>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certificate #</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issued</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cert: Record<string, unknown>) => {
                    const id = String(cert._id ?? "");
                    const revoked = Boolean(cert.revoked);
                    return (
                      <tr key={id} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-medium">{String(cert.recipient_name ?? "—")}</td>
                        <td className="px-4 py-3 font-mono text-xs">{String(cert.certificate_number ?? "—")}</td>
                        <td className="px-4 py-3 text-muted-foreground">{String(cert.project_title ?? "—")}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {cert.issued_on ? new Date(String(cert.issued_on)).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {revoked ? (
                            <Badge variant="destructive">Revoked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40">Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cert.pdf_url && !revoked ? (
                              <a
                                href={getCertificateDownloadUrl(String(cert.pdf_url), String(cert.certificate_number))}
                                download={`Turnpike-Certificate-${cert.certificate_number}.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                              >
                                <Download className="size-3.5" /> PDF
                              </a>
                            ) : null}
                            {!revoked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRevokeTarget({ id, name: String(cert.recipient_name ?? "") })}
                              >
                                <ShieldX className="size-4 mr-1" /> Revoke
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Dialog open={!!revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke certificate</DialogTitle>
            <DialogDescription>
              This will permanently invalidate the certificate for <strong>{revokeTarget?.name}</strong>.
              The verification page will show it as revoked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason for revocation</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Plagiarism detected in submitted project" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim() || revoke.isPending} onClick={handleRevoke}>
              {revoke.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : <ShieldX className="size-4 mr-1" />}
              Revoke certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
