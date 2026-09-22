"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Task } from "@/lib/database/models/task.model";
import { TaskSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, startOfDay, endOfDay } from "date-fns";

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  dueDate?: string; // "today", "upcoming", "all", "completed", "overdue"
  projectId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };

  if (filters?.priority && filters.priority !== "all") {
    query.priority = filters.priority;
  }

  if (filters?.projectId) {
    query.projectId = filters.projectId;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (filters?.dueDate === "today") {
    query.dueDate = { $gte: todayStart, $lte: todayEnd };
    query.status = { $ne: "completed" };
  } else if (filters?.dueDate === "upcoming") {
    query.dueDate = { $gt: todayEnd };
    query.status = { $ne: "completed" };
  } else if (filters?.dueDate === "overdue") {
    query.dueDate = { $lt: todayStart };
    query.status = { $ne: "completed" };
  } else if (filters?.dueDate === "completed" || filters?.status === "completed") {
    query.status = "completed";
  } else if (filters?.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const tasks = await Task.find(query)
    .sort({ priority: 1, dueDate: 1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(tasks));
}

export async function getTodayTaskStats() {
  const { userId } = await auth();
  if (!userId) return { total: 0, completed: 0, pending: 0, overdue: 0 };

  await connectToDatabase();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [todayTasks, overdueCount] = await Promise.all([
    Task.find({
      userId,
      $or: [
        { dueDate: { $gte: todayStart, $lte: todayEnd } },
        { completedAt: { $gte: todayStart, $lte: todayEnd } },
      ],
    }).lean(),
    Task.countDocuments({
      userId,
      status: { $nin: ["completed", "cancelled"] },
      dueDate: { $lt: todayStart },
    }),
  ]);

  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;

  return { total, completed, pending, overdue: overdueCount };
}

export async function createTask(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = TaskSchema.parse(rawInput);
  await connectToDatabase();

  const task = await Task.create({
    userId,
    ...validated,
    dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
  });

  revalidatePath("/");
  revalidatePath("/tasks");

  return JSON.parse(JSON.stringify(task));
}

export async function updateTask(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = TaskSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.dueDate !== undefined) {
    updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!task) throw new Error("Task not found");

  revalidatePath("/");
  revalidatePath("/tasks");

  return JSON.parse(JSON.stringify(task));
}

export async function toggleTaskComplete(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const task = await Task.findOne({ _id: id, userId });
  if (!task) throw new Error("Task not found");

  const isNowCompleted = task.status !== "completed";
  task.status = isNowCompleted ? "completed" : "todo";
  task.completedAt = isNowCompleted ? new Date() : undefined;
  await task.save();

  // If completing a recurring task, schedule the next iteration!
  if (isNowCompleted && task.isRecurring && task.dueDate) {
    let nextDueDate: Date | null = null;
    const currentDue = new Date(task.dueDate);

    switch (task.recurringPattern) {
      case "daily":
        nextDueDate = addDays(currentDue, 1);
        break;
      case "weekly":
        nextDueDate = addWeeks(currentDue, 1);
        break;
      case "monthly":
        nextDueDate = addMonths(currentDue, 1);
        break;
      default:
        nextDueDate = addDays(currentDue, 1);
        break;
    }

    if (nextDueDate) {
      await Task.create({
        userId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: "todo",
        dueDate: nextDueDate,
        dueTime: task.dueTime,
        isRecurring: true,
        recurringPattern: task.recurringPattern,
        recurringDays: task.recurringDays,
        tags: task.tags,
        projectId: task.projectId,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");

  return JSON.parse(JSON.stringify(task));
}

export async function deleteTask(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await Task.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/tasks");

  return { success: true };
}
