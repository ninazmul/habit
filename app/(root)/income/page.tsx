"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Coins,
  Plus,
  ArrowDownLeft,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Clock,
  Trash2,
  TrendingUp,
  Receipt,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getIncomeTransactions,
  getUpcomingReceivables,
  getIncomeStats,
  recordIncome,
  deleteIncome,
} from "@/lib/actions/income.actions";
import { getProjects } from "@/lib/actions/project.actions";
import { ITransaction, IMilestone, IProject } from "@/types/habit";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function IncomePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [stats, setStats] = useState({
    thisMonthReceived: 0,
    thisMonthExpected: 0,
    totalAllTime: 0,
  });
  const [activeTab, setActiveTab] = useState<"history" | "receivables">("history");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Income Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("project_milestone");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tx, rec, st, projs] = await Promise.all([
        getIncomeTransactions(),
        getUpcomingReceivables(),
        getIncomeStats(),
        getProjects(),
      ]);
      setTransactions(tx);
      setReceivables(rec);
      setStats(st);
      setProjects(projs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load income data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");

    startTransition(async () => {
      try {
        await recordIncome({
          type: "income",
          category,
          amount: Number(amount),
          date,
          description: description.trim() || undefined,
          projectId: projectId || undefined,
          paymentMethod,
          status: "received",
        });

        toast.success("Income recorded");
        setModalOpen(false);
        setAmount(0);
        setDescription("");
        setProjectId("");
        loadData();
      } catch (err) {
        toast.error("Failed to record income");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income entry?")) return;
    try {
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      await deleteIncome(id);
      toast.success("Income record removed");
      loadData();
    } catch (err) {
      toast.error("Failed to delete entry");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Income Flow & Receivables</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor client payments, project revenue, and expected pipeline receivables.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-1.5 shadow-sm shadow-primary/25 h-9"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Income</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60">
          <p className="text-xs font-semibold text-muted-foreground">Received (This Month)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-500">
              {CURRENCY_SYMBOL}{stats.thisMonthReceived.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Cash flow received</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60">
          <p className="text-xs font-semibold text-muted-foreground">Expected Pipeline</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-500">
              {CURRENCY_SYMBOL}{stats.thisMonthExpected.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Unpaid project milestones</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60">
          <p className="text-xs font-semibold text-muted-foreground">Lifetime Revenue</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {CURRENCY_SYMBOL}{stats.totalAllTime.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">All recorded payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeTab === "history"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          Received History ({transactions.length})
        </button>

        <button
          onClick={() => setActiveTab("receivables")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeTab === "receivables"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          Expected Pipeline ({receivables.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "history" ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading income transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-xl border-border/80">
              <Coins className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <h4 className="text-sm font-semibold text-foreground">No income recorded yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Record a freelance payout, client invoice, or project milestone.
              </p>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="mt-4 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Record Income
              </Button>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx._id}
                className="p-4 rounded-xl border border-border/80 bg-card/80 flex items-center justify-between gap-4 transition-all hover:border-primary/40"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {tx.description || tx.category.replace("_", " ")}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase shrink-0">
                        {tx.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{format(new Date(tx.date), "MMM d, yyyy")}</span>
                      {tx.projectId && (
                        <span className="flex items-center gap-1 text-primary">
                          <FolderKanban className="w-3 h-3" />
                          <span className="truncate">{tx.projectId.name}</span>
                        </span>
                      )}
                      {tx.paymentMethod && (
                        <span className="capitalize">· {tx.paymentMethod.replace("_", " ")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-extrabold text-emerald-500">
                    +{CURRENCY_SYMBOL}{tx.amount.toLocaleString()}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tx._id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Expected Receivables Tab */
        <div className="space-y-3">
          {receivables.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-xl border-border/80">
              <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <h4 className="text-sm font-semibold text-foreground">No pending receivables</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                All project milestones have been collected.
              </p>
            </div>
          ) : (
            receivables.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-xl border border-border/80 bg-card/80 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {m.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {m.projectId && (
                        <Link
                          href={`/projects/${m.projectId._id}`}
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <FolderKanban className="w-3 h-3" />
                          <span>{m.projectId.name}</span>
                        </Link>
                      )}
                      {m.dueDate && (
                        <span>· Due {format(new Date(m.dueDate), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-amber-500">
                    {CURRENCY_SYMBOL}{m.amount.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Pending milestone</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Record Income Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Income</DialogTitle>
            <DialogDescription className="text-xs">
              Log project payments, salaries, or miscellaneous cash inflows.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordIncome} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount ({CURRENCY_SYMBOL}) *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="25000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Date Received</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Linked Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Independent</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_milestone">Project Milestone</SelectItem>
                    <SelectItem value="freelance">Freelance Contract</SelectItem>
                    <SelectItem value="salary">Salary / Retainer</SelectItem>
                    <SelectItem value="consulting">Consulting Fee</SelectItem>
                    <SelectItem value="investment_return">Investment Return</SelectItem>
                    <SelectItem value="other">Other Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description / Client Note</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 50% milestone wire transfer"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending ? "Recording..." : "Record Income"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
