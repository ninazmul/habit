"use client";

import { useState, useEffect, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Settings,
  Database,
  Download,
  Shield,
  Bell,
  HardDrive,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Server,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import toast from "react-hot-toast";
import {
  APP_NAME,
  APP_VERSION,
  APP_AUTHOR,
  APP_AUTHOR_URL,
  APP_TAGLINE,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import { getSystemHealth, exportWorkspaceData } from "@/lib/actions/system.actions";
import { getSystemAlerts, HabitAlert } from "@/lib/actions/notification.actions";
import Link from "next/link";

interface SystemHealthData {
  database: {
    status: string;
    host?: string;
    name?: string;
  };
  counts: {
    tasks: number;
    events: number;
    projects: number;
    aiAccounts: number;
    financeRecords: number;
    shoppingItems: number;
    vaultSecrets: number;
    customModules: number;
  };
  systemTime: string;
}

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [alerts, setAlerts] = useState<HabitAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [testingCron, setTestingCron] = useState(false);
  const [cronReport, setCronReport] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hData, aData] = await Promise.all([
        getSystemHealth(),
        getSystemAlerts(),
      ]);
      setHealth(hData);
      setAlerts(aData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load system diagnostics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Full JSON Backup Export
  const handleExportBackup = async () => {
    try {
      setExporting(true);
      toast.loading("Generating full workspace backup...", { id: "export-toast" });
      const exportPayload = await exportWorkspaceData();

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habit-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Workspace backup downloaded!", { id: "export-toast" });
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export backup", { id: "export-toast" });
    } finally {
      setExporting(false);
    }
  };

  // Trigger Cron Test
  const handleTestCron = async () => {
    try {
      setTestingCron(true);
      const res = await fetch("/api/cron");
      const data = await res.json();
      setCronReport(JSON.stringify(data, null, 2));
      toast.success("Cron routine triggered successfully");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to execute cron check");
    } finally {
      setTestingCron(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Settings & Control
                </h1>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono">
                  v{APP_VERSION}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Workspace diagnostics, JSON backups, alert feeds, and configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExportBackup}
              disabled={exporting}
              className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : "Backup Data"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList className="bg-card/80 border border-border/60 p-1 rounded-xl">
          <TabsTrigger value="preferences" className="text-xs">
            Preferences & Profile
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-xs">
            Data & Backup
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">
            System & Health
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs flex items-center gap-1.5">
            <span>Alerts</span>
            {alerts.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 1. Preferences & Profile Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Info */}
            <Card className="border-border/80 bg-card/80 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Authenticated Operator
                </CardTitle>
                <CardDescription className="text-xs">
                  Active authentication session managed by Clerk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {userLoaded && user ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Avatar"
                          className="h-10 w-10 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {user.firstName?.[0] || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user.fullName || user.username || "Operator"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-secondary/30">
                        <span className="text-muted-foreground block text-[10px]">User ID</span>
                        <span className="font-mono truncate block text-foreground">
                          {user.id}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/30">
                        <span className="text-muted-foreground block text-[10px]">2FA Security</span>
                        <span className="font-medium text-emerald-500">
                          {user.twoFactorEnabled ? "Enabled" : "Standard"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-muted-foreground animate-pulse">
                    Loading operator profile...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Configuration */}
            <Card className="border-border/80 bg-card/80 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Workspace Defaults
                </CardTitle>
                <CardDescription className="text-xs">
                  Global parameters for calculations and display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                  <div>
                    <span className="font-medium block text-foreground">Primary Currency</span>
                    <span className="text-[11px] text-muted-foreground">
                      Bangladeshi Taka (BDT)
                    </span>
                  </div>
                  <Badge variant="outline" className="font-bold text-xs bg-primary/10 text-primary">
                    {CURRENCY_SYMBOL} BDT
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                  <div>
                    <span className="font-medium block text-foreground">AI Cooldown Default</span>
                    <span className="text-[11px] text-muted-foreground">
                      Quota cooldown period for accounts
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    180 min (3h)
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                  <div>
                    <span className="font-medium block text-foreground">Theme Mode</span>
                    <span className="text-[11px] text-muted-foreground">
                      Switch between dark, light, and system
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Data & Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <Card className="border-border/80 bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                Complete Workspace JSON Backup
              </CardTitle>
              <CardDescription className="text-xs">
                Export all tasks, events, projects, transactions, AI accounts, and custom schemas into a portable JSON document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {health && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Tasks</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.tasks}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Events</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.events}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Projects</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.projects}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">AI Accounts</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.aiAccounts}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Finances</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.financeRecords}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Shopping</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.shoppingItems}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Vault Items</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.vaultSecrets}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Custom Modules</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{health.counts.customModules}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Download Snapshot</p>
                  <p className="text-[11px] text-muted-foreground">
                    Generates a dated, machine-readable JSON archive of all your personal data.
                  </p>
                </div>
                <Button
                  onClick={handleExportBackup}
                  disabled={exporting}
                  className="text-xs bg-primary text-primary-foreground gap-1.5 font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? "Generating..." : "Download JSON Snapshot"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. System & Health Tab */}
        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MongoDB Connection Status */}
            <Card className="border-border/80 bg-card/80 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {health ? (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">
                        ● Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                      <span className="text-muted-foreground">Database Name</span>
                      <span className="font-mono font-medium">{health.database.name || "habit"}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                      <span className="text-muted-foreground">Host Cluster</span>
                      <span className="font-mono text-[11px] truncate max-w-[180px]">
                        {health.database.host || "MongoDB Atlas"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-muted-foreground animate-pulse">
                    Pinging database connection...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cron & Background Routines */}
            <Card className="border-border/80 bg-card/80 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Background Cron Worker
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated AI cooldown resets and overdue task audits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/30">
                  <div>
                    <span className="font-medium block text-foreground">Endpoint</span>
                    <span className="text-[10px] font-mono text-muted-foreground">/api/cron</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestCron}
                    disabled={testingCron}
                    className="h-7 text-[11px] gap-1"
                  >
                    <Zap className="h-3 w-3 text-amber-500" />
                    {testingCron ? "Executing..." : "Run Test"}
                  </Button>
                </div>

                {cronReport && (
                  <pre className="p-2.5 rounded-xl bg-secondary/60 text-[10px] font-mono text-foreground overflow-x-auto max-h-32">
                    {cronReport}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active System Digest ({alerts.length})
            </h3>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold">All systems green</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No overdue tasks, expired AI accounts, or urgent payments pending.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card/80 hover:bg-card transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        al.severity === "urgent"
                          ? "bg-rose-500/10 text-rose-500"
                          : al.severity === "warning"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {al.severity === "urgent" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {al.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {al.message}
                      </p>
                    </div>
                  </div>

                  <Link href={al.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary gap-1 px-2 hover:bg-primary/10"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
