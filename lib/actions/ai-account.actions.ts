"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { AIAccountSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";

const INACTIVE_STATUSES = ["disabled", "archived", "frozen"] as const;

function isInactiveStatus(status: string): boolean {
  return INACTIVE_STATUSES.includes(
    status as (typeof INACTIVE_STATUSES)[number],
  );
}

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
    },
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
  if (!userId)
    return {
      total: 0,
      ready: 0,
      inUse: 0,
      coolingDown: 0,
      deactivated: 0,
      archived: 0,
      frozen: 0,
    };

  await connectToDatabase();

  const now = new Date();

  // Auto-recover expired cooldowns (skip archived/frozen/disabled)
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
    },
  );

  const accounts = await AIAccount.find({ userId }).lean();

  const total = accounts.length;
  const ready = accounts.filter((a) => a.status === "ready").length;
  const inUse = accounts.filter((a) => a.status === "in_use").length;
  const coolingDown = accounts.filter(
    (a) => a.status === "cooling_down",
  ).length;
  const deactivated = accounts.filter((a) => a.status === "disabled").length;
  const archived = accounts.filter((a) => a.status === "archived").length;
  const frozen = accounts.filter((a) => a.status === "frozen").length;

  return { total, ready, inUse, coolingDown, deactivated, archived, frozen };
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
    { new: true },
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function markAccountExhausted(
  id: string,
  customDurationMinutes?: number,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOne({ _id: id, userId });
  if (!account) throw new Error("AI Account not found");
  if (isInactiveStatus(account.status)) {
    throw new Error("Cannot mark inactive account as exhausted");
  }

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
  if (isInactiveStatus(account.status)) {
    throw new Error("Cannot activate an inactive account");
  }

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
    },
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

  const existing = await AIAccount.findOne({ _id: id, userId });
  if (!existing) throw new Error("AI Account not found");
  if (isInactiveStatus(existing.status)) {
    throw new Error("Cannot reset cooldown on an inactive account");
  }

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    {
      $set: {
        status: "ready",
        cooldownUntil: null,
        exhaustedAt: null,
      },
    },
    { new: true },
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

export async function deactivateAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "disabled" } },
    { new: true },
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function archiveAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "archived" } },
    { new: true },
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function freezeAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "frozen" } },
    { new: true },
  ).lean();

  if (!account) throw new Error("AI Account not found");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}

export async function reactivateAccount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const account = await AIAccount.findOneAndUpdate(
    { _id: id, userId, status: { $in: INACTIVE_STATUSES } },
    {
      $set: {
        status: "ready",
        cooldownUntil: null,
        exhaustedAt: null,
      },
    },
    { new: true },
  ).lean();

  if (!account) throw new Error("AI Account not found or not inactive");

  revalidatePath("/");
  revalidatePath("/ai-accounts");

  return JSON.parse(JSON.stringify(account));
}
