"use client";

import { useState, useEffect, useTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Repeat,
  Trash2,
  AlertCircle,
  Filter,
  CheckCircle2,
  Circle,
  Tag,
  Search,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  getTasks,
  createTask,
  toggleTaskComplete,
  deleteTask,
  getTodayTaskStats,
} from "@/lib/actions/task.actions";
import { ITask, PriorityLevel } from "@/types/habit";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  PriorityLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  p1: {
    label: "P1 Urgent",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  p2: {
    label: "P2 High",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  p3: {
    label: "P3 Normal",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  p4: {
    label: "P4 Low",
    color: "text-slate-400",
    bg: "bg-secondary",
    border: "border-border",
  },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [tab, setTab] = useState<"today" | "upcoming" | "overdue" | "completed" | "all">("today");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("p3");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueTime, setDueTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly" | "monthly">("daily");
  const [tagsInput, setTagsInput] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedTasks, fetchedStats] = await Promise.all([
        getTasks({ dueDate: tab, priority: priorityFilter }),
        getTodayTaskStats(),
      ]);
      setTasks(fetchedTasks);
      setStats(fetchedStats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, priorityFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a task title");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          isRecurring,
          recurringPattern: isRecurring ? recurringPattern : undefined,
          tags,
        });

        toast.success("Task created");
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setTagsInput("");
        loadData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to create task");
      }
    });
  };

  const handleToggle = async (task: ITask) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id
            ? { ...t, status: t.status === "completed" ? "todo" : "completed" }
            : t
        )
      );

      await toggleTaskComplete(task._id);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      await deleteTask(id);
      toast.success("Task deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete task");
      loadData();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks & Priorities</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize daily actions, habit loops, and project priorities.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-1.5 shadow-sm shadow-primary/25 h-9"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Today&apos;s Total</p>
          <p className="text-lg font-bold mt-0.5">{stats.total}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Completed</p>
          <p className="text-lg font-bold text-emerald-500 mt-0.5">{stats.completed}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-blue-500 mt-0.5">{stats.pending}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card/60">
          <p className="text-[11px] font-medium text-muted-foreground">Overdue</p>
          <p className="text-lg font-bold text-red-500 mt-0.5">{stats.overdue}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "today", label: "Today" },
            { id: "upcoming", label: "Upcoming" },
            { id: "overdue", label: "Overdue" },
            { id: "completed", label: "Completed" },
            { id: "all", label: "All" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                tab === item.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 text-xs w-[120px] rounded-lg">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="p1">P1 Urgent</SelectItem>
              <SelectItem value="p2">P2 High</SelectItem>
              <SelectItem value="p3">P3 Normal</SelectItem>
              <SelectItem value="p4">P4 Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No tasks found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {tab === "completed"
                ? "No completed tasks yet."
                : "Your task queue is clear. Click below to add a new task."}
            </p>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-xl text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Task
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === "completed";
            const priorityInfo = priorityConfig[task.priority] || priorityConfig.p3;

            return (
              <div
                key={task._id}
                className={cn(
                  "p-3.5 rounded-xl border border-border/70 bg-card/80 transition-all flex items-start justify-between gap-3 group hover:border-primary/40",
                  isCompleted && "opacity-60 bg-secondary/30"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={cn(
                          "text-xs font-semibold text-foreground break-words",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </h4>

                      {/* Priority Badge */}
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0",
                          priorityInfo.color,
                          priorityInfo.bg,
                          priorityInfo.border
                        )}
                      >
                        {priorityInfo.label}
                      </span>

                      {/* Recurring Badge */}
                      {task.isRecurring && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-purple-500 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">
                          <Repeat className="w-2.5 h-2.5" />
                          <span className="capitalize">{task.recurringPattern}</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata line: Due Date, Time, Tags */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                        </span>
                      )}

                      {task.dueTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueTime}</span>
                        </span>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {task.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 bg-secondary rounded text-[9px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task._id)}
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new actionable item to your command center.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Task Title *</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Review client proposal draft"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description / Notes</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, links, or bullet points..."
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">P1 Urgent</SelectItem>
                    <SelectItem value="p2">P2 High</SelectItem>
                    <SelectItem value="p3">P3 Normal</SelectItem>
                    <SelectItem value="p4">P4 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Due Time (Optional)</Label>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tags (comma separated)</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="dev, client, urgent"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Recurring Option */}
            <div className="p-3 rounded-xl border border-border/80 bg-secondary/30 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(!!checked)}
                />
                <label
                  htmlFor="recurring"
                  className="text-xs font-medium leading-none cursor-pointer flex items-center gap-1.5"
                >
                  <Repeat className="w-3.5 h-3.5 text-purple-500" />
                  <span>Recurring Task / Habit</span>
                </label>
              </div>

              {isRecurring && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Repeat Frequency</Label>
                  <Select
                    value={recurringPattern}
                    onValueChange={(v) => setRecurringPattern(v as any)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                {isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
