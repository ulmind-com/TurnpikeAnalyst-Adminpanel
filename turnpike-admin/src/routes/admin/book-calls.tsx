import { createFileRoute } from "@tanstack/react-router";

import { LeadsWorkspace } from "@/features/leads/leads-workspace";

export const Route = createFileRoute("/admin/book-calls")({
  head: () => ({
    meta: [
      { title: "Book Calls — Turnpike Analyst Console" },
      { name: "description", content: "Consultation call requests booked from the website." },
    ],
  }),
  component: () => (
    <LeadsWorkspace
      type="BOOK_CALL"
      title="Book Calls"
      description="Consultation requests submitted through the book-a-call flow."
    />
  ),
});
