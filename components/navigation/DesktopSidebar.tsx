"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Cpu,
  FolderKanban,
  Coins,
  Wallet,
  ShoppingCart,
  Lock,
  Boxes,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  APP_NAME,
  APP_VERSION,
  APP_TAGLINE,
} from "@/lib/constants";
import Image from "next/image";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const navGroups = [
  {
    label: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/schedule", label: "Schedule", icon: Calendar },
      { href: "/ai-accounts", label: "AI Accounts", icon: Cpu, badge: "Rotation" },
    ],
  },
  {
    label: "Work & Income",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/income", label: "Income Flow", icon: Coins },
    ],
  },
  {
    label: "Personal & Life",
    items: [
      { href: "/finance", label: "Finance", icon: Wallet },
      { href: "/shopping", label: "Shopping", icon: ShoppingCart },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/vault", label: "Vault", icon: Lock },
      { href: "/custom-modules", label: "Custom Modules", icon: Boxes },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border bg-card/60 backdrop-blur-xl z-30 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-border/80 shadow-md shadow-primary/20 shrink-0 bg-card">
            <Image
              src="/assets/images/logo.png"
              alt="Habit Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight">{APP_NAME}</span>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
              {APP_TAGLINE}
            </p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all relative group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && !isActive && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-border/60">
        <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-foreground truncate">
              Command Center Active
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        </div>
      </div>
    </aside>
  );
}
