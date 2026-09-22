"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Layers,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import QuickActionSheet from "@/components/navigation/QuickActionSheet";
import NavigationSheet from "@/components/navigation/NavigationSheet";

export default function BottomNav() {
  const pathname = usePathname();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/schedule", label: "Schedule", icon: Calendar },
  ];

  return (
    <>
      <QuickActionSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <NavigationSheet open={moreOpen} onOpenChange={setMoreOpen} />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-xl border-t border-border/60 shadow-lg safe-bottom">
        <div className="flex items-center justify-around px-2 py-1.5 relative">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative min-w-[54px]",
              pathname === "/"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {pathname === "/" && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>

          {/* Tasks */}
          <Link
            href="/tasks"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative min-w-[54px]",
              pathname.startsWith("/tasks")
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {pathname.startsWith("/tasks") && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px]">Tasks</span>
          </Link>

          {/* Center FAB */}
          <div className="relative -top-5">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="w-13 h-13 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35 flex items-center justify-center border-4 border-background active:scale-95 transition-transform"
              aria-label="Quick action"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Schedule */}
          <Link
            href="/schedule"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative min-w-[54px]",
              pathname.startsWith("/schedule")
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {pathname.startsWith("/schedule") && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Schedule</span>
          </Link>

          {/* More Drawer */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors text-muted-foreground hover:text-foreground min-w-[54px]"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
