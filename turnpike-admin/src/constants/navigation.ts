import {
  Activity,
  BookOpen,
  Boxes,
  CalendarClock,
  FileText,
  Headset,
  KeyRound,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MonitorCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Workflow,
  Building2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@turnpike/shared/types/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Roles allowed to see the item. Undefined = every signed-in role. */
  roles?: UserRole[];
  /** True when the backend has no endpoint for this surface yet. */
  unavailable?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "System Health", to: "/admin/system-health", icon: MonitorCheck, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Leads", to: "/admin/leads", icon: Workflow, roles: ["ADMIN", "CONSULTANT"] },
      { label: "Book Calls", to: "/admin/book-calls", icon: CalendarClock, roles: ["ADMIN", "CONSULTANT"] },
      {
        label: "Demo Requests",
        to: "/admin/demo-requests",
        icon: Sparkles,
        roles: ["ADMIN", "CONSULTANT"],
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Services", to: "/admin/services", icon: Boxes },
      { label: "Digital Content Services", to: "/admin/digital-content", icon: BookOpen },
      { label: "Industries", to: "/admin/industries", icon: Building2 },
      { label: "Training Courses", to: "/admin/courses", icon: GraduationCap },
      {
        label: "Instructor Applications",
        to: "/admin/instructor-applications",
        icon: Users,
        roles: ["ADMIN", "CONSULTANT", "INSTRUCTOR"],
      },
    ],
  },
  {
    label: "Internship",
    items: [
      { label: "Projects", to: "/admin/internship-tracks", icon: Boxes, roles: ["ADMIN"] },
      {
        label: "Submissions",
        to: "/admin/internship-submissions",
        icon: FileText,
        roles: ["ADMIN"],
      },
      {
        label: "Certificate Templates",
        to: "/admin/certificate-templates",
        icon: GraduationCap,
        roles: ["ADMIN"],
      },
      { label: "Support Assistant", to: "/admin/chatbot", icon: Headset, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blogs", to: "/admin/blogs", icon: FileText },
      { label: "FAQs", to: "/admin/faqs", icon: BookOpen },
      { label: "Careers", to: "/admin/careers", icon: Users },
      { label: "Clients", to: "/admin/clients", icon: Workflow },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "User Management", to: "/admin/users", icon: UserCog, roles: ["ADMIN"] },
      { label: "Activity Logs", to: "/admin/activity", icon: Activity, roles: ["ADMIN"] },
      { label: "Profile", to: "/admin/profile", icon: Users },
      { label: "Sign-in & Security", to: "/admin/security", icon: KeyRound, roles: ["ADMIN"] },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

export const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/system-health": "System Health",
  "/admin/leads": "Lead Management",
  "/admin/book-calls": "Book Calls",
  "/admin/demo-requests": "Demo Requests",

  "/admin/services": "Services",
  "/admin/courses": "Training Courses",
  "/admin/instructor-applications": "Instructor Applications",
  "/admin/internship-tracks": "Internship Projects",
  "/admin/internship-submissions": "Internship Submissions",
  "/admin/certificate-templates": "Certificate Templates",
  "/admin/chatbot": "Support Assistant",
  "/admin/blogs": "Blogs",
  "/admin/newsletter": "Newsletter Subscribers",
  "/admin/cms": "CMS Library",
  "/admin/users": "User Management",
  "/admin/activity": "Activity Logs",
  "/admin/profile": "Profile",
  "/admin/security": "Sign-in & Security",
  "/admin/settings": "Settings",
  "/admin/notifications": "Notifications",
};
