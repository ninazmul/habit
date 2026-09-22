"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Filter,
  Package,
  Smartphone,
  Home,
  Shirt,
  User,
  Box,
  ShoppingBag,
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
  getShoppingItems,
  createShoppingItem,
  toggleShoppingPurchased,
  deleteShoppingItem,
  getShoppingStats,
} from "@/lib/actions/shopping.actions";
import { IShoppingItem } from "@/types/habit";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "grocery", label: "Grocery", icon: ShoppingBag, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "tech_gadgets", label: "Tech / Gadgets", icon: Smartphone, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "household", label: "Household", icon: Home, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "clothing", label: "Clothing", icon: Shirt, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { value: "personal", label: "Personal Care", icon: User, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { value: "other", label: "Other", icon: Box, color: "text-muted-foreground bg-secondary border-border" },
];

const PRIORITIES = [
  { value: "high", label: "High", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { value: "medium", label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "low", label: "Low", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
];

function formatMoney(n?: number) {
  if (!n) return null;
  return `${CURRENCY_SYMBOL}${n.toLocaleString("en-BD")}`;
}

function getCurrentMonth() {
  return format(new Date(), "yyyy-MM");
}

export default function ShoppingPage() {
  const [items, setItems] = useState<IShoppingItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    purchased: 0,
    pending: 0,
    estimatedTotal: 0,
    actualTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPurchased, setFilterPurchased] = useState<"all" | "pending" | "purchased">("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("grocery");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newEstimatedPrice, setNewEstimatedPrice] = useState<number>(0);
  const [newTargetMonth, setNewTargetMonth] = useState(getCurrentMonth());
  const [newNotes, setNewNotes] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const purchasedFilter =
        filterPurchased === "purchased"
          ? true
          : filterPurchased === "pending"
          ? false
          : undefined;

      const [its, sts] = await Promise.all([
        getShoppingItems({
          month: filterMonth || undefined,
          category: filterCategory !== "all" ? filterCategory : undefined,
          purchased: purchasedFilter,
        }),
        getShoppingStats(filterMonth || undefined),
      ]);
      setItems(its);
      setStats(sts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shopping list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") setModalOpen(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [filterMonth, filterCategory, filterPurchased]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error("Item title is required");

    startTransition(async () => {
      try {
        await createShoppingItem({
          title: newTitle,
          category: newCategory,
          priority: newPriority,
          estimatedPrice: newEstimatedPrice || undefined,
          targetMonth: newTargetMonth || undefined,
          notes: newNotes || undefined,
        });
        toast.success("Item added to list");
        setModalOpen(false);
        resetForm();
        loadData();
      } catch {
        toast.error("Failed to add item");
      }
    });
  };

  const handleToggle = async (item: IShoppingItem) => {
    // Optimistic
    setItems((prev) =>
      prev.map((i) =>
        i._id === item._id ? { ...i, isPurchased: !i.isPurchased } : i
      )
    );
    startTransition(async () => {
      try {
        await toggleShoppingPurchased(item._id);
        loadData();
      } catch {
        toast.error("Failed to update");
        loadData();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteShoppingItem(id);
        toast.success("Item removed");
        loadData();
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const resetForm = () => {
    setNewTitle("");
    setNewCategory("grocery");
    setNewPriority("medium");
    setNewEstimatedPrice(0);
    setNewTargetMonth(getCurrentMonth());
    setNewNotes("");
  };

  const pendingItems = items.filter((i) => !i.isPurchased);
  const purchasedItems = items.filter((i) => i.isPurchased);

  const progressPct = stats.totalItems > 0
    ? Math.round((stats.purchased / stats.totalItems) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Shopping List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly purchase tracker and wish list
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1.5 shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Items</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
            <p className="text-[10px] text-muted-foreground">{stats.pending} pending</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Done</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.purchased}</p>
            <p className="text-[10px] text-muted-foreground">{progressPct}% complete</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated</p>
            <p className="text-lg font-bold text-foreground">{formatMoney(stats.estimatedTotal) || "—"}</p>
            <p className="text-[10px] text-muted-foreground">budget</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Spent</p>
            <p className="text-lg font-bold text-rose-500">{formatMoney(stats.actualTotal) || "—"}</p>
            <p className="text-[10px] text-muted-foreground">actual</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {stats.totalItems > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Progress</span>
            <span className="text-muted-foreground">
              {stats.purchased}/{stats.totalItems} items purchased
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-8 text-xs w-36"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/40">
          {(["all", "pending", "purchased"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterPurchased(f)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all",
                filterPurchased === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <Card className="border-border/60 bg-card/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <ShoppingCart className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nothing to buy yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add items to your monthly shopping list
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="mt-3 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Items */}
      {!isLoading && pendingItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider px-0.5">
            Pending ({pendingItems.length})
          </h2>
          {pendingItems.map((item) => (
            <ShoppingItemCard
              key={item._id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Purchased Items */}
      {!isLoading && purchasedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-0.5">
            Purchased ({purchasedItems.length})
          </h2>
          {purchasedItems.map((item) => (
            <ShoppingItemCard
              key={item._id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Shopping Item</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add an item to your monthly shopping list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Item Name</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. AirPods Pro, Rice (5kg)..."
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select
                  value={newPriority}
                  onValueChange={(v) => setNewPriority(v as "low" | "medium" | "high")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Est. Price ({CURRENCY_SYMBOL})</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newEstimatedPrice || ""}
                  onChange={(e) => setNewEstimatedPrice(Number(e.target.value))}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Month</Label>
                <Input
                  type="month"
                  value={newTargetMonth}
                  onChange={(e) => setNewTargetMonth(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (optional)</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Any extra details..."
                className="h-9 text-xs"
              />
            </div>

            <Button type="submit" className="w-full gap-1.5" disabled={isPending}>
              <Plus className="w-4 h-4" />
              Add to List
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Item Card Component ─────────────────────────────────────────────────────

function ShoppingItemCard({
  item,
  onToggle,
  onDelete,
  isPending,
}: {
  item: IShoppingItem;
  onToggle: (item: IShoppingItem) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const catInfo = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[5];
  const Icon = catInfo.icon;
  const priorityInfo = PRIORITIES.find((p) => p.value === item.priority);

  return (
    <Card
      className={cn(
        "border-border/60 bg-card/80 hover:border-primary/30 transition-all",
        item.isPurchased && "opacity-60"
      )}
    >
      <CardContent className="p-3.5 flex items-center gap-3">
        {/* Toggle button */}
        <button
          onClick={() => onToggle(item)}
          disabled={isPending}
          className={cn(
            "shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
            item.isPurchased
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border hover:border-primary"
          )}
        >
          {item.isPurchased ? (
            <CheckCircle2 className="w-4.5 h-4.5" />
          ) : (
            <Circle className="w-4.5 h-4.5 text-muted-foreground" />
          )}
        </button>

        {/* Category Icon */}
        <div
          className={cn(
            "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
            catInfo.color
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-semibold text-foreground truncate",
              item.isPurchased && "line-through text-muted-foreground"
            )}
          >
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">{catInfo.label}</span>
            {priorityInfo && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border",
                    priorityInfo.color
                  )}
                >
                  {priorityInfo.label}
                </span>
              </>
            )}
            {item.estimatedPrice && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground font-medium">
                  ~{CURRENCY_SYMBOL}{item.estimatedPrice.toLocaleString("en-BD")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(item._id)}
          disabled={isPending}
          className="shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
