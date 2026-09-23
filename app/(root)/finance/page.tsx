"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PiggyBank,
  Handshake,
  Trash2,
  CheckCircle2,
  Clock,
  Building,
  BarChart3,
  CircleDollarSign,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseStats,
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentStats,
  getLoans,
  createLoan,
  recordLoanPayment,
  settleLoan,
  deleteLoan,
  getLoanStats,
} from "@/lib/actions/finance.actions";
import { ITransaction, IInvestment, ILoan } from "@/types/habit";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type FinanceTab = "expenses" | "investments" | "loans";

const EXPENSE_CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "rent", label: "Rent & Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health & Medical" },
  { value: "education", label: "Education" },
  { value: "shopping", label: "Shopping" },
  { value: "business", label: "Business Expense" },
  { value: "other", label: "Other" },
];

const ASSET_TYPES = [
  { value: "stocks", label: "Stocks" },
  { value: "savings_certificate", label: "Savings Certificate" },
  { value: "mutual_fund", label: "Mutual Fund" },
  { value: "real_estate", label: "Real Estate" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function formatMoney(n: number) {
  return `${CURRENCY_SYMBOL}${n.toLocaleString("en-BD")}`;
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    food: "🍕",
    transport: "🚗",
    rent: "🏠",
    utilities: "⚡",
    subscriptions: "📱",
    entertainment: "🎬",
    health: "💊",
    education: "📚",
    shopping: "🛍️",
    business: "💼",
    other: "📦",
  };
  return map[cat] || "📦";
}

function getAssetIcon(type: string) {
  const map: Record<string, string> = {
    stocks: "📈",
    savings_certificate: "🏦",
    mutual_fund: "📊",
    real_estate: "🏘️",
    crypto: "₿",
    business: "🏢",
    other: "💰",
  };
  return map[type] || "💰";
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("expenses");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // ── Expenses state
  const [expenses, setExpenses] = useState<ITransaction[]>([]);
  const [expenseStats, setExpenseStats] = useState({
    thisMonthTotal: 0,
    lastMonthTotal: 0,
    byCategory: [] as { category: string; amount: number }[],
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState("food");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expDescription, setExpDescription] = useState("");
  const [expPaymentMethod, setExpPaymentMethod] = useState("bkash");

  // ── Investments state
  const [investments, setInvestments] = useState<IInvestment[]>([]);
  const [investStats, setInvestStats] = useState({
    totalInvested: 0,
    currentValue: 0,
    portfolioCount: 0,
  });
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [invTitle, setInvTitle] = useState("");
  const [invAssetType, setInvAssetType] = useState("savings_certificate");
  const [invAmountInvested, setInvAmountInvested] = useState<number>(0);
  const [invCurrentValue, setInvCurrentValue] = useState<number>(0);
  const [invStartDate, setInvStartDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [invNotes, setInvNotes] = useState("");

  // ── Loans state
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loanStats, setLoanStats] = useState({
    totalLent: 0,
    totalBorrowed: 0,
    activeCount: 0,
  });
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [loanType, setLoanType] = useState<"lent" | "borrowed">("lent");
  const [loanCounterparty, setLoanCounterparty] = useState("");
  const [loanPrincipal, setLoanPrincipal] = useState<number>(0);
  const [loanRemaining, setLoanRemaining] = useState<number>(0);
  const [loanDueDate, setLoanDueDate] = useState("");
  const [loanNotes, setLoanNotes] = useState("");

  // ── Check URL params for auto-open
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      setExpenseModalOpen(true);
    }
  }, []);

  // ── Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [exp, eStats, inv, iStats, lns, lStats] = await Promise.all([
        getExpenses(),
        getExpenseStats(),
        getInvestments(),
        getInvestmentStats(),
        getLoans(),
        getLoanStats(),
      ]);
      setExpenses(exp);
      setExpenseStats(eStats);
      setInvestments(inv);
      setInvestStats(iStats);
      setLoans(lns);
      setLoanStats(lStats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load finance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Expense handlers
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || expAmount <= 0)
      return toast.error("Enter a valid amount");

    startTransition(async () => {
      try {
        await createExpense({
          type: "expense",
          category: expCategory,
          amount: expAmount,
          date: expDate,
          description: expDescription,
          paymentMethod: expPaymentMethod,
          status: "paid",
        });
        toast.success("Expense recorded");
        setExpenseModalOpen(false);
        resetExpenseForm();
        loadData();
      } catch (err) {
        toast.error("Failed to record expense");
      }
    });
  };

  const handleDeleteExpense = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpense(id);
        toast.success("Expense deleted");
        loadData();
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const resetExpenseForm = () => {
    setExpCategory("food");
    setExpAmount(0);
    setExpDate(format(new Date(), "yyyy-MM-dd"));
    setExpDescription("");
    setExpPaymentMethod("bkash");
  };

  // ── Investment handlers
  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTitle.trim()) return toast.error("Title is required");
    if (!invAmountInvested || invAmountInvested <= 0)
      return toast.error("Enter invested amount");

    startTransition(async () => {
      try {
        await createInvestment({
          title: invTitle,
          assetType: invAssetType,
          amountInvested: invAmountInvested,
          currentValue: invCurrentValue || undefined,
          startDate: invStartDate,
          notes: invNotes || undefined,
        });
        toast.success("Investment added");
        setInvestModalOpen(false);
        resetInvestForm();
        loadData();
      } catch (err) {
        toast.error("Failed to add investment");
      }
    });
  };

  const handleDeleteInvestment = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteInvestment(id);
        toast.success("Investment deleted");
        loadData();
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const resetInvestForm = () => {
    setInvTitle("");
    setInvAssetType("savings_certificate");
    setInvAmountInvested(0);
    setInvCurrentValue(0);
    setInvStartDate(format(new Date(), "yyyy-MM-dd"));
    setInvNotes("");
  };

  // ── Loan handlers
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanCounterparty.trim())
      return toast.error("Counterparty is required");
    if (!loanPrincipal || loanPrincipal <= 0)
      return toast.error("Enter principal amount");

    startTransition(async () => {
      try {
        await createLoan({
          type: loanType,
          counterparty: loanCounterparty,
          principalAmount: loanPrincipal,
          remainingAmount: loanRemaining || loanPrincipal,
          dueDate: loanDueDate || undefined,
          notes: loanNotes || undefined,
        });
        toast.success("Loan recorded");
        setLoanModalOpen(false);
        resetLoanForm();
        loadData();
      } catch (err) {
        toast.error("Failed to record loan");
      }
    });
  };

  const handleSettleLoan = async (id: string) => {
    startTransition(async () => {
      try {
        await settleLoan(id);
        toast.success("Loan settled");
        loadData();
      } catch {
        toast.error("Failed to settle");
      }
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount || paymentAmount <= 0) {
      return toast.error("Enter a valid payment amount");
    }
    if (paymentAmount > selectedLoan.remainingAmount) {
      return toast.error("Payment cannot exceed the remaining amount");
    }

    startTransition(async () => {
      try {
        await recordLoanPayment(selectedLoan._id, paymentAmount);
        toast.success(
          selectedLoan.type === "borrowed"
            ? "Payment recorded"
            : "Collection recorded",
        );
        setPaymentModalOpen(false);
        setSelectedLoan(null);
        setPaymentAmount(0);
        loadData();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to record payment",
        );
      }
    });
  };

  const handleDeleteLoan = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteLoan(id);
        toast.success("Loan deleted");
        loadData();
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const resetLoanForm = () => {
    setLoanType("lent");
    setLoanCounterparty("");
    setLoanPrincipal(0);
    setLoanRemaining(0);
    setLoanDueDate("");
    setLoanNotes("");
  };

  const tabs: { key: FinanceTab; label: string; icon: React.ElementType }[] = [
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "investments", label: "Investments", icon: PiggyBank },
    { key: "loans", label: "Loans", icon: Handshake },
  ];

  const changePercent =
    expenseStats.lastMonthTotal > 0
      ? Math.round(
          ((expenseStats.thisMonthTotal - expenseStats.lastMonthTotal) /
            expenseStats.lastMonthTotal) *
            100,
        )
      : 0;

  const investGain = investStats.currentValue - investStats.totalInvested;
  const investGainPct =
    investStats.totalInvested > 0
      ? Math.round((investGain / investStats.totalInvested) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Finance Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track expenses, investments, and outstanding loans
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (activeTab === "expenses") setExpenseModalOpen(true);
            else if (activeTab === "investments") setInvestModalOpen(true);
            else setLoanModalOpen(true);
          }}
          className="gap-1.5 shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {activeTab === "expenses"
              ? "Log Expense"
              : activeTab === "investments"
                ? "Add Investment"
                : "Record Loan"}
          </span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                This Month
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMoney(expenseStats.thisMonthTotal)}
            </p>
            {changePercent !== 0 && (
              <p
                className={cn(
                  "text-[10px] font-medium mt-0.5",
                  changePercent > 0 ? "text-rose-500" : "text-emerald-500",
                )}
              >
                {changePercent > 0 ? "↑" : "↓"} {Math.abs(changePercent)}% vs
                last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Invested
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMoney(investStats.totalInvested)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {investStats.portfolioCount} assets
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lent Out
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMoney(loanStats.totalLent)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              receivable
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Borrowed
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMoney(loanStats.totalBorrowed)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">payable</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border/40">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
              activeTab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* ─── EXPENSES TAB ─── */}
      {!isLoading && activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Category Breakdown */}
          {expenseStats.byCategory.length > 0 && (
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Category Breakdown (This Month)
                </h3>
                <div className="space-y-2">
                  {expenseStats.byCategory.slice(0, 6).map((cat) => {
                    const pct =
                      expenseStats.thisMonthTotal > 0
                        ? Math.round(
                            (cat.amount / expenseStats.thisMonthTotal) * 100,
                          )
                        : 0;
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            <span>{getCategoryEmoji(cat.category)}</span>
                            {EXPENSE_CATEGORIES.find(
                              (c) => c.value === cat.category,
                            )?.label || cat.category}
                          </span>
                          <span className="text-muted-foreground font-semibold">
                            {formatMoney(cat.amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense List */}
          {expenses.length === 0 ? (
            <Card className="border-border/60 bg-card/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                  <Receipt className="w-7 h-7 text-rose-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No expenses logged
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start tracking your spending
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpenseModalOpen(true)}
                  className="mt-3 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <Card
                  key={exp._id}
                  className="border-border/60 bg-card/80 hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center text-base shrink-0">
                        {getCategoryEmoji(exp.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {exp.description ||
                            EXPENSE_CATEGORIES.find(
                              (c) => c.value === exp.category,
                            )?.label ||
                            exp.category}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>
                            {format(new Date(exp.date), "dd MMM yyyy")}
                          </span>
                          {exp.paymentMethod && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                              <span className="capitalize">
                                {exp.paymentMethod.replace("_", " ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-500">
                        -{formatMoney(exp.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── INVESTMENTS TAB ─── */}
      {!isLoading && activeTab === "investments" && (
        <div className="space-y-4">
          {/* Portfolio summary */}
          {investStats.portfolioCount > 0 && (
            <Card className="border-border/60 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Portfolio Overview
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Invested
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {formatMoney(investStats.totalInvested)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Current
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {formatMoney(investStats.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Gain/Loss
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        investGain >= 0 ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {investGain >= 0 ? "+" : ""}
                      {formatMoney(investGain)} ({investGainPct}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {investments.length === 0 ? (
            <Card className="border-border/60 bg-card/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <PiggyBank className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No investments tracked
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start building your portfolio tracker
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInvestModalOpen(true)}
                  className="mt-3 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Investment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {investments.map((inv) => {
                const gain =
                  (inv.currentValue ?? inv.amountInvested) - inv.amountInvested;
                const gainPct =
                  inv.amountInvested > 0
                    ? Math.round((gain / inv.amountInvested) * 100)
                    : 0;
                return (
                  <Card
                    key={inv._id}
                    className="border-border/60 bg-card/80 hover:border-emerald-500/30 transition-colors"
                  >
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center text-base shrink-0">
                          {getAssetIcon(inv.assetType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {inv.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="capitalize">
                              {ASSET_TYPES.find(
                                (a) => a.value === inv.assetType,
                              )?.label || inv.assetType}
                            </span>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <span>
                              {format(new Date(inv.startDate), "dd MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {formatMoney(
                              inv.currentValue ?? inv.amountInvested,
                            )}
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-semibold",
                              gain >= 0 ? "text-emerald-500" : "text-rose-500",
                            )}
                          >
                            {gain >= 0 ? "+" : ""}
                            {formatMoney(gain)} ({gainPct}%)
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteInvestment(inv._id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── LOANS TAB ─── */}
      {!isLoading && activeTab === "loans" && (
        <div className="space-y-4">
          {/* Loan summary */}
          {loanStats.activeCount > 0 && (
            <Card className="border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                  Loan Summary
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Lent
                    </p>
                    <p className="text-sm font-bold text-blue-500">
                      {formatMoney(loanStats.totalLent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Borrowed
                    </p>
                    <p className="text-sm font-bold text-amber-500">
                      {formatMoney(loanStats.totalBorrowed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Net
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        loanStats.totalLent - loanStats.totalBorrowed >= 0
                          ? "text-emerald-500"
                          : "text-rose-500",
                      )}
                    >
                      {formatMoney(
                        Math.abs(loanStats.totalLent - loanStats.totalBorrowed),
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loans.length === 0 ? (
            <Card className="border-border/60 bg-card/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Handshake className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No loans tracked
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Track money you&apos;ve lent or borrowed
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLoanModalOpen(true)}
                  className="mt-3 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record First Loan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {loans.map((loan) => {
                const progress =
                  loan.principalAmount > 0
                    ? Math.round(
                        ((loan.principalAmount - loan.remainingAmount) /
                          loan.principalAmount) *
                          100,
                      )
                    : 0;
                return (
                  <Card
                    key={loan._id}
                    className={cn(
                      "border-border/60 bg-card/80 hover:border-primary/30 transition-colors",
                      loan.status === "settled" && "opacity-60",
                    )}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                              loan.type === "lent"
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-amber-500/10 border-amber-500/20",
                            )}
                          >
                            {loan.type === "lent" ? (
                              <ArrowUpRight className="w-4.5 h-4.5 text-blue-500" />
                            ) : (
                              <ArrowDownRight className="w-4.5 h-4.5 text-amber-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {loan.counterparty}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span
                                className={cn(
                                  "font-semibold uppercase",
                                  loan.type === "lent"
                                    ? "text-blue-500"
                                    : "text-amber-500",
                                )}
                              >
                                {loan.type}
                              </span>
                              {loan.dueDate && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                                  <span>
                                    Due{" "}
                                    {format(
                                      new Date(loan.dueDate),
                                      "dd MMM yyyy",
                                    )}
                                  </span>
                                </>
                              )}
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold border",
                                  loan.status === "settled"
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : loan.status === "partially_paid"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                )}
                              >
                                {loan.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">
                            {formatMoney(loan.remainingAmount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            of {formatMoney(loan.principalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            loan.status === "settled"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-primary to-primary/60",
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        {loan.status !== "settled" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedLoan(loan);
                                setPaymentAmount(0);
                                setPaymentModalOpen(true);
                              }}
                              className="h-7 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
                              disabled={isPending}
                            >
                              <CircleDollarSign className="w-3 h-3" />
                              {loan.type === "borrowed" ? "Pay" : "Receive"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSettleLoan(loan._id)}
                              className="h-7 text-[10px] text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 gap-1"
                              disabled={isPending}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Settle
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLoan(loan._id)}
                          className="h-7 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
                          disabled={isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── EXPENSE MODAL ─── */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Log Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record a personal or business expense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                        className="text-xs"
                      >
                        {getCategoryEmoji(c.value)} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Amount ({CURRENCY_SYMBOL})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={expAmount || ""}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select
                  value={expPaymentMethod}
                  onValueChange={setExpPaymentMethod}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Description (optional)
              </Label>
              <Input
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="e.g. Lunch at office, Uber ride..."
                className="h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-1.5"
              disabled={isPending}
            >
              <Receipt className="w-4 h-4" />
              Record Expense
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── PAYMENT MODAL ─── */}
      <Dialog
        open={paymentModalOpen}
        onOpenChange={(open) => {
          setPaymentModalOpen(open);
          if (!open) setSelectedLoan(null);
        }}
      >
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {selectedLoan?.type === "borrowed"
                ? "Record Loan Payment"
                : "Record Loan Collection"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedLoan && (
                <>
                  {selectedLoan.counterparty} has{" "}
                  {formatMoney(selectedLoan.remainingAmount)} remaining.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Amount ({CURRENCY_SYMBOL})
              </Label>
              <Input
                type="number"
                min={0}
                max={selectedLoan?.remainingAmount}
                step={0.01}
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="0"
                className="h-9 text-xs"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-1.5"
              disabled={isPending}
            >
              <CircleDollarSign className="w-4 h-4" />
              {selectedLoan?.type === "borrowed"
                ? "Record Payment"
                : "Record Collection"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── INVESTMENT MODAL ─── */}
      <Dialog open={investModalOpen} onOpenChange={setInvestModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Investment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Track a new investment in your portfolio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvestment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Title</Label>
              <Input
                value={invTitle}
                onChange={(e) => setInvTitle(e.target.value)}
                placeholder="e.g. National Savings Certificate"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Asset Type</Label>
                <Select value={invAssetType} onValueChange={setInvAssetType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((a) => (
                      <SelectItem
                        key={a.value}
                        value={a.value}
                        className="text-xs"
                      >
                        {getAssetIcon(a.value)} {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={invStartDate}
                  onChange={(e) => setInvStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Amount Invested ({CURRENCY_SYMBOL})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={invAmountInvested || ""}
                  onChange={(e) => setInvAmountInvested(Number(e.target.value))}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Current Value ({CURRENCY_SYMBOL})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={invCurrentValue || ""}
                  onChange={(e) => setInvCurrentValue(Number(e.target.value))}
                  placeholder="Optional"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (optional)</Label>
              <Textarea
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-1.5"
              disabled={isPending}
            >
              <PiggyBank className="w-4 h-4" />
              Add Investment
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── LOAN MODAL ─── */}
      <Dialog open={loanModalOpen} onOpenChange={setLoanModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Record Loan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Track money you&apos;ve lent or borrowed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLoan} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type</Label>
                <Select
                  value={loanType}
                  onValueChange={(v) => setLoanType(v as "lent" | "borrowed")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lent" className="text-xs">
                      💸 Lent (I gave)
                    </SelectItem>
                    <SelectItem value="borrowed" className="text-xs">
                      🤝 Borrowed (I took)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Counterparty</Label>
                <Input
                  value={loanCounterparty}
                  onChange={(e) => setLoanCounterparty(e.target.value)}
                  placeholder="Person/Entity"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Principal ({CURRENCY_SYMBOL})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={loanPrincipal || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLoanPrincipal(v);
                    setLoanRemaining(v);
                  }}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Remaining ({CURRENCY_SYMBOL})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={loanRemaining || ""}
                  onChange={(e) => setLoanRemaining(Number(e.target.value))}
                  placeholder="Same as principal"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Due Date (optional)
              </Label>
              <Input
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (optional)</Label>
              <Input
                value={loanNotes}
                onChange={(e) => setLoanNotes(e.target.value)}
                placeholder="Any details..."
                className="h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-1.5"
              disabled={isPending}
            >
              <Handshake className="w-4 h-4" />
              Record Loan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
