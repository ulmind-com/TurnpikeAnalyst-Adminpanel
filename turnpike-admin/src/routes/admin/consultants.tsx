import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { Button } from "@turnpike/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@turnpike/shared/components/ui/table";
import { Badge } from "@turnpike/shared/components/ui/badge";
import { useConsultants, useDeleteConsultant, Consultant } from "@turnpike/shared/api/services/consultants.api";
import { ConsultantFormDialog } from "@/features/consultants/consultant-form-dialog";

export const Route = createFileRoute("/admin/consultants")({
  head: () => ({
    meta: [
      { title: "Consultants — Turnpike Analyst Console" },
      { name: "description", content: "Manage public-facing consultant profiles." },
    ],
  }),
  component: ConsultantsPage,
});

function ConsultantsPage() {
  const { data: consultants, isLoading } = useConsultants(false);
  const deleteMutation = useDeleteConsultant();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedConsultant(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Consultants" description="Manage public-facing consultant profiles and their availability." />
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Add Consultant
        </Button>
      </div>

      <GlassCard className="mt-8 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Loading consultants...
                  </TableCell>
                </TableRow>
              ) : consultants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No consultants found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                consultants?.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <img src={c.avatar_url} alt={c.name} className="size-10 rounded-full object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{c.role_description}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <ConsultantFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        consultant={selectedConsultant}
      />

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Consultant</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this consultant? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => setDeleteConfirmId(null)
                  });
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
