import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { Task } from "@/lib/database/models/task.model";
import { Event } from "@/lib/database/models/event.model";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secret = searchParams.get("secret") || authHeader?.replace("Bearer ", "");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid CRON_SECRET" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const now = new Date();

    // 1. Auto-reset AI Accounts whose cooldown expired
    const resetResult = await AIAccount.updateMany(
      {
        status: "cooling_down",
        quotaResetTime: { $lte: now },
      },
      {
        $set: {
          status: "ready",
          quotaResetTime: null,
        },
      }
    );

    // 2. Count current overdue tasks
    const todayStr = now.toISOString().split("T")[0];
    const overdueCount = await Task.countDocuments({
      status: { $nin: ["completed", "cancelled"] },
      dueDate: { $lt: todayStr },
    });

    // 3. Count upcoming events in next 2 hours
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const upcomingEventsCount = await Event.countDocuments({
      isCompleted: false,
      startDateTime: { $gte: now, $lte: twoHoursLater },
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      report: {
        aiAccountsReset: resetResult.modifiedCount,
        activeOverdueTasks: overdueCount,
        imminentEvents: upcomingEventsCount,
      },
    });
  } catch (error) {
    console.error("Cron execution error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during cron processing" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
