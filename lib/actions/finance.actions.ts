"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Transaction } from "@/lib/database/models/transaction.model";
import { Investment } from "@/lib/database/models/investment.model";
import { Loan } from "@/lib/database/models/loan.model";
import { TransactionSchema, InvestmentSchema, LoanSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

// ───────────────── EXPENSES ─────────────────

export async function getExpenses(month?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId, type: "expense" };

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }

  const expenses = await Transaction.find(query)
    .sort({ date: -1 })
    .lean();

  return JSON.parse(JSON.stringify(expenses));
}

export async function createExpense(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = TransactionSchema.parse(rawInput);
  await connectToDatabase();

  const expense = await Transaction.create({
    userId,
    ...validated,
    type: "expense",
    status: "paid",
    date: new Date(validated.date),
  });

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(expense));
}

export async function deleteExpense(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();
  await Transaction.deleteOne({ _id: id, userId, type: "expense" });

  revalidatePath("/");
  revalidatePath("/finance");

  return { success: true };
}

export async function getExpenseStats() {
  const { userId } = await auth();
  if (!userId)
    return { thisMonthTotal: 0, lastMonthTotal: 0, byCategory: [] };

  await connectToDatabase();

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [thisMonth, lastMonth] = await Promise.all([
    Transaction.find({
      userId,
      type: "expense",
      date: { $gte: mStart, $lte: mEnd },
    }).lean(),
    Transaction.find({
      userId,
      type: "expense",
      date: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }).lean(),
  ]);

  const thisMonthTotal = thisMonth.reduce((s, t) => s + (t.amount || 0), 0);
  const lastMonthTotal = lastMonth.reduce((s, t) => s + (t.amount || 0), 0);

  // Group by category
  const catMap: Record<string, number> = {};
  thisMonth.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + (t.amount || 0);
  });
  const byCategory = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { thisMonthTotal, lastMonthTotal, byCategory };
}

// ───────────────── INVESTMENTS ─────────────────

export async function getInvestments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const investments = await Investment.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(investments));
}

export async function createInvestment(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = InvestmentSchema.parse(rawInput);
  await connectToDatabase();

  const investment = await Investment.create({
    userId,
    ...validated,
    startDate: new Date(validated.startDate),
  });

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(investment));
}

export async function updateInvestment(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = InvestmentSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.startDate) updateData.startDate = new Date(validated.startDate);

  const investment = await Investment.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!investment) throw new Error("Investment not found");

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(investment));
}

export async function deleteInvestment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();
  await Investment.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/finance");

  return { success: true };
}

export async function getInvestmentStats() {
  const { userId } = await auth();
  if (!userId) return { totalInvested: 0, currentValue: 0, portfolioCount: 0 };

  await connectToDatabase();
  const investments = await Investment.find({ userId }).lean();

  const totalInvested = investments.reduce((s, i) => s + (i.amountInvested || 0), 0);
  const currentValue = investments.reduce(
    (s, i) => s + (i.currentValue ?? i.amountInvested ?? 0),
    0
  );

  return { totalInvested, currentValue, portfolioCount: investments.length };
}

// ───────────────── LOANS ─────────────────

export async function getLoans(status?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };
  if (status && status !== "all") query.status = status;

  const loans = await Loan.find(query)
    .sort({ status: 1, dueDate: 1, updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(loans));
}

export async function createLoan(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = LoanSchema.parse(rawInput);
  await connectToDatabase();

  const loan = await Loan.create({
    userId,
    ...validated,
    dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
  });

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(loan));
}

export async function updateLoan(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = LoanSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.dueDate !== undefined) {
    updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
  }

  const loan = await Loan.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!loan) throw new Error("Loan not found");

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(loan));
}

export async function settleLoan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const loan = await Loan.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "settled", remainingAmount: 0 } },
    { new: true }
  ).lean();

  if (!loan) throw new Error("Loan not found");

  revalidatePath("/");
  revalidatePath("/finance");

  return JSON.parse(JSON.stringify(loan));
}

export async function deleteLoan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();
  await Loan.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/finance");

  return { success: true };
}

export async function getLoanStats() {
  const { userId } = await auth();
  if (!userId) return { totalLent: 0, totalBorrowed: 0, activeCount: 0 };

  await connectToDatabase();
  const loans = await Loan.find({ userId, status: { $ne: "settled" } }).lean();

  const totalLent = loans
    .filter((l) => l.type === "lent")
    .reduce((s, l) => s + (l.remainingAmount || 0), 0);
  const totalBorrowed = loans
    .filter((l) => l.type === "borrowed")
    .reduce((s, l) => s + (l.remainingAmount || 0), 0);

  return { totalLent, totalBorrowed, activeCount: loans.length };
}

// ───────────────── FINANCE OVERVIEW ─────────────────

export async function getFinanceOverview() {
  const { userId } = await auth();
  if (!userId)
    return {
      expenseStats: { thisMonthTotal: 0, lastMonthTotal: 0, byCategory: [] },
      investmentStats: { totalInvested: 0, currentValue: 0, portfolioCount: 0 },
      loanStats: { totalLent: 0, totalBorrowed: 0, activeCount: 0 },
    };

  const [expenseStats, investmentStats, loanStats] = await Promise.all([
    getExpenseStats(),
    getInvestmentStats(),
    getLoanStats(),
  ]);

  return { expenseStats, investmentStats, loanStats };
}
