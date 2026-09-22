"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Task } from "@/lib/database/models/task.model";
import { Event } from "@/lib/database/models/event.model";
import { Project } from "@/lib/database/models/project.model";
import { AIAccount } from "@/lib/database/models/ai-account.model";
import { Transaction } from "@/lib/database/models/transaction.model";
import { Shopping } from "@/lib/database/models/shopping.model";
import { Vault } from "@/lib/database/models/vault.model";
import { CustomModule, CustomRecord } from "@/lib/database/models/custom-module.model";

export interface SearchResultItem {
  id: string;
  type: "task" | "event" | "project" | "ai-account" | "finance" | "shopping" | "vault" | "custom";
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
  date?: string;
}

export async function searchEverything(query: string): Promise<SearchResultItem[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const q = query.trim();
  if (!q || q.length < 2) return [];

  await connectToDatabase();
  const regex = new RegExp(q, "i");

  const [
    tasks,
    events,
    projects,
    aiAccounts,
    transactions,
    shoppingItems,
    vaultItems,
    customModules,
  ] = await Promise.all([
    // Tasks
    Task.find({
      userId,
      $or: [{ title: regex }, { description: regex }, { tags: { $in: [regex] } }],
    })
      .limit(6)
      .lean(),

    // Events
    Event.find({
      userId,
      $or: [{ title: regex }, { description: regex }, { location: regex }],
    })
      .limit(5)
      .lean(),

    // Projects
    Project.find({
      userId,
      $or: [{ name: regex }, { description: regex }, { clientName: regex }, { tags: { $in: [regex] } }],
    })
      .limit(5)
      .lean(),

    // AI Accounts
    AIAccount.find({
      userId,
      $or: [{ name: regex }, { service: regex }, { email: regex }],
    })
      .limit(4)
      .lean(),

    // Transactions / Finance
    Transaction.find({
      userId,
      $or: [{ category: regex }, { description: regex }],
    })
      .limit(5)
      .lean(),

    // Shopping
    Shopping.find({
      userId,
      $or: [{ title: regex }, { notes: regex }],
    })
      .limit(4)
      .lean(),

    // Vault (metadata only - zero plaintext leakage)
    Vault.find({
      userId,
      $or: [{ title: regex }, { tags: { $in: [regex] } }, { notes: regex }],
    })
      .limit(4)
      .lean(),

    // Custom Modules
    CustomModule.find({
      userId,
      name: regex,
    })
      .limit(4)
      .lean(),
  ]);

  const results: SearchResultItem[] = [];

  // Map Tasks
  tasks.forEach((t: any) => {
    results.push({
      id: String(t._id),
      type: "task",
      title: t.title,
      subtitle: t.status ? `Status: ${t.status} • Priority: ${t.priority}` : undefined,
      url: "/tasks",
      badge: t.priority?.toUpperCase(),
    });
  });

  // Map Events
  events.forEach((e: any) => {
    results.push({
      id: String(e._id),
      type: "event",
      title: e.title,
      subtitle: e.startDateTime ? new Date(e.startDateTime).toLocaleDateString() : undefined,
      url: "/schedule",
      badge: e.type,
    });
  });

  // Map Projects
  projects.forEach((p: any) => {
    results.push({
      id: String(p._id),
      type: "project",
      title: p.name,
      subtitle: p.clientName ? `Client: ${p.clientName} • Status: ${p.status}` : `Status: ${p.status}`,
      url: `/projects/${p._id}`,
      badge: p.status,
    });
  });

  // Map AI Accounts
  aiAccounts.forEach((a: any) => {
    results.push({
      id: String(a._id),
      type: "ai-account",
      title: `${a.service} — ${a.name}`,
      subtitle: a.status ? `Tier: ${a.tier} • State: ${a.status}` : undefined,
      url: "/ai-accounts",
      badge: a.status,
    });
  });

  // Map Finance
  transactions.forEach((tr: any) => {
    results.push({
      id: String(tr._id),
      type: "finance",
      title: `${tr.type === "income" ? "+৳" : "-৳"}${tr.amount} — ${tr.category}`,
      subtitle: tr.description || new Date(tr.date).toLocaleDateString(),
      url: "/finance",
      badge: tr.type,
    });
  });

  // Map Shopping
  shoppingItems.forEach((s: any) => {
    results.push({
      id: String(s._id),
      type: "shopping",
      title: s.title,
      subtitle: s.estimatedPrice ? `Estimated: ৳${s.estimatedPrice}` : s.category,
      url: "/shopping",
      badge: s.isPurchased ? "Purchased" : "Pending",
    });
  });

  // Map Vault
  vaultItems.forEach((v: any) => {
    results.push({
      id: String(v._id),
      type: "vault",
      title: v.title,
      subtitle: `Encrypted ${v.category?.replace("_", " ")}`,
      url: "/vault",
      badge: "Encrypted",
    });
  });

  // Map Custom Modules
  customModules.forEach((m: any) => {
    results.push({
      id: String(m._id),
      type: "custom",
      title: m.name,
      subtitle: `Custom Module (${m.fields?.length || 0} fields)`,
      url: "/custom-modules",
      badge: "Module",
    });
  });

  return results;
}
