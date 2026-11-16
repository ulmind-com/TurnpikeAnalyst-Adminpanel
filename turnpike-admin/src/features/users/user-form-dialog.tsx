import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@turnpike/shared/components/ui/dialog";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { useCreateUser, useUpdateUser } from "@turnpike/shared/hooks/use-api";
import type { UserResponse } from "@turnpike/shared/types/api";
import { titleCase } from "@turnpike/shared/utils/format";

const ROLES = ["ADMIN", "CONSULTANT", "CLIENT", "INSTRUCTOR"];

const EMPTY: Partial<UserResponse> & { password?: string } = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  role: "CLIENT" as any,
  password: "",
};

export function UserFormDialog({
  open,
  user,
  onOpenChange,
}: {
  open: boolean;
  user: UserResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<UserResponse> & { password?: string }>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateUser();
  const update = useUpdateUser();
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    if (user) {
      const { _id, created_at, ...rest } = user;
      void _id;
      void created_at;
      setForm(rest);
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, user]);

  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if ((form.full_name || "").trim().length < 2) next.full_name = "Name must be at least 2 characters";
    if (!user && !(form.password || "").trim()) next.password = "Password is required for new users";
    if (!user && (form.password || "").trim().length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      if (user) {
        await update.mutateAsync({ id: user._id as string, payload: form });
      } else {
        await create.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      // Errors handled by useMutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {user
                ? "Update user details and roles."
                : "Create a new user account for the platform."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@example.com"
                disabled={!!user}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={form.company || ""}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role as string} onValueChange={(v) => set("role", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {titleCase(role.replace("_", " "))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {user ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
