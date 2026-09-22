"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Transaction } from "@/lib/database/models/transaction.model";
import { Milestone } from "@/lib/database/models/milestone.model";
import { Project } from "@/lib/database/models/project.model";
import { TransactionSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getIncomeTransactions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const transactions = await Transaction.find({ userId, type: "income" })
    .populate("projectId", "name")
    .sort({ date: -1 })
    .lean();

  return JSON.parse(JSON.stringify(transactions));
}

export async function getUpcomingReceivables() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectToDatabase();

  const unpaidMilestones = await Milestone.find({
    userId,
    isPaid: false,
  })
    .populate("projectId", "name clientName")
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  return JSON.parse(JSON.stringify(unpaidMilestones));
}

export async function getIncomeStats() {
  const { userId } = await auth();
  if (!userId) return { thisMonthReceived: 0, thisMonthExpected: 0, totalAllTime: 0 };

  await connectToDatabase();

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const [thisMonthTx, unpaidMilestones, allTx] = await Promise.all([
    Transaction.find({
      userId,
      type: "income",
      status: "received",
      date: { $gte: mStart, $lte: mEnd },
    }).lean(),
    Milestone.find({
      userId,
      isPaid: false,
    }).lean(),
    Transaction.find({
      userId,
      type: "income",
      status: "received",
    }).lean(),
  ]);

  const thisMonthReceived = thisMonthTx.reduce((sum, t) => sum + (t.amount || 0), 0);
  const thisMonthExpected = unpaidMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalAllTime = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);

  return { thisMonthReceived, thisMonthExpected, totalAllTime };
}

export async function recordIncome(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = TransactionSchema.parse(rawInput);
  await connectToDatabase();

  const transaction = await Transaction.create({
    userId,
    ...validated,
    type: "income",
    date: new Date(validated.date),
  });

  revalidatePath("/");
  revalidatePath("/income");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(transaction));
}

export async function deleteIncome(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await Transaction.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/income");
  revalidatePath("/finance");

  return { success: true };
}
