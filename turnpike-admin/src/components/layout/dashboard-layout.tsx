import { useState, type ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AuroraBackground } from "@turnpike/shared/components/effects/aurora-background";
import { ScrollProgress } from "@turnpike/shared/components/effects/scroll-progress";
import { Sheet, SheetContent } from "@turnpike/shared/components/ui/sheet";
import { useLeads } from "@turnpike/shared/hooks/use-api";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Live badge counts straight from the API.
  const { data: pendingLeads } = useLeads({ skip: 0, limit: 100, status: "PENDING" });
  const badges = { "/leads": pendingLeads?.length ?? 0 };

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <ScrollProgress />

      <div className="flex min-h-screen gap-0 lg:gap-4 lg:p-4">
        <div className="sticky top-4 hidden h-[calc(100vh-2rem)] lg:block">
          <AppSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
            badges={badges}
          />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
              badges={badges}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-3 lg:p-0">
          <AppTopbar onOpenMobileNav={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1 space-y-6 pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
