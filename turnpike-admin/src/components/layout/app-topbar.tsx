import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Moon, Search, Sun, User as UserIcon, Volume2, VolumeX, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { uiFx } from "@turnpike/shared/lib/ui-fx";

/** Briefly enable colour transitions so a theme switch cross-fades. */
function animateThemeSwitch() {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 450);
}

import { Button } from "@turnpike/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@turnpike/shared/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@turnpike/shared/components/ui/popover";
import { ROUTE_TITLES } from "@/constants/navigation";
import { useLogout, useSession } from "@turnpike/shared/hooks/use-auth";
import { useLeads } from "@turnpike/shared/hooks/use-api";
import { titleCase, relativeTime } from "@turnpike/shared/utils/format";

export function AppTopbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useSession();
  const logout = useLogout();
  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(() => uiFx.isMuted());

  // Notifications are derived from real, freshly-created leads — the API has
  // no dedicated notifications endpoint.
  const { data: recentLeads } = useLeads({ skip: 0, limit: 5, status: "PENDING" });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const title = ROUTE_TITLES[pathname] ?? titleCase(pathname.split("/").filter(Boolean).at(-1) ?? "");
  const initials = (user?.full_name ?? "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 rounded-2xl glass-panel px-3 py-2.5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground">
          <Link to="/admin" className="hover:text-foreground">
            Console
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{title}</span>
        </nav>
        <p className="truncate text-sm font-semibold">{title}</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search console…"
            aria-label="Search console"
            className="h-9 w-56 rounded-xl border border-border/60 bg-background/60 pl-9 pr-3 text-sm outline-none backdrop-blur transition-all placeholder:text-muted-foreground focus:w-72 focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Quick actions">
              <Zap className="size-4.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quick actions</p>
            <Link to="/admin/services" className="block rounded-lg px-2 py-2 text-sm hover:bg-accent">
              New service
            </Link>
            <Link to="/admin/blogs" className="block rounded-lg px-2 py-2 text-sm hover:bg-accent">
              Publish article
            </Link>
            <Link to="/admin/leads" className="block rounded-lg px-2 py-2 text-sm hover:bg-accent">
              Triage leads
            </Link>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4.5" />
              {!!recentLeads?.length && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full gradient-brand" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Pending leads awaiting reply
            </p>
            {recentLeads?.length ? (
              recentLeads.map((lead) => (
                <Link
                  key={lead._id}
                  to="/admin/leads"
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{lead.full_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {lead.subject} · {relativeTime(lead.created_at)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">All caught up</p>
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          data-fx={muted ? "none" : "toggle"}
          onClick={() => {
            animateThemeSwitch();
            setDark((value) => !value);
          }}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          data-fx="none"
          onClick={() => {
            const next = uiFx.toggleMuted();
            setMuted(next);
            if (!next) uiFx.play("toggle");
          }}
          aria-label={muted ? "Unmute interface sounds" : "Mute interface sounds"}
          title={muted ? "Interface sounds off" : "Interface sounds on"}
        >
          {muted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 py-1.5 pl-1.5 pr-4 backdrop-blur transition-colors hover:bg-accent"
              aria-label="Account menu"
            >
              <span className="grid size-10 place-items-center rounded-xl gradient-brand text-[13px] font-bold text-primary-foreground">
                {initials || <UserIcon className="size-4" />}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-sm font-semibold leading-tight">
                  {user?.full_name ?? "Account"}
                </span>
                <span className="block text-xs leading-tight text-muted-foreground mt-0.5">
                  {titleCase(user?.role)}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel className="truncate text-base font-semibold py-2">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild className="text-sm py-2.5 cursor-pointer">
              <Link to="/admin/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-sm py-2.5 cursor-pointer">
              <Link to="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={logout} className="text-destructive text-sm py-2.5 cursor-pointer font-medium">
              <LogOut className="size-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
