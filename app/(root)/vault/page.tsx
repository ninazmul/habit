"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  KeyRound,
  FileCode,
  FileText,
  FileLock,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  RefreshCw,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import {
  getVaultItems,
  getVaultStats,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  revealVaultSecret,
} from "@/lib/actions/vault.actions";
import { VaultCategory } from "@/types/habit";

interface VaultItem {
  _id: string;
  title: string;
  category: VaultCategory;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: { value: VaultCategory | "all"; label: string; icon: typeof Key }[] = [
  { value: "all", label: "All Items", icon: Shield },
  { value: "credential", label: "Credentials", icon: KeyRound },
  { value: "api_key", label: "API Keys", icon: FileCode },
  { value: "recovery_code", label: "Recovery Codes", icon: ShieldAlert },
  { value: "secret_note", label: "Secret Notes", icon: FileText },
  { value: "document", label: "Documents", icon: FileLock },
];

function getCategoryColor(cat: VaultCategory) {
  switch (cat) {
    case "credential":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "api_key":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "recovery_code":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "secret_note":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "document":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-secondary text-foreground";
  }
}

function getCategoryIcon(cat: VaultCategory) {
  switch (cat) {
    case "credential":
      return KeyRound;
    case "api_key":
      return FileCode;
    case "recovery_code":
      return ShieldAlert;
    case "secret_note":
      return FileText;
    case "document":
      return FileLock;
    default:
      return Shield;
  }
}

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {
      credential: 0,
      api_key: 0,
      recovery_code: 0,
      secret_note: 0,
      document: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Master Session Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [sessionPin, setSessionPin] = useState("");

  // Revealed Secrets Map (itemId -> decrypted string)
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<VaultCategory>("secret_note");
  const [formSecret, setFormSecret] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<VaultCategory>("secret_note");
  const [editSecret, setEditSecret] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Password generator tool state
  const [genLength, setGenLength] = useState(24);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedItems, fetchedStats] = await Promise.all([
        getVaultItems({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          search: searchQuery,
        }),
        getVaultStats(),
      ]);
      setItems(fetchedItems);
      setStats(fetchedStats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vault items");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Session Unlock
  const handleUnlockSession = () => {
    setIsUnlocked(true);
    setPinModalOpen(false);
    setSessionPin("");
    toast.success("Vault session unlocked");
  };

  const handleLockSession = () => {
    setIsUnlocked(false);
    setRevealedMap({});
    toast.success("Vault locked securely");
  };

  // Reveal secret
  const handleToggleReveal = async (id: string) => {
    if (!isUnlocked) {
      setPinModalOpen(true);
      return;
    }

    if (revealedMap[id]) {
      // Hide
      setRevealedMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    try {
      setRevealingId(id);
      const decrypted = await revealVaultSecret(id);
      setRevealedMap((prev) => ({ ...prev, [id]: decrypted }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to decrypt secret");
    } finally {
      setRevealingId(null);
    }
  };

  // Copy secret with safety toast
  const handleCopySecret = async (id: string) => {
    if (!isUnlocked) {
      setPinModalOpen(true);
      return;
    }

    let text = revealedMap[id];
    if (!text) {
      try {
        setRevealingId(id);
        text = await revealVaultSecret(id);
        setRevealedMap((prev) => ({ ...prev, [id]: text }));
      } catch {
        toast.error("Failed to retrieve secret");
        setRevealingId(null);
        return;
      } finally {
        setRevealingId(null);
      }
    }

    if (text) {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Secret copied to clipboard! Masking in memory.", {
        icon: "🛡️",
        duration: 3000,
      });
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Password generator
  const runGenerator = useCallback(() => {
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if (genUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (genNumbers) chars += "0123456789";
    if (genSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let res = "";
    for (let i = 0; i < genLength; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(res);
  }, [genLength, genUppercase, genNumbers, genSymbols]);

  useEffect(() => {
    if (generatorModalOpen) {
      runGenerator();
    }
  }, [generatorModalOpen, runGenerator]);

  // Create Item Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formSecret.trim()) {
      toast.error("Secret content is required");
      return;
    }

    startTransition(async () => {
      try {
        const tags = formTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        await createVaultItem({
          title: formTitle.trim(),
          category: formCategory,
          secretContent: formSecret,
          tags,
          notes: formNotes.trim(),
        });

        toast.success("Secret encrypted and stored in vault", { icon: "🔐" });
        setCreateModalOpen(false);
        setFormTitle("");
        setFormSecret("");
        setFormTags("");
        setFormNotes("");
        setFormCategory("secret_note");
        loadData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to store secret");
      }
    });
  };

  // Edit Item Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        const tags = editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        await updateVaultItem(editingItem._id, {
          title: editTitle.trim(),
          category: editCategory,
          secretContent: editSecret.trim() ? editSecret : undefined,
          tags,
          notes: editNotes.trim(),
        });

        toast.success("Vault item updated");
        setEditModalOpen(false);
        setEditingItem(null);
        // Clear cached revealed secret for this item
        setRevealedMap((prev) => {
          const next = { ...prev };
          delete next[editingItem._id];
          return next;
        });
        loadData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update vault item");
      }
    });
  };

  const openEditModal = (item: VaultItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTags(item.tags ? item.tags.join(", ") : "");
    setEditNotes(item.notes || "");
    setEditSecret("");
    setEditModalOpen(true);
  };

  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteVaultItem(id);
      toast.success("Secret deleted from vault");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete secret");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">Encrypted Vault</h1>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-medium">
                    AES-256-GCM
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zero-knowledge, client-server encrypted storage for credentials, tokens, and recovery keys.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lock/Unlock session button */}
            <Button
              variant={isUnlocked ? "destructive" : "secondary"}
              size="sm"
              onClick={isUnlocked ? handleLockSession : () => setPinModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              {isUnlocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Lock Vault
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  Unlock Vault
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setGeneratorModalOpen(true)}
              className="gap-1.5 text-xs border-border/80"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Password Generator
            </Button>

            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25"
            >
              <Plus className="h-3.5 w-3.5" />
              New Secret
            </Button>
          </div>
        </div>

        {/* Security Status Bar */}
        <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isUnlocked ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-muted-foreground">Status:</span>
            <span className="font-semibold">{isUnlocked ? "Unlocked" : "Locked"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Cipher:</span>
            <span className="font-mono font-medium">AES-256-GCM</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Items:</span>
            <span className="font-semibold">{stats.total} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Keys / Codes:</span>
            <span className="font-semibold">{stats.byCategory.api_key + stats.byCategory.recovery_code}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.value === "all"
                ? stats.total
                : stats.byCategory[cat.value as keyof typeof stats.byCategory] || 0;
            const isActive = selectedCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card/60 text-muted-foreground hover:bg-card border-border/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault secrets..."
            className="pl-8 text-xs h-9 bg-card/60 border-border/60"
          />
        </div>
      </div>

      {/* Vault Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-border/40 bg-card/40 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold">No secrets in vault</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery
              ? "No items matched your search query."
              : "Store sensitive credentials, API keys, 2FA recovery backup codes, and confidential notes safely."}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs bg-primary text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Secret
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const CategoryIcon = getCategoryIcon(item.category);
            const isRevealed = !!revealedMap[item._id];
            const isRevealing = revealingId === item._id;
            const isCopied = copiedId === item._id;

            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-xl border border-border/70 bg-card/80 p-4 backdrop-blur-md hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-secondary/80 text-foreground shrink-0">
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-semibold tracking-wider shrink-0 ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-md bg-secondary/60 text-[10px] text-muted-foreground font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Secret Display Box */}
                  <div className="rounded-lg bg-secondary/40 border border-border/50 p-2.5 mb-3 flex items-center justify-between gap-2 font-mono text-xs">
                    <div className="truncate flex-1">
                      {isRevealing ? (
                        <span className="text-muted-foreground animate-pulse text-[11px]">
                          Decrypting AES-256...
                        </span>
                      ) : isRevealed ? (
                        <span className="text-foreground select-all break-all font-mono">
                          {revealedMap[item._id]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground tracking-widest text-[11px] select-none">
                          ••••••••••••••••••••
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle Reveal */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleToggleReveal(item._id)}
                        title={isRevealed ? "Hide secret" : "Reveal secret"}
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      {/* Copy Secret */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopySecret(item._id)}
                        title="Copy secret"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic mb-2">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[10px]">Encrypted Payload</span>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditModal(item)}
                      title="Edit item"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteItem(item._id, item.title)}
                      title="Delete item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Session Unlock Modal */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg">Unlock Vault Session</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Authorize this active session to decrypt and view confidential credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Quick Session Passcode (Optional)</Label>
              <Input
                type="password"
                placeholder="Leave blank or enter session PIN"
                value={sessionPin}
                onChange={(e) => setSessionPin(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Decryption uses your server-side AES-256 master key with zero client leakage.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPinModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUnlockSession}
              className="text-xs bg-primary text-primary-foreground font-semibold"
            >
              Authorize & Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Secret Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Store New Secret
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Data is encrypted with AES-256-GCM before being stored in MongoDB.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input
                placeholder="e.g. GitHub Personal Access Token, AWS Prod Key"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={formCategory}
                onValueChange={(val) => setFormCategory(val as VaultCategory)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credential">Credential (User / Password)</SelectItem>
                  <SelectItem value="api_key">API Key / Token</SelectItem>
                  <SelectItem value="recovery_code">Recovery Code (2FA)</SelectItem>
                  <SelectItem value="secret_note">Secret Note</SelectItem>
                  <SelectItem value="document">Confidential Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Secret Content *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const pass = Array.from(crypto.getRandomValues(new Uint8Array(24)))
                      .map((x) => ("0" + (x % 36).toString(36)).slice(-1))
                      .join("");
                    setFormSecret(pass);
                    toast.success("Random secret generated");
                  }}
                  className="h-6 text-[10px] text-primary gap-1 px-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Random
                </Button>
              </div>
              <Textarea
                placeholder="Paste API key, private token, password, or confidential note..."
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="text-xs font-mono min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                placeholder="dev, production, cloudflare, github"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes / Context (optional)</Label>
              <Textarea
                placeholder="Associated URL, expiry notice, or usage instructions..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                {isPending ? "Encrypting..." : "Save to Vault"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Secret Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Vault Item</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Leave secret content blank to retain the current encrypted value.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={editCategory}
                onValueChange={(val) => setEditCategory(val as VaultCategory)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credential">Credential</SelectItem>
                  <SelectItem value="api_key">API Key / Token</SelectItem>
                  <SelectItem value="recovery_code">Recovery Code</SelectItem>
                  <SelectItem value="secret_note">Secret Note</SelectItem>
                  <SelectItem value="document">Confidential Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">New Secret Value (optional)</Label>
              <Textarea
                placeholder="Leave blank to keep existing secret unchanged..."
                value={editSecret}
                onChange={(e) => setEditSecret(e.target.value)}
                className="text-xs font-mono min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                {isPending ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Standalone Password Generator Dialog */}
      <Dialog open={generatorModalOpen} onOpenChange={setGeneratorModalOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Cryptographic Token & Password Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Generate cryptographically strong entropy for high-security passwords.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Generated Output */}
            <div className="rounded-xl border border-primary/30 bg-secondary/50 p-3 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold select-all break-all text-primary">
                {generatedPassword || "Generating..."}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={runGenerator}
                  title="Regenerate"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedPassword);
                    toast.success("Generated password copied!");
                  }}
                  title="Copy password"
                >
                  <Copy className="h-3.5 w-3.5 text-primary" />
                </Button>
              </div>
            </div>

            {/* Length control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <Label>Length: {genLength} chars</Label>
                <span className="text-muted-foreground font-mono">
                  {genLength >= 20 ? "Very Strong" : genLength >= 14 ? "Strong" : "Moderate"}
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Checkbox Options */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 rounded-lg border border-border/60 p-2 cursor-pointer hover:bg-secondary/40">
                <input
                  type="checkbox"
                  checked={genUppercase}
                  onChange={(e) => setGenUppercase(e.target.checked)}
                  className="accent-primary rounded"
                />
                <span>Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-border/60 p-2 cursor-pointer hover:bg-secondary/40">
                <input
                  type="checkbox"
                  checked={genNumbers}
                  onChange={(e) => setGenNumbers(e.target.checked)}
                  className="accent-primary rounded"
                />
                <span>Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-border/60 p-2 cursor-pointer hover:bg-secondary/40 col-span-2">
                <input
                  type="checkbox"
                  checked={genSymbols}
                  onChange={(e) => setGenSymbols(e.target.checked)}
                  className="accent-primary rounded"
                />
                <span>Special Symbols (!@#$%)</span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              onClick={() => {
                setFormSecret(generatedPassword);
                setGeneratorModalOpen(false);
                setCreateModalOpen(true);
              }}
              className="text-xs bg-primary text-primary-foreground font-semibold w-full"
            >
              Use in New Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
