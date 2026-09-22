"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Task } from "@/lib/database/models/task.model";
import { Event } from "@/lib/database/models/event.model";
import { Project } from "@/lib/database/models/project.model";
import { Milestone } from "@/lib/database/models/milestone.model";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { Transaction } from "@/lib/database/models/transaction.model";
import { Investment } from "@/lib/database/models/investment.model";
import { Loan } from "@/lib/database/models/loan.model";
import { Shopping } from "@/lib/database/models/shopping.model";
import { Vault } from "@/lib/database/models/vault.model";
import { CustomModule, CustomRecord } from "@/lib/database/models/custom-module.model";
import mongoose from "mongoose";

export async function getSystemHealth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const isConnected = mongoose.connection.readyState === 1;

  const [
    taskCount,
    eventCount,
    projectCount,
    aiAccountCount,
    financeCount,
    shoppingCount,
    vaultCount,
    moduleCount,
  ] = await Promise.all([
    Task.countDocuments({ userId }),
    Event.countDocuments({ userId }),
    Project.countDocuments({ userId }),
    AIAccount.countDocuments({ userId }),
    Transaction.countDocuments({ userId }),
    Shopping.countDocuments({ userId }),
    Vault.countDocuments({ userId }),
    CustomModule.countDocuments({ userId }),
  ]);

  return {
    database: {
      status: isConnected ? "connected" : "disconnected",
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    counts: {
      tasks: taskCount,
      events: eventCount,
      projects: projectCount,
      aiAccounts: aiAccountCount,
      financeRecords: financeCount,
      shoppingItems: shoppingCount,
      vaultSecrets: vaultCount,
      customModules: moduleCount,
    },
    systemTime: new Date().toISOString(),
  };
}

export async function exportWorkspaceData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const [
    tasks,
    events,
    projects,
    milestones,
    aiAccounts,
    transactions,
    investments,
    loans,
    shopping,
    customModules,
    customRecords,
  ] = await Promise.all([
    Task.find({ userId }).lean(),
    Event.find({ userId }).lean(),
    Project.find({ userId }).lean(),
    Milestone.find({ userId }).lean(),
    AIAccount.find({ userId }).lean(),
    Transaction.find({ userId }).lean(),
    Investment.find({ userId }).lean(),
    Loan.find({ userId }).lean(),
    Shopping.find({ userId }).lean(),
    CustomModule.find({ userId }).lean(),
    CustomRecord.find({ userId }).lean(),
  ]);

  return {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    userId,
    data: {
      tasks,
      events,
      projects,
      milestones,
      aiAccounts,
      transactions,
      investments,
      loans,
      shopping,
      customModules,
      customRecords,
    },
  };
}
