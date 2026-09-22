"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CheckSquare,
  Cpu,
  FolderKanban,
  Coins,
  Calendar,
  Lock,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  Circle,
  Receipt,
  PiggyBank,
  Wallet,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuickActionSheet from "@/components/navigation/QuickActionSheet";
import { APP_NAME, CURRENCY_SYMBOL } from "@/lib/constants";
import { getTasks, getTodayTaskStats, toggleTaskComplete } from "@/lib/actions/task.actions";
import { getTodayEvents } from "@/lib/actions/event.actions";
import { getAIAccounts, getAIAccountSummary } from "@/lib/actions/ai-account.actions";
import { getExpenseStats, getInvestmentStats } from "@/lib/actions/finance.actions";
import { getIncomeStats } from "@/lib/actions/income.actions";
import { ITask, IEvent, IAIAccount } from "@/types/habit";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<ITask[]>([]);
  const [todayEvents, setTodayEvents] = useState<IEvent[]>([]);
  const [aiAccounts, setAiAccounts] = useState<IAIAccount[]>([]);
  const [aiSummary, setAiSummary] = useState({ total: 0, ready: 0, inUse: 0, coolingDown: 0 });
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [financeStats, setFinanceStats] = useState({
    thisMonthExpenses: 0,
    thisMonthIncome: 0,
    totalInvested: 0,
    currentPortfolioValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tasks, stats, events, accs, sum, expStats, incStats, invStats] = await Promise.all([
        getTasks({ dueDate: "today" }),
        getTodayTaskStats(),
        getTodayEvents(),
        getAIAccounts(),
        getAIAccountSummary(),
        getExpenseStats(),
        getIncomeStats(),
        getInvestmentStats(),
      ]);
      setTodayTasks(tasks);
      setTaskStats(stats);
      setTodayEvents(events);
      setAiAccounts(accs);
      setAiSummary(sum);
      setFinanceStats({
        thisMonthExpenses: expStats.thisMonthTotal,
        thisMonthIncome: incStats.thisMonthReceived,
        totalInvested: invStats.totalInvested,
        currentPortfolioValue: invStats.currentValue,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (task: ITask) => {
    try {
      setTodayTasks((prev) =>
        prev.map((t) =>
          t._id === task._id
            ? { ...t, status: t.status === "completed" ? "todo" : "completed" }
            : t
        )
      );
      await toggleTaskComplete(task._id);
      loadData();
    } catch (err) {
      toast.error("Failed to update task");
      loadData();
    }
  };

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <QuickActionSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      <div className="space-y-6">
        {/* Top Command Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8 shadow-xs">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20 mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Habit Command Center</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {greetingTime()}, Commander.
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Your personal and professional command center is synced and ready.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                onClick={() => setQuickAddOpen(true)}
                className="h-10 px-4 rounded-xl font-semibold gap-2 shadow-sm shadow-primary/25"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Quick Dispatch</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Tasks */}
          <Link href="/tasks" className="block group">
            <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Today&apos;s Tasks</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight">
                    {taskStats.completed} / {taskStats.total}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    {taskStats.overdue > 0 ? (
                      <span className="text-red-500 font-medium">
                        {taskStats.overdue} overdue
                      </span>
                    ) : taskStats.total > 0 && taskStats.completed === taskStats.total ? (
                      <span className="text-emerald-500 font-medium">All completed</span>
                    ) : (
                      <span className="text-blue-500 font-medium">
                        {taskStats.pending} remaining
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: AI Rotation */}
          <Link href="/ai-accounts" className="block group">
            <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">AI Accounts</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight">
                    {aiSummary.ready} Ready
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    {aiSummary.coolingDown > 0 ? (
                      <span className="text-amber-500 font-medium">
                        {aiSummary.coolingDown} in cooldown
                      </span>
                    ) : aiSummary.inUse > 0 ? (
                      <span className="text-blue-500 font-medium">
                        {aiSummary.inUse} active
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-medium">
                        {aiSummary.total} accounts registered
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Upcoming Income */}
          <Link href="/income" className="block group">
            <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Expected Income</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight">{CURRENCY_SYMBOL}0</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span className="text-amber-500 font-medium">This month</span>
                    <span>&middot; Milestone receivables</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 4: Active Projects */}
          <Link href="/projects" className="block group">
            <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Active Projects</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight">0 Active</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span className="text-purple-500 font-medium">0 milestones</span>
                    <span>due this week</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 2-Column Command Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Main Operations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Priority Tasks Widget */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 md:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Today&apos;s Focus & Tasks</span>
                  </CardTitle>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Loading today's tasks...
                  </div>
                ) : todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.slice(0, 5).map((task) => {
                      const isDone = task.status === "completed";
                      return (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:border-primary/40 bg-card/60 transition-all gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task)}
                              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground/60" />
                              )}
                            </button>
                            <span
                              className={cn(
                                "text-xs font-medium truncate",
                                isDone && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase",
                                task.priority === "p1"
                                  ? "text-red-500 bg-red-500/10 border-red-500/20"
                                  : task.priority === "p2"
                                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                                  : "text-blue-500 bg-blue-500/10 border-blue-500/20"
                              )}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No tasks scheduled for today</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 text-center">
                      Add a high-priority task, recurring habit, or project milestone to begin.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setQuickAddOpen(true)}
                      className="mt-4 rounded-xl text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Account Rotation & Cooldown Queue Widget */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 md:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-500" />
                    <span>AI Accounts & Cooldown Queue</span>
                  </CardTitle>
                </div>
                <Link
                  href="/ai-accounts"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                {aiAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {aiAccounts.slice(0, 4).map((acc) => (
                      <div
                        key={acc._id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card/60 gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0",
                              acc.service === "chatgpt" && "bg-emerald-500/15 text-emerald-500",
                              acc.service === "claude" && "bg-orange-500/15 text-orange-500",
                              acc.service === "cursor" && "bg-blue-500/15 text-blue-500",
                              !["chatgpt", "claude", "cursor"].includes(acc.service) && "bg-secondary text-foreground"
                            )}
                          >
                            {acc.service.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-foreground truncate">
                              {acc.name}
                            </h5>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {acc.service} · {acc.tier}
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase shrink-0",
                            acc.status === "ready" && "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                            acc.status === "in_use" && "text-blue-500 bg-blue-500/10 border-blue-500/20",
                            acc.status === "cooling_down" && "text-amber-500 bg-amber-500/10 border-amber-500/20"
                          )}
                        >
                          {acc.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <RotateCw className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No AI accounts registered</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 text-center">
                      Add your ChatGPT, Claude, Cursor, or Gemini accounts to track cooldowns, rotation queues, and quotas.
                    </p>
                    <Link href="/ai-accounts">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 rounded-xl text-xs font-medium"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Configure Accounts
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Projects Widget */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 md:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-purple-500" />
                    <span>Active Projects & Milestones</span>
                  </CardTitle>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>All Projects</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No active projects</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Track client work, personal software products, milestones, and deliverable payments.
                  </p>
                  <Link href="/projects">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-4 rounded-xl text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Timeline, Finance, Vault */}
          <div className="space-y-6">
            {/* Schedule / Agenda Widget */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 md:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Upcoming Schedule</span>
                </CardTitle>
                <Link
                  href="/schedule"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                {todayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {todayEvents.slice(0, 4).map((evt) => {
                      const startDate = new Date(evt.startDateTime);
                      return (
                        <div
                          key={evt._id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card/60 gap-2.5"
                        >
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-foreground truncate">
                              {evt.title}
                            </h5>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {evt.isAllDay
                                ? "All day"
                                : format(startDate, "h:mm a")}
                              {evt.location && ` · ${evt.location}`}
                            </p>
                          </div>
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase shrink-0">
                            {evt.type.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <p className="text-xs text-muted-foreground text-center">
                      No meetings or events scheduled for today.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickAddOpen(true)}
                      className="mt-3 text-xs text-primary font-medium"
                    >
                      + Schedule Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Overview Widget */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 md:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>Financial Snapshot</span>
                </CardTitle>
                <Link
                  href="/finance"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Details
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Income This Month</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">
                    {CURRENCY_SYMBOL}{financeStats.thisMonthIncome.toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs text-muted-foreground">Expenses This Month</span>
                  </div>
                  <span className="text-sm font-bold text-rose-500">
                    {CURRENCY_SYMBOL}{financeStats.thisMonthExpenses.toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Portfolio Value</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {CURRENCY_SYMBOL}{financeStats.currentPortfolioValue.toLocaleString("en-BD")}
                    </span>
                    {financeStats.totalInvested > 0 && financeStats.currentPortfolioValue !== financeStats.totalInvested && (
                      <p className={cn(
                        "text-[10px] font-semibold",
                        financeStats.currentPortfolioValue >= financeStats.totalInvested
                          ? "text-emerald-500"
                          : "text-rose-500"
                      )}>
                        {financeStats.currentPortfolioValue >= financeStats.totalInvested ? "+" : ""}
                        {CURRENCY_SYMBOL}{Math.abs(financeStats.currentPortfolioValue - financeStats.totalInvested).toLocaleString("en-BD")}
                      </p>
                    )}
                  </div>
                </div>
                {/* Cash Flow Indicator */}
                {(financeStats.thisMonthIncome > 0 || financeStats.thisMonthExpenses > 0) && (
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold",
                    financeStats.thisMonthIncome >= financeStats.thisMonthExpenses
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-600"
                  )}>
                    <span>Net Cash Flow</span>
                    <span>
                      {financeStats.thisMonthIncome >= financeStats.thisMonthExpenses ? "+" : ""}
                      {CURRENCY_SYMBOL}{Math.abs(financeStats.thisMonthIncome - financeStats.thisMonthExpenses).toLocaleString("en-BD")}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Link href="/finance" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1">
                      <Receipt className="w-3 h-3" /> Expenses
                    </Button>
                  </Link>
                  <Link href="/shopping" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1">
                      🛍️ Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Zero-Knowledge Vault Teaser */}
            <Card className="border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Encrypted Vault</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Store API keys, recovery codes, and secret credentials with zero-knowledge AES-256 encryption.
                    </p>
                    <Link href="/vault" className="inline-block mt-3">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] font-medium rounded-lg">
                        Open Vault
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Modules Teaser */}
            <Card className="border-border/80 bg-gradient-to-br from-card via-card to-secondary/20 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Custom Modules</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Build bespoke micro-databases, inventories, and reading trackers with typed schemas.
                    </p>
                    <Link href="/custom-modules" className="inline-block mt-3">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] font-medium rounded-lg">
                        Manage Modules
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
