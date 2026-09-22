"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Shopping } from "@/lib/database/models/shopping.model";
import { ShoppingSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";

export async function getShoppingItems(filters?: {
  month?: string;
  category?: string;
  purchased?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };

  if (filters?.month) {
    query.targetMonth = filters.month;
  }
  if (filters?.category && filters.category !== "all") {
    query.category = filters.category;
  }
  if (filters?.purchased !== undefined) {
    query.isPurchased = filters.purchased;
  }

  const items = await Shopping.find(query)
    .sort({ isPurchased: 1, priority: -1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

export async function createShoppingItem(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = ShoppingSchema.parse(rawInput);
  await connectToDatabase();

  const item = await Shopping.create({
    userId,
    ...validated,
  });

  revalidatePath("/");
  revalidatePath("/shopping");

  return JSON.parse(JSON.stringify(item));
}

export async function updateShoppingItem(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = ShoppingSchema.partial().parse(rawInput);
  await connectToDatabase();

  const item = await Shopping.findOneAndUpdate(
    { _id: id, userId },
    { $set: validated },
    { new: true }
  ).lean();

  if (!item) throw new Error("Item not found");

  revalidatePath("/");
  revalidatePath("/shopping");

  return JSON.parse(JSON.stringify(item));
}

export async function toggleShoppingPurchased(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const item = await Shopping.findOne({ _id: id, userId });
  if (!item) throw new Error("Item not found");

  const isNowPurchased = !item.isPurchased;
  item.isPurchased = isNowPurchased;
  item.purchasedAt = isNowPurchased ? new Date() : undefined;
  await item.save();

  revalidatePath("/");
  revalidatePath("/shopping");

  return JSON.parse(JSON.stringify(item));
}

export async function deleteShoppingItem(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();
  await Shopping.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/shopping");

  return { success: true };
}

export async function getShoppingStats(month?: string) {
  const { userId } = await auth();
  if (!userId)
    return {
      totalItems: 0,
      purchased: 0,
      pending: 0,
      estimatedTotal: 0,
      actualTotal: 0,
    };

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };
  if (month) query.targetMonth = month;

  const items = await Shopping.find(query).lean();

  const totalItems = items.length;
  const purchased = items.filter((i) => i.isPurchased).length;
  const pending = totalItems - purchased;
  const estimatedTotal = items.reduce(
    (s, i) => s + (i.estimatedPrice || 0),
    0
  );
  const actualTotal = items
    .filter((i) => i.isPurchased)
    .reduce((s, i) => s + (i.actualPrice || i.estimatedPrice || 0), 0);

  return { totalItems, purchased, pending, estimatedTotal, actualTotal };
}
