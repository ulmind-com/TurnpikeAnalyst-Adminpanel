import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { request } from "@turnpike/shared/api/client";
import { PageHeader } from "@turnpike/shared/components/premium/page-header";
import { Button } from "@turnpike/shared/components/ui/button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { describeError, useLogout, useSession } from "@turnpike/shared/hooks/use-auth";
import type { UserResponse } from "@turnpike/shared/types/api";

export const Route = createFileRoute("/admin/security")({
  component: SecurityPage,
});

const changeCredentials = (payload: {
  current_password: string;
  new_email?: string;
  new_password?: string;
  full_name?: string;
}) => request<UserResponse>({ url: "/account/credentials", method: "POST", data: payload });

function SecurityPage() {
  const { user } = useSession();
  const logout = useLogout();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (newPassword && newPassword !== confirm) {
      toast.error("The two new passwords do not match.");
      return;
    }
    if (!newEmail && !newPassword && !fullName) {
      toast.error("Change at least one thing.");
      return;
    }

    setBusy(true);
    try {
      await changeCredentials({
        current_password: currentPassword,
        new_email: newEmail.trim() || undefined,
        new_password: newPassword || undefined,
        full_name: fullName.trim() || undefined,
      });

      // Changing either sign-in detail invalidates what the browser is
      // holding, so the session is ended rather than left in a state where
      // the token works but the credentials on file no longer match it.
      if (newEmail || newPassword) {
        toast.success("Credentials updated. Sign in again with the new details.");
        setTimeout(() => logout(), 1200);
      } else {
        toast.success("Saved.");
        setCurrentPassword("");
        setFullName("");
      }
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sign-in and security"
        description="Change the email and password this account signs in with."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Signed in as {user?.email}
          </p>
          <p className="mt-1 text-muted-foreground">
            The first administrator is created from the server's environment at first
            startup. Once one exists, that environment value is ignored — this page is the
            only way the credentials change.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Required for any change — it is what stops an unattended signed-in console from
            being used to lock you out.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder={user?.full_name ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">New email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder={user?.email ?? ""}
            className="mt-1.5"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          At least 10 characters. This account can approve certificates and manage every
          other user.
        </p>

        <Button type="submit" disabled={busy || !currentPassword} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Update credentials
        </Button>
      </form>
    </div>
  );
}
