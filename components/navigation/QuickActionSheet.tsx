"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Calendar,
  Cpu,
  Coins,
  Receipt,
  ShoppingCart,
  Lock,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickActionSheet({
  open,
  onOpenChange,
}: QuickActionSheetProps) {
  const router = useRouter();

  const actions = [
    {
      title: "Add Task",
      desc: "Create a task with priority, due date & tags",
      icon: CheckSquare,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      href: "/tasks?new=true",
    },
    {
      title: "Schedule Event",
      desc: "Meeting, deadline, or life reminder",
      icon: Calendar,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      href: "/schedule?new=true",
    },
    {
      title: "AI Account Rotation",
      desc: "Rotate account, mark cooldown or add service",
      icon: Cpu,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      href: "/ai-accounts",
    },
    {
      title: "Record Income",
      desc: "Log project milestone payment or received cash",
      icon: Coins,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      href: "/income?new=true",
    },
    {
      title: "Log Expense",
      desc: "Record personal, business or recurring expense",
      icon: Receipt,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      href: "/finance?new=true",
    },
    {
      title: "Add Shopping Item",
      desc: "Monthly grocery or tech purchase queue",
      icon: ShoppingCart,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
      href: "/shopping?new=true",
    },
    {
      title: "Encrypted Vault Item",
      desc: "Save credential, token, or secret note",
      icon: Lock,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      href: "/vault",
    },
    {
      title: "Custom Module",
      desc: "Design new custom tracker or database schema",
      icon: Boxes,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
      href: "/custom-modules",
    },
  ];

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-card/95 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold tracking-tight">
            Quick Command
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Instantly dispatch an action to any module in your command center.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 grid grid-cols-1 gap-2 max-h-[70vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                type="button"
                onClick={() => handleSelect(act.href)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-secondary/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${act.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {act.desc}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
