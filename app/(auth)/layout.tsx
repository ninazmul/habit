import type { Metadata } from "next";
import Image from "next/image";
import {
  CheckCircle2,
  Shield,
  Cpu,
  FolderKanban,
  Coins,
  Lock,
  Sparkles,
} from "lucide-react";
import { buildPublicPageMetadata } from "@/lib/seo";
import {
  APP_NAME,
  APP_BRAND,
  APP_TAGLINE,
  APP_SUBTAGLINE,
  APP_DESCRIPTION,
} from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const metadata: Metadata = buildPublicPageMetadata("/sign-in");

const corePillars = [
  {
    icon: CheckCircle2,
    title: "Daily Tasks & Habits",
    desc: "Prioritized task queues, recurrent scheduling, and streak tracking.",
  },
  {
    icon: Cpu,
    title: "AI Accounts & Rotation",
    desc: "Automated cooldown timers, quota tracking, and instant ready account queues.",
  },
  {
    icon: FolderKanban,
    title: "Projects & Milestones",
    desc: "Manage deliverables, client milestones, deadlines, and project health.",
  },
  {
    icon: Coins,
    title: "Finance & Income Flow",
    desc: "Upcoming project receivables, cash received, expenses, and investments.",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Vault",
    desc: "AES-256 encrypted storage for sensitive keys, credentials, and notes.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Brand Hero Side */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-14 lg:p-16 border-b md:border-b-0 md:border-r border-border/60 bg-gradient-to-br from-primary/5 via-background to-secondary/20 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-border/80 shadow-lg shadow-primary/20 shrink-0 bg-card">
              <Image
                src="/assets/images/logo.png"
                alt="Habit Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-muted-foreground font-medium">by Rizmec</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 my-10 md:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Command Center</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Master your daily life and workflows in one place.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
            {APP_DESCRIPTION}
          </p>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {corePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Private Personal OS</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Rizmec</span>
        </div>
      </div>

      {/* Auth Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-card/30">
        <div className="w-full max-w-md flex flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
}
