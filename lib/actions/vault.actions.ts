"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Vault } from "@/lib/database/models/vault.model";
import { VaultItemSchema } from "@/validations/habit";
import { encryptSecret, decryptSecret } from "@/lib/utils/vault";
import { revalidatePath } from "next/cache";

export async function getVaultItems(filters?: {
  category?: string;
  search?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };

  if (filters?.category && filters.category !== "all") {
    query.category = filters.category;
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { title: { $regex: s, $options: "i" } },
      { tags: { $in: [new RegExp(s, "i")] } },
      { notes: { $regex: s, $options: "i" } },
    ];
  }

  // Fetch items without exposing raw encrypted payloads in bulk view if not needed
  const items = await Vault.find(query)
    .select("title category tags notes createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

export async function getVaultStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const items = await Vault.find({ userId }).select("category").lean();

  const total = items.length;
  const byCategory = {
    credential: 0,
    api_key: 0,
    recovery_code: 0,
    secret_note: 0,
    document: 0,
  };

  for (const it of items) {
    if (it.category in byCategory) {
      byCategory[it.category as keyof typeof byCategory]++;
    }
  }

  return { total, byCategory };
}

export async function createVaultItem(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = VaultItemSchema.parse(rawInput);
  await connectToDatabase();

  const { encryptedData, iv, authTag } = encryptSecret(validated.secretContent);

  const item = await Vault.create({
    userId,
    title: validated.title,
    category: validated.category,
    encryptedData,
    iv,
    authTag,
    tags: validated.tags || [],
    notes: validated.notes || "",
  });

  revalidatePath("/vault");

  return {
    _id: item._id.toString(),
    title: item.title,
    category: item.category,
    tags: item.tags,
    notes: item.notes,
  };
}

export async function updateVaultItem(
  id: string,
  rawInput: {
    title?: string;
    category?: "credential" | "api_key" | "recovery_code" | "secret_note" | "document";
    secretContent?: string;
    tags?: string[];
    notes?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const existing = await Vault.findOne({ _id: id, userId });
  if (!existing) throw new Error("Vault item not found");

  if (rawInput.title !== undefined) existing.title = rawInput.title.trim();
  if (rawInput.category !== undefined) existing.category = rawInput.category;
  if (rawInput.tags !== undefined) existing.tags = rawInput.tags;
  if (rawInput.notes !== undefined) existing.notes = rawInput.notes.trim();

  if (rawInput.secretContent && rawInput.secretContent.trim().length > 0) {
    const { encryptedData, iv, authTag } = encryptSecret(rawInput.secretContent);
    existing.encryptedData = encryptedData;
    existing.iv = iv;
    existing.authTag = authTag;
  }

  await existing.save();

  revalidatePath("/vault");

  return {
    _id: existing._id.toString(),
    title: existing.title,
    category: existing.category,
    tags: existing.tags,
    notes: existing.notes,
  };
}

export async function deleteVaultItem(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const deleted = await Vault.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new Error("Vault item not found");

  revalidatePath("/vault");
  return { success: true };
}

export async function revealVaultSecret(id: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const item = (await Vault.findOne({ _id: id, userId }).lean()) as any;
  if (!item) throw new Error("Vault item not found");

  const secret = decryptSecret(item.encryptedData, item.iv, item.authTag);
  return secret;
}
