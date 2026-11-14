import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { CardSkeleton, EmptyState, ErrorState } from "@turnpike/shared/components/premium/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@turnpike/shared/components/ui/table";
import { Button } from "@turnpike/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@turnpike/shared/components/ui/dropdown-menu";
import { useUsers, useDeleteUser } from "@turnpike/shared/hooks/use-api";
import { describeError } from "@turnpike/shared/hooks/use-auth";
import type { UserResponse } from "@turnpike/shared/types/api";
import { UserFormDialog } from "@/features/users/user-form-dialog";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Turnpike Analyst Console" },
      { name: "description", content: "Administer platform users and roles." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const query = useUsers();
  const deleteUser = useDeleteUser();
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="User Management"
        description="Roles, access and account lifecycle for the Turnpike Analyst platform."
        actions={
          <Button
            onClick={() => {
              setSelectedUser(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add User
          </Button>
        }
      />

      {query.isLoading ? (
        <CardSkeleton />
      ) : query.error ? (
        <GlassCard interactive={false}>
          <ErrorState message={describeError(query.error)} onRetry={() => void query.refetch()} />
        </GlassCard>
      ) : !query.data?.length ? (
        <GlassCard interactive={false}>
          <EmptyState title="No users found" />
        </GlassCard>
      ) : (
        <GlassCard interactive={false} className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 size-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => setDeleteConfirmId(user._id as string)}
                        >
                          <Trash2 className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      )}

      <UserFormDialog
        open={dialogOpen}
        user={selectedUser}
        onOpenChange={setDialogOpen}
      />

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
                disabled={deleteUser.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteUser.mutate(deleteConfirmId, {
                    onSuccess: () => setDeleteConfirmId(null)
                  });
                }}
                disabled={deleteUser.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteUser.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
