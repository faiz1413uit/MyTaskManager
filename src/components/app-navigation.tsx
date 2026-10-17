"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  House,
  LayoutDashboard,
  ListTodo,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: House, mobile: true },
  { label: "Today", href: "/today", icon: LayoutDashboard },
  { label: "Upcoming", href: "/upcoming", icon: CalendarDays },
  { label: "All tasks", href: "/tasks", icon: ListTodo, mobile: false },
  { label: "Completed", href: "/completed", icon: CheckCircle2, mobile: false },
  { label: "Activity", href: "/activity", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        mobile
          ? "fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-border bg-card/95 p-1.5 backdrop-blur lg:hidden"
          : "mt-10 space-y-1",
      )}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {items
        .filter((item) => !mobile || item.mobile !== false)
        .map(({ label, href, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-medium transition",
              mobile
                ? "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px]"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={mobile ? 17 : 18} />
            <span className="truncate">{label}</span>
          </Link>
        );
        })}
    </nav>
  );
}
