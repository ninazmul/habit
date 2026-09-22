"use client";

import { useState } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Menu, Plus, Sparkles, Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavigationSheet from "@/components/navigation/NavigationSheet";
import QuickActionSheet from "@/components/navigation/QuickActionSheet";
import GlobalSearchModal from "@/components/search/GlobalSearchModal";
import {
  APP_NAME,
  APP_VERSION,
} from "@/lib/constants";

export default function TopNavbar() {
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <NavigationSheet
        open={navigationOpen}
        onOpenChange={setNavigationOpen}
      />
      <QuickActionSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
      <GlobalSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-xs">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setNavigationOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-border/80 shadow-xs shrink-0 bg-card">
                <Image
                  src="/assets/images/logo.png"
                  alt="Habit Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-sm tracking-tight">{APP_NAME}</span>
            </button>
          </div>

          {/* Desktop date & quick summary */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-xl border border-border/70 bg-secondary/40 hover:bg-secondary/70 text-xs text-muted-foreground transition-all"
              title="Search everything (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search icon button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden h-8 w-8 rounded-xl text-muted-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Quick Action Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => setQuickAddOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Quick Action</span>
            </Button>

            <ThemeToggle />

            <SignedIn>
              <UserButton
                afterSwitchSessionUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-xl",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>
    </>
  );
}
