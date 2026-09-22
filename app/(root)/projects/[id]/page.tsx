"use client";

import { useState, useEffect, useTransition, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Coins,
  Trash2,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getProjectById,
  createMilestone,
  toggleMilestonePaid,
  deleteMilestone,
  deleteProject,
} from "@/lib/actions/project.actions";
import { IProject, IMilestone } from "@/types/habit";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [project, setProject] = useState<IProject | null>(null);
  const [milestones, setMilestones] = useState<IMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getProjectById(resolvedParams.id);
      setProject(data.project);
      setMilestones(data.milestones);
    } catch (err) {
      console.error(err);
      toast.error("Project not found");
      router.push("/projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Milestone title is required");

    startTransition(async () => {
      try {
        await createMilestone({
          projectId: resolvedParams.id,
          title: title.trim(),
          amount: Number(amount) || 0,
          dueDate: dueDate || undefined,
          isPaid,
        });

        toast.success("Milestone created");
        setMilestoneModalOpen(false);
        setTitle("");
        setAmount(0);
        setDueDate("");
        setIsPaid(false);
        loadData();
      } catch (err) {
        toast.error("Failed to create milestone");
      }
    });
  };

  const handleTogglePaid = async (milestone: IMilestone) => {
    try {
      await toggleMilestonePaid(milestone._id);
      toast.success(
        milestone.isPaid
          ? "Milestone marked unpaid"
          : `Payment received: ${CURRENCY_SYMBOL}${milestone.amount.toLocaleString()}`
      );
      loadData();
    } catch (err) {
      toast.error("Failed to update milestone status");
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await deleteMilestone(id);
      toast.success("Milestone removed");
      loadData();
    } catch (err) {
      toast.error("Failed to delete milestone");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this entire project and its milestones?"))
      return;
    try {
      await deleteProject(resolvedParams.id);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading || !project) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading project details...
      </div>
    );
  }

  const progressPercent =
    project.totalValue > 0
      ? Math.min(100, Math.round((project.paidAmount / project.totalValue) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteProject}
          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete Project
        </Button>
      </div>

      {/* Project Overview Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 uppercase">
                  {project.status.replace("_", " ")}
                </span>
              </div>
              {project.clientName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Client: {project.clientName}</span>
                </p>
              )}
            </div>

            {project.deadline && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {project.description}
            </p>
          )}

          {/* Financial Progress Bar */}
          <div className="p-4 rounded-xl border border-border/80 bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Milestone & Payment Progress
              </span>
              <span className="font-bold text-emerald-500">{progressPercent}% Paid</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Received: <strong className="text-emerald-500">{CURRENCY_SYMBOL}{project.paidAmount.toLocaleString()}</strong>
              </span>
              <span>
                Contract: <strong className="text-foreground">{CURRENCY_SYMBOL}{project.totalValue.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight">Milestones & Deliverables</h3>
            <p className="text-xs text-muted-foreground">
              Mark deliverables completed to instantly record cash received.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setMilestoneModalOpen(true)}
            className="rounded-xl gap-1 text-xs h-8 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </Button>
        </div>

        <div className="space-y-2.5">
          {milestones.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl border-border/80">
              <Coins className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">No milestones created yet.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMilestoneModalOpen(true)}
                className="mt-3 text-xs"
              >
                + Create First Milestone
              </Button>
            </div>
          ) : (
            milestones.map((m) => (
              <div
                key={m._id}
                className={cn(
                  "p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-4 transition-all group",
                  m.isPaid && "bg-secondary/20 border-emerald-500/30"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePaid(m)}
                    className="text-muted-foreground hover:text-emerald-500 transition-colors shrink-0"
                    title={m.isPaid ? "Mark Unpaid" : "Mark Paid"}
                  >
                    {m.isPaid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          "text-xs font-bold text-foreground truncate",
                          m.isPaid && "line-through text-muted-foreground"
                        )}
                      >
                        {m.title}
                      </h4>
                      {m.isPaid && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          Paid
                        </span>
                      )}
                    </div>
                    {m.dueDate && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Due {format(new Date(m.dueDate), "MMM d, yyyy")}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-foreground">
                      {CURRENCY_SYMBOL}{m.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.isPaid ? "Received" : "Pending"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMilestone(m._id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Milestone Modal */}
      <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription className="text-xs">
              Define a deliverable and its contract billing amount.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMilestone} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Milestone Title *</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 50% Upfront or Design Handoff"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount ({CURRENCY_SYMBOL})</Label>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="25000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="isPaid"
                checked={isPaid}
                onCheckedChange={(c) => setIsPaid(!!c)}
              />
              <label htmlFor="isPaid" className="text-xs font-medium cursor-pointer">
                Already received / paid upfront
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMilestoneModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending ? "Adding..." : "Save Milestone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
