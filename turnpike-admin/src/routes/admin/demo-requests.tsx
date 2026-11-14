import { createFileRoute } from "@tanstack/react-router";

import { LeadsWorkspace } from "@/features/leads/leads-workspace";

export const Route = createFileRoute("/admin/demo-requests")({
  head: () => ({
    meta: [
      { title: "Demo Requests — Turnpike Analyst Console" },
      { name: "description", content: "Product demo requests for James Webb and Agent P8." },
    ],
  }),
  component: () => (
    <LeadsWorkspace
      type="PRODUCT_DEMO"
      title="Product Demo Requests"
      description="Prospects asking for a guided walkthrough of the Turnpike product suite."
    />
  ),
});
