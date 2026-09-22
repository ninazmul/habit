"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Task } from "@/lib/database/models/task.model";
import { Event } from "@/lib/database/models/event.model";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { Loan } from "@/lib/database/models/loan.model";
import { Shopping } from "@/lib/database/models/shopping.model";

export interface HabitAlert {
  id: string;
  type: "overdue_task" | "upcoming_event" | "ai_ready" | "loan_due" | "shopping_priority";
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
  href: string;
  timestamp: string;
}

export async function getSystemAlerts(): Promise<HabitAlert[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();
  const alerts: HabitAlert[] = [];
  const now = new Date();

  // 1. Check Overdue Tasks
  const overdueTasks = await Task.find({
    userId,
    status: { $nin: ["completed", "cancelled"] },
    dueDate: { $lt: now.toISOString().split("T")[0] },
  })
    .limit(5)
    .lean();

  overdueTasks.forEach((t) => {
    alerts.push({
      id: `task-${t._id}`,
      type: "overdue_task",
      title: "Task Overdue",
      message: `"${t.title}" was due on ${t.dueDate}`,
      severity: "urgent",
      href: "/tasks",
      timestamp: t.updatedAt?.toISOString() || now.toISOString(),
    });
  });

  // 2. Check Upcoming Events (Next 24 Hours)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingEvents = await Event.find({
    userId,
    isCompleted: false,
    startDateTime: { $gte: now, $lte: tomorrow },
  })
    .sort({ startDateTime: 1 })
    .limit(5)
    .lean();

  upcomingEvents.forEach((ev) => {
    alerts.push({
      id: `event-${ev._id}`,
      type: "upcoming_event",
      title: "Upcoming Event",
      message: `${ev.title} at ${new Date(ev.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      severity: "warning",
      href: "/schedule",
      timestamp: new Date(ev.startDateTime).toISOString(),
    });
  });

  // 3. Check AI Accounts in Cooldown that are Ready to Reset
  const coolingDownAccounts = await AIAccount.find({
    userId,
    status: "cooling_down",
  }).lean();

  coolingDownAccounts.forEach((acc) => {
    if (acc.quotaResetTime && new Date(acc.quotaResetTime) <= now) {
      alerts.push({
        id: `ai-${acc._id}`,
        type: "ai_ready",
        title: "AI Cooldown Expired",
        message: `${acc.service} (${acc.name}) is cooled down and ready to use.`,
        severity: "info",
        href: "/ai-accounts",
        timestamp: now.toISOString(),
      });
    }
  });

  // 4. Check Active Loans with Due Dates Soon
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const dueLoans = await Loan.find({
    userId,
    status: { $in: ["active", "partially_paid"] },
    dueDate: { $lte: sevenDaysFromNow },
  })
    .limit(3)
    .lean();

  dueLoans.forEach((loan) => {
    alerts.push({
      id: `loan-${loan._id}`,
      type: "loan_due",
      title: "Loan Due Soon",
      message: `${loan.type === "borrowed" ? "Repay" : "Collect"} ৳${loan.remainingAmount} with ${loan.counterparty}`,
      severity: "warning",
      href: "/finance",
      timestamp: now.toISOString(),
    });
  });

  // 5. High Priority Pending Shopping Items
  const urgentShopping = await Shopping.find({
    userId,
    isPurchased: false,
    priority: "high",
  })
    .limit(3)
    .lean();

  urgentShopping.forEach((shop) => {
    alerts.push({
      id: `shop-${shop._id}`,
      type: "shopping_priority",
      title: "High Priority Shopping",
      message: `"${shop.title}" is pending purchase`,
      severity: "info",
      href: "/shopping",
      timestamp: now.toISOString(),
    });
  });

  return alerts;
}
