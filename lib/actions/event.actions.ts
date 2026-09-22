"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Event } from "@/lib/database/models/event.model";
import { EventSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";

export async function getEvents(filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  upcomingOnly?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };

  if (filters?.type && filters.type !== "all") {
    query.type = filters.type;
  }

  if (filters?.upcomingOnly) {
    query.startDateTime = { $gte: new Date() };
  } else if (filters?.startDate && filters?.endDate) {
    query.startDateTime = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  const events = await Event.find(query)
    .sort({ startDateTime: 1 })
    .lean();

  return JSON.parse(JSON.stringify(events));
}

export async function getTodayEvents() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectToDatabase();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const events = await Event.find({
    userId,
    startDateTime: { $gte: todayStart, $lte: todayEnd },
  })
    .sort({ startDateTime: 1 })
    .lean();

  return JSON.parse(JSON.stringify(events));
}

export async function createEvent(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = EventSchema.parse(rawInput);
  await connectToDatabase();

  const event = await Event.create({
    userId,
    ...validated,
    startDateTime: new Date(validated.startDateTime),
    endDateTime: validated.endDateTime ? new Date(validated.endDateTime) : undefined,
  });

  revalidatePath("/");
  revalidatePath("/schedule");

  return JSON.parse(JSON.stringify(event));
}

export async function updateEvent(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = EventSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.startDateTime) {
    updateData.startDateTime = new Date(validated.startDateTime);
  }
  if (validated.endDateTime !== undefined) {
    updateData.endDateTime = validated.endDateTime ? new Date(validated.endDateTime) : null;
  }

  const event = await Event.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!event) throw new Error("Event not found");

  revalidatePath("/");
  revalidatePath("/schedule");

  return JSON.parse(JSON.stringify(event));
}

export async function toggleEventComplete(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const event = await Event.findOne({ _id: id, userId });
  if (!event) throw new Error("Event not found");

  event.isCompleted = !event.isCompleted;
  await event.save();

  revalidatePath("/");
  revalidatePath("/schedule");

  return JSON.parse(JSON.stringify(event));
}

export async function deleteEvent(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await Event.deleteOne({ _id: id, userId });

  revalidatePath("/");
  revalidatePath("/schedule");

  return { success: true };
}
