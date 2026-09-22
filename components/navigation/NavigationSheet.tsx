"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  navGroups,
} from "@/components/navigation/DesktopSidebar";
import {
  APP_NAME,
  APP_VERSION,
  APP_AUTHOR,
  APP_AUTHOR_URL,
  APP_TAGLINE,
} from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface NavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NavigationSheet({
  open,
  onOpenChange,
}: NavigationSheetProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-[320px] border-r border-border bg-card/95 p-0 backdrop-blur-2xl [&>button]:hidden flex flex-col h-full justify-between"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border/60 px-5 py-4 text-left shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-border/80 shadow-md shadow-primary/20 shrink-0 bg-card">
              <Image
                src="/assets/images/logo.png"
                alt="Habit Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="truncate text-base font-bold tracking-tight">
                  {APP_NAME}
                </SheetTitle>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
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
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all group",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && !isActive && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <footer className="shrink-0 p-4 border-t border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Personal Command Center</span>
            </div>
            <a
              href={APP_AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors text-[11px]"
            >
              by {APP_AUTHOR}
            </a>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
