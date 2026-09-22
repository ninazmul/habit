"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import {
  CustomModule,
  CustomRecord,
} from "@/lib/database/models/custom-module.model";
import {
  CustomModuleSchema,
  CustomRecordSchema,
} from "@/validations/habit";
import { revalidatePath } from "next/cache";

export async function getCustomModules() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const modules = await CustomModule.find({ userId }).sort({ createdAt: -1 }).lean();

  // Get record count for each module
  const modulesWithCounts = await Promise.all(
    modules.map(async (mod) => {
      const recordCount = await CustomRecord.countDocuments({
        userId,
        moduleId: mod._id,
      });
      return {
        ...mod,
        recordCount,
      };
    })
  );

  return JSON.parse(JSON.stringify(modulesWithCounts));
}

export async function getCustomModuleById(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const mod = (await CustomModule.findOne({ _id: id, userId }).lean()) as any;
  if (!mod) throw new Error("Module not found");

  const recordCount = await CustomRecord.countDocuments({
    userId,
    moduleId: mod._id,
  });

  return JSON.parse(JSON.stringify({ ...mod, recordCount }));
}

export async function getCustomModuleBySlug(slug: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const mod = (await CustomModule.findOne({ slug, userId }).lean()) as any;
  if (!mod) throw new Error("Module not found");

  const recordCount = await CustomRecord.countDocuments({
    userId,
    moduleId: mod._id,
  });

  return JSON.parse(JSON.stringify({ ...mod, recordCount }));
}

export async function createCustomModule(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = CustomModuleSchema.parse(rawInput);
  await connectToDatabase();

  let slug = validated.slug;
  if (!slug) {
    slug = validated.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Ensure unique slug for user
  const existing = await CustomModule.findOne({ userId, slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const mod = await CustomModule.create({
    userId,
    name: validated.name.trim(),
    slug,
    icon: validated.icon || "Boxes",
    color: validated.color || "#3b82f6",
    fields: validated.fields,
  });

  revalidatePath("/custom-modules");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(mod));
}

export async function updateCustomModule(
  id: string,
  rawInput: {
    name?: string;
    icon?: string;
    color?: string;
    fields?: Array<{
      name: string;
      key: string;
      type: "text" | "number" | "date" | "boolean" | "select";
      options?: string[];
    }>;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const mod = await CustomModule.findOne({ _id: id, userId });
  if (!mod) throw new Error("Module not found");

  if (rawInput.name !== undefined) mod.name = rawInput.name.trim();
  if (rawInput.icon !== undefined) mod.icon = rawInput.icon;
  if (rawInput.color !== undefined) mod.color = rawInput.color;
  if (rawInput.fields !== undefined) mod.fields = rawInput.fields;

  await mod.save();

  revalidatePath("/custom-modules");
  revalidatePath(`/custom-modules/${mod.slug}`);

  return JSON.parse(JSON.stringify(mod));
}

export async function deleteCustomModule(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const mod = await CustomModule.findOneAndDelete({ _id: id, userId });
  if (!mod) throw new Error("Module not found");

  // Cascade delete records
  await CustomRecord.deleteMany({ moduleId: id, userId });

  revalidatePath("/custom-modules");
  return { success: true };
}

// ---------------- Record Actions ----------------

export async function getCustomRecords(moduleId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const records = await CustomRecord.find({ userId, moduleId })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(records));
}

export async function createCustomRecord(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = CustomRecordSchema.parse(rawInput);
  await connectToDatabase();

  const record = await CustomRecord.create({
    userId,
    moduleId: validated.moduleId,
    data: validated.data,
  });

  revalidatePath("/custom-modules");
  return JSON.parse(JSON.stringify(record));
}

export async function updateCustomRecord(
  id: string,
  data: Record<string, unknown>
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const record = await CustomRecord.findOneAndUpdate(
    { _id: id, userId },
    { $set: { data } },
    { new: true }
  ).lean();

  if (!record) throw new Error("Record not found");

  revalidatePath("/custom-modules");
  return JSON.parse(JSON.stringify(record));
}

export async function deleteCustomRecord(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const deleted = await CustomRecord.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new Error("Record not found");

  revalidatePath("/custom-modules");
  return { success: true };
}
