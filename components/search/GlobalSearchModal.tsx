"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckSquare,
  Calendar,
  FolderKanban,
  Cpu,
  Wallet,
  ShoppingCart,
  Lock,
  Boxes,
  ArrowRight,
  Command,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchEverything, SearchResultItem } from "@/lib/actions/search.actions";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearchModal({
  open,
  onOpenChange,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await searchEverything(query);
          setResults(res);
        } catch (err) {
          console.error("Search failed:", err);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(url);
  };

  const getItemIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "task":
        return CheckSquare;
      case "event":
        return Calendar;
      case "project":
        return FolderKanban;
      case "ai-account":
        return Cpu;
      case "finance":
        return Wallet;
      case "shopping":
        return ShoppingCart;
      case "vault":
        return Lock;
      case "custom":
        return Boxes;
      default:
        return Search;
    }
  };

  const getItemColor = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "task":
        return "text-blue-500 bg-blue-500/10";
      case "event":
        return "text-amber-500 bg-amber-500/10";
      case "project":
        return "text-purple-500 bg-purple-500/10";
      case "ai-account":
        return "text-emerald-500 bg-emerald-500/10";
      case "finance":
        return "text-emerald-600 bg-emerald-600/10";
      case "shopping":
        return "text-pink-500 bg-pink-500/10";
      case "vault":
        return "text-indigo-500 bg-indigo-500/10";
      case "custom":
        return "text-cyan-500 bg-cyan-500/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-border shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Command Search</DialogTitle>
        </DialogHeader>

        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 border-b border-border/60 h-14">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search tasks, events, finances, vault, projects..."
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none border-none focus:ring-0 text-foreground"
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/40">
            <span>ESC</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim().length >= 2 && results.length === 0 && !isPending && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Universal Command Palette
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  { label: "Tasks", href: "/tasks" },
                  { label: "Schedule", href: "/schedule" },
                  { label: "AI Accounts", href: "/ai-accounts" },
                  { label: "Projects", href: "/projects" },
                  { label: "Finance Hub", href: "/finance" },
                  { label: "Vault", href: "/vault" },
                  { label: "Custom Modules", href: "/custom-modules" },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleSelect(q.href)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((item) => {
            const Icon = getItemIcon(item.type);
            const colorClass = getItemColor(item.type);

            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item.url)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.badge}
                    </Badge>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground bg-secondary/20">
          <div className="flex items-center gap-1.5">
            <Command className="h-3 w-3" />
            <span>Habit Universal Search</span>
          </div>
          <span className="text-[10px]">Press Enter to open</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
