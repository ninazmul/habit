"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { AIAccountSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";

export async function getAIAccounts(service?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const now = new Date();

  // Auto-recover any accounts whose cooldown expired
  await AIAccount.updateMany(
    {
      userId,
      status: "cooling_down",
      cooldownUntil: { $lte: now },
    },
    {
      $set: {
        status: "ready",
        cooldownUntil: null,
      },
    }
  );

  const query: Record<string, unknown> = { userId };
  if (service && service !== "all") {
    query.service = service.toLowerCase();
  }

  const accounts = await AIAccount.find(query)
    .sort({ order: 1, service: 1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(accounts));
}

export async function getAIAccountSummary() {
  const { userId } = await auth();
  if (!userId) return { total: 0, ready: 0, inUse: 0, coolingDown: 0 };

  await connectToDatabase();

  const now = new Date();

  // Auto-recover expired cooldowns
  await AIAccount.updateMany(
    {
      userId,
      status: "cooling_down",
      cooldownUntil: { $lte: now },
    },
    {
      $set: {
        status: "ready",
        cooldownUntil: null,
      },
    }
  );

  const accounts = await AIAccount.find({ userId }).lean();

  const total = accounts.length;
  const ready = accounts.filter((a) => a.status === "ready").length;
  const inUse = accounts.filter((a) => a.status === "in_use").length;
  const coolingDown = accounts.filter((a) => a.status === "cooling_down").length;

  return { total, ready, inUse, coolingDown };
}

export async function createAIAccount(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = AIAccountSchema.parse(rawInput);
  await connectToDatabase();

  const account = await AIAccount.create({
    userId,
    ...validated,
    service: validated.service.toLowerCase(),
  });

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function updateAIAccount(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = AIAccountSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.service) {
    updateData.service = validated.service.toLowerCase();
  }

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function markAccountExhausted(
  id: string,
  customDurationMinutes?: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOne({ _id: id, userId });
  if (!account) throw new Error("AI Account not found");

  const duration =
    customDurationMinutes && customDurationMinutes > 0
      ? customDurationMinutes
      : account.cooldownDurationMinutes || 180;

  const now = new Date();
  const cooldownUntil = addMinutes(now, duration);

  account.status = "cooling_down";
  account.exhaustedAt = now;
  account.cooldownUntil = cooldownUntil;
  account.lastUsedAt = now;
  await account.save();

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function switchActiveAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOne({ _id: id, userId });
  if (!account) throw new Error("AI Account not found");

  // Set any other active account for this service to "ready"
  await AIAccount.updateMany(
    {
      userId,
      service: account.service,
      _id: { $ne: id },
      status: "in_use",
    },
    {
      $set: { status: "ready" },
    }
  );

  account.status = "in_use";
  account.lastUsedAt = new Date();
  await account.save();

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function resetAccountCooldown(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    {
      $set: {
        status: "ready",
        cooldownUntil: null,
        exhaustedAt: null,
      },
    },
    { new: true }
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function deleteAIAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await AIAccount.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return { success: true };
}
