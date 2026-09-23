"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Cpu,
  Plus,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Flame,
  Sparkles,
  Zap,
  Mail,
  Layers,
  ChevronRight,
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
import { Textarea } from "@/components/ui/textarea";
import {
  getAIAccounts,
  getAIAccountSummary,
  createAIAccount,
  markAccountExhausted,
  switchActiveAccount,
  resetAccountCooldown,
  deleteAIAccount,
} from "@/lib/actions/ai-account.actions";
import { IAIAccount, AIAccountTier, AIAccountStatus } from "@/types/habit";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const servicesList = [
  { id: "all", label: "All Services" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "cursor", label: "Cursor" },
  { id: "gemini", label: "Gemini" },
  { id: "perplexity", label: "Perplexity" },
  { id: "v0", label: "v0 by Vercel" },
];

const cooldownWindowOptions = [
  { value: 60, label: "1 Hour (60m)" },
  { value: 120, label: "2 Hours (120m)" },
  { value: 180, label: "3 Hours (180m - Standard ChatGPT/Claude)" },
  { value: 240, label: "4 Hours (240m)" },
  { value: 300, label: "5 Hours (300m - Claude Opus)" },
  { value: 1440, label: "24 Hours (Daily Reset)" },
  { value: 10080, label: "7 Days (Weekly Reset)" },
  { value: 43200, label: "1 Month (30-day Reset)" },
];

function formatCooldownDuration(totalMinutes: number) {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "0m";
}

function CooldownCountdown({ cooldownUntil }: { cooldownUntil?: string | Date }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!cooldownUntil) return;

    const updateTimer = () => {
      const target = new Date(cooldownUntil).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Ready to reset");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(days ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  if (!timeLeft) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-mono font-medium">
      <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "6s" }} />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function AIAccountsPage() {
  const [accounts, setAccounts] = useState<IAIAccount[]>([]);
  const [summary, setSummary] = useState({ total: 0, ready: 0, inUse: 0, coolingDown: 0 });
  const [activeService, setActiveService] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [service, setService] = useState("chatgpt");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<AIAccountTier>("pro");
  const [cooldownMinutes, setCooldownMinutes] = useState(180);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accs, sum] = await Promise.all([
        getAIAccounts(activeService),
        getAIAccountSummary(),
      ]);
      setAccounts(accs);
      setSummary(sum);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load AI accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeService]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please provide an account name");

    startTransition(async () => {
      try {
        await createAIAccount({
          service,
          name: name.trim(),
          email: email.trim() || undefined,
          tier,
          cooldownDurationMinutes: cooldownMinutes,
          notes: notes.trim() || undefined,
        });

        toast.success("AI Account registered");
        setModalOpen(false);
        setName("");
        setEmail("");
        setNotes("");
        loadData();
      } catch (err) {
        toast.error("Failed to create account");
      }
    });
  };

  const handleMarkExhausted = async (account: IAIAccount) => {
    try {
      await markAccountExhausted(account._id, account.cooldownDurationMinutes);
      toast.success(
        `${account.name} entered cooldown (${formatCooldownDuration(account.cooldownDurationMinutes)})`
      );
      loadData();
    } catch (err) {
      toast.error("Failed to mark exhausted");
    }
  };

  const handleUseNow = async (account: IAIAccount) => {
    try {
      await switchActiveAccount(account._id);
      toast.success(`Switched active account to ${account.name}`);
      loadData();
    } catch (err) {
      toast.error("Failed to switch account");
    }
  };

  const handleReset = async (account: IAIAccount) => {
    try {
      await resetAccountCooldown(account._id);
      toast.success(`${account.name} marked ready`);
      loadData();
    } catch (err) {
      toast.error("Failed to reset account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this AI account?")) return;
    try {
      setAccounts((prev) => prev.filter((a) => a._id !== id));
      await deleteAIAccount(id);
      toast.success("Account deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete account");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Accounts & Cooldown Queue</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rotate ChatGPT, Claude, Cursor & Gemini accounts seamlessly to avoid hitting rate limits.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-1.5 shadow-sm shadow-primary/25 h-9"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add AI Account</span>
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Total Accounts</p>
          <p className="text-xl font-bold mt-0.5">{summary.total}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Ready to Use</p>
          <p className="text-xl font-bold text-emerald-500 mt-0.5">{summary.ready}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Currently Active</p>
          <p className="text-xl font-bold text-blue-500 mt-0.5">{summary.inUse}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">In Cooldown</p>
          <p className="text-xl font-bold text-amber-500 mt-0.5">{summary.coolingDown}</p>
        </div>
      </div>

      {/* Service Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/60 pb-3">
        {servicesList.map((svc) => (
          <button
            key={svc.id}
            onClick={() => setActiveService(svc.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
              activeService === svc.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            {svc.label}
          </button>
        ))}
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            Loading accounts & cooldowns...
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed rounded-2xl border-border/80">
            <Cpu className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No AI accounts found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Add multiple ChatGPT, Claude or Cursor accounts to automatically rotate quotas and manage cooldowns.
            </p>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-xl text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Account
            </Button>
          </div>
        ) : (
          accounts.map((acc) => {
            const isCooling = acc.status === "cooling_down";
            const isInUse = acc.status === "in_use";
            const isReady = acc.status === "ready";

            return (
              <Card
                key={acc._id}
                className={cn(
                  "relative border transition-all overflow-hidden",
                  isInUse && "border-blue-500/60 shadow-md shadow-blue-500/10",
                  isCooling && "border-amber-500/50 bg-amber-500/5",
                  isReady && "border-border/80 hover:border-emerald-500/50"
                )}
              >
                <CardContent className="p-4 space-y-3.5">
                  {/* Header: Service + Name + Tier */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0",
                          acc.service === "chatgpt" && "bg-emerald-500/15 text-emerald-500",
                          acc.service === "claude" && "bg-orange-500/15 text-orange-500",
                          acc.service === "cursor" && "bg-blue-500/15 text-blue-500",
                          acc.service === "gemini" && "bg-purple-500/15 text-purple-500",
                          !["chatgpt", "claude", "cursor", "gemini"].includes(acc.service) &&
                            "bg-secondary text-foreground"
                        )}
                      >
                        {acc.service.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {acc.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="uppercase font-semibold text-[10px]">
                            {acc.service}
                          </span>
                          <span>&middot;</span>
                          <span className="capitalize font-medium">{acc.tier}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isInUse && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 animate-pulse">
                        <Zap className="w-3 h-3" />
                        Active
                      </span>
                    )}

                    {isReady && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                      </span>
                    )}

                    {isCooling && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                        <Clock className="w-3 h-3" />
                        Cooldown
                      </span>
                    )}
                  </div>

                  {/* Email & Notes */}
                  {acc.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-muted-foreground/70" />
                      <span>{acc.email}</span>
                    </p>
                  )}

                  {/* Cooldown Timer */}
                  {isCooling && acc.cooldownUntil && (
                    <div className="p-2.5 rounded-xl bg-card border border-amber-500/20 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Reset In:</span>
                      <CooldownCountdown cooldownUntil={acc.cooldownUntil} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2">
                    <div className="flex items-center gap-1.5">
                      {isReady && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseNow(acc)}
                          className="h-8 text-xs font-semibold rounded-lg hover:border-primary"
                        >
                          <Play className="w-3 h-3 mr-1 fill-current" />
                          Use Now
                        </Button>
                      )}

                      {isInUse && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleMarkExhausted(acc)}
                          className="h-8 text-xs font-semibold rounded-lg"
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          Mark Limit Reached
                        </Button>
                      )}

                      {isCooling && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReset(acc)}
                          className="h-8 text-xs font-semibold rounded-lg"
                        >
                          <RotateCw className="w-3 h-3 mr-1" />
                          Force Ready
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(acc._id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Registration Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register AI Account</DialogTitle>
            <DialogDescription className="text-xs">
              Add account details for rotation tracking and quota cooldowns.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">AI Service</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                    <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                    <SelectItem value="cursor">Cursor AI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                    <SelectItem value="v0">v0 by Vercel</SelectItem>
                    <SelectItem value="other">Other Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tier</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as AIAccountTier)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="api">API Payg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account Label / Identifier *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Personal Pro #1 or Work Team"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Login Email (Optional reference)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cooldown Window (Minutes after limit)</Label>
              <Select
                value={String(cooldownMinutes)}
                onValueChange={(v) => setCooldownMinutes(Number(v))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cooldownWindowOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Limits / Key instructions</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 45 messages per 5 hours window..."
                className="text-xs min-h-[60px]"
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
                {isPending ? "Saving..." : "Save Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
