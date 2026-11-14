import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronsLeft, Hexagon } from "lucide-react";

import { NAV_SECTIONS } from "@/constants/navigation";
import { useSession } from "@turnpike/shared/hooks/use-auth";
import { cn } from "@turnpike/shared/lib/utils";
import { Button } from "@turnpike/shared/components/ui/button";
import { ScrollArea } from "@turnpike/shared/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turnpike/shared/components/ui/tooltip";

export function AppSidebar({
  collapsed,
  onToggle,
  onNavigate,
  badges,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useSession();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (user?.role && item.roles.includes(user.role))),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full flex-col rounded-none border-r border-border/50 bg-sidebar backdrop-blur-2xl transition-[width] duration-300 lg:rounded-3xl lg:border",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
          <Hexagon className="size-4.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Turnpike Analyst</p>
            <p className="truncate text-[11px] text-muted-foreground">Enterprise Console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("ml-auto hidden size-8 lg:inline-flex", collapsed && "ml-0")}
        >
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2.5">
        <nav className="space-y-5 pb-6">
          {sections.map((section) => (
            <div key={section.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                const badge = badges?.[item.to];

                const link = (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/25"
                      />
                    )}
                    <item.icon className="relative size-4.5 shrink-0" />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                    {!collapsed && item.unavailable && (
                      <span className="relative ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        soon
                      </span>
                    )}
                    {!collapsed && !!badge && (
                      <span className="relative ml-auto grid min-w-5 place-items-center rounded-full gradient-brand px-1.5 text-[10px] font-semibold text-primary-foreground">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="m-3 flex flex-col gap-3">
          <Button variant="outline" className="w-full text-xs text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">Back to Website &rarr;</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
