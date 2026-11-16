import { createFileRoute } from "@tanstack/react-router";

import { LeadsWorkspace } from "@/features/leads/leads-workspace";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Lead Management — Turnpike Analyst Console" },
      { name: "description", content: "Triage every inbound lead with live SLA tracking." },
    ],
  }),
  component: () => (
    <LeadsWorkspace
      title="Lead Management"
      description="Every inbound enquiry from the Turnpike Analyst platform, with SLA countdowns and one-click status changes."
    />
  ),
});
