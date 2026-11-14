import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLogout, useSession } from "@turnpike/shared/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  // The session lives in browser storage, so the gate runs client-side only.
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, hydrated, user } = useSession();
  const navigate = useNavigate();
  const logout = useLogout();

  // Being signed in is not the same as being an administrator. Google
  // sign-in creates CLIENT accounts for the internship programme, and those
  // accounts must not reach the console shell — every admin API call would
  // be refused anyway, but a half-rendered console is its own problem.
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [hydrated, isAuthenticated, navigate]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            This console is for administrators
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in, but it does not have console access. If you are looking
            for the internship programme, it lives on the main site.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
