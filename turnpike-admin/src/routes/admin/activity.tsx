import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { CardSkeleton, EmptyState, ErrorState } from "@turnpike/shared/components/premium/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@turnpike/shared/components/ui/table";
import { useActivityLogs } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Activity Logs — Turnpike Analyst Console" },
      { name: "description", content: "Audit trail of administrative actions." },
    ],
  }),
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  const query = useActivityLogs();

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Audit trail of every administrative action across the platform."
      />

      {query.isLoading ? (
        <CardSkeleton />
      ) : query.error ? (
        <GlassCard interactive={false}>
          <ErrorState message={describeError(query.error)} onRetry={() => void query.refetch()} />
        </GlassCard>
      ) : !query.data?.length ? (
        <GlassCard interactive={false}>
          <EmptyState title="No activity logs found" />
        </GlassCard>
      ) : (
        <GlassCard interactive={false} className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{log.user_name ?? log.user_id}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      )}
    </>
  );
}
