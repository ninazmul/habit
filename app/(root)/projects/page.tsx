"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  User,
  Tag,
  AlertCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getProjects,
  getProjectStats,
  createProject,
} from "@/lib/actions/project.actions";
import { IProject, ProjectStatus } from "@/types/habit";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  lead: {
    label: "Lead",
    color: "text-slate-400",
    bg: "bg-secondary",
    border: "border-border",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  review: {
    label: "Review",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  on_hold: {
    label: "On Hold",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalPipeline: 0,
    totalReceived: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("in_progress");
  const [totalValue, setTotalValue] = useState<number>(0);
  const [deadline, setDeadline] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projs, st] = await Promise.all([
        getProjects(statusFilter),
        getProjectStats(),
      ]);
      setProjects(projs);
      setStats(st);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter project name");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        await createProject({
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          description: description.trim() || undefined,
          status,
          totalValue: Number(totalValue) || 0,
          deadline: deadline || undefined,
          tags,
        });

        toast.success("Project created");
        setModalOpen(false);
        setName("");
        setClientName("");
        setDescription("");
        setTotalValue(0);
        setDeadline("");
        setTagsInput("");
        loadData();
      } catch (err) {
        toast.error("Failed to create project");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects & Deliverables</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage client engagements, deliverables, milestones, and cashflow.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-1.5 shadow-sm shadow-primary/25 h-9"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Active Projects</p>
          <p className="text-xl font-bold mt-0.5 text-blue-500">{stats.activeProjects}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Total Projects</p>
          <p className="text-xl font-bold mt-0.5">{stats.totalProjects}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Total Pipeline</p>
          <p className="text-xl font-bold mt-0.5">
            {CURRENCY_SYMBOL}{stats.totalPipeline.toLocaleString()}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Received Value</p>
          <p className="text-xl font-bold text-emerald-500 mt-0.5">
            {CURRENCY_SYMBOL}{stats.totalReceived.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/60 pb-3">
        {[
          { id: "all", label: "All Projects" },
          { id: "in_progress", label: "In Progress" },
          { id: "review", label: "In Review" },
          { id: "completed", label: "Completed" },
          { id: "lead", label: "Leads" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
              statusFilter === tab.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed rounded-2xl border-border/80">
            <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Create a project to start tracking milestones, client deadlines, and payments.
            </p>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-xl text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Project
            </Button>
          </div>
        ) : (
          projects.map((proj) => {
            const stInfo = statusConfig[proj.status] || statusConfig.in_progress;
            const progressPercent =
              proj.totalValue > 0
                ? Math.min(100, Math.round((proj.paidAmount / proj.totalValue) * 100))
                : 0;

            return (
              <Link key={proj._id} href={`/projects/${proj._id}`} className="block group">
                <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md h-full flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {proj.name}
                        </h4>
                        {proj.clientName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            <span className="truncate">{proj.clientName}</span>
                          </p>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase",
                          stInfo.color,
                          stInfo.bg,
                          stInfo.border
                        )}
                      >
                        {stInfo.label}
                      </span>
                    </div>

                    {/* Financial Progress Meter */}
                    <div className="space-y-1.5 bg-secondary/30 p-3 rounded-xl border border-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Financial Progress</span>
                        <span className="font-bold text-foreground">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>
                          Paid: <strong className="text-foreground">{CURRENCY_SYMBOL}{proj.paidAmount.toLocaleString()}</strong>
                        </span>
                        <span>
                          Total: <strong className="text-foreground">{CURRENCY_SYMBOL}{proj.totalValue.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Footer / Deadline & Tags */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                      {proj.deadline ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          <span>Due {format(new Date(proj.deadline), "MMM d, yyyy")}</span>
                        </span>
                      ) : (
                        <span>No deadline set</span>
                      )}

                      <div className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Milestones</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription className="text-xs">
              Track project deliverables, milestones, and client financials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Name *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., E-Commerce Mobile App MVP"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Client Name / Org</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Total Contract Value ({CURRENCY_SYMBOL})</Label>
                <Input
                  type="number"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(Number(e.target.value))}
                  placeholder="50000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Deadline</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope, deliverables, key technology stack..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma separated)</Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="web, mobile, freelance, saas"
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
                {isPending ? "Creating..." : "Save Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
