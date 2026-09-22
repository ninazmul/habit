"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import { Project } from "@/lib/database/models/project.model";
import { Milestone } from "@/lib/database/models/milestone.model";
import { Transaction } from "@/lib/database/models/transaction.model";
import { ProjectSchema, MilestoneSchema } from "@/validations/habit";
import { revalidatePath } from "next/cache";

export async function getProjects(status?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const query: Record<string, unknown> = { userId };
  if (status && status !== "all") {
    query.status = status;
  }

  const projects = await Project.find(query)
    .sort({ updatedAt: -1, deadline: 1 })
    .lean();

  return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const [project, milestones] = await Promise.all([
    Project.findOne({ _id: id, userId }).lean(),
    Milestone.find({ projectId: id, userId }).sort({ dueDate: 1, createdAt: 1 }).lean(),
  ]);

  if (!project) throw new Error("Project not found");

  return {
    project: JSON.parse(JSON.stringify(project)),
    milestones: JSON.parse(JSON.stringify(milestones)),
  };
}

export async function createProject(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = ProjectSchema.parse(rawInput);
  await connectToDatabase();

  const project = await Project.create({
    userId,
    ...validated,
    startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    deadline: validated.deadline ? new Date(validated.deadline) : undefined,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/income");

  return JSON.parse(JSON.stringify(project));
}

export async function updateProject(id: string, rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = ProjectSchema.partial().parse(rawInput);
  await connectToDatabase();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.startDate !== undefined) {
    updateData.startDate = validated.startDate ? new Date(validated.startDate) : null;
  }
  if (validated.deadline !== undefined) {
    updateData.deadline = validated.deadline ? new Date(validated.deadline) : null;
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!project) throw new Error("Project not found");

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);

  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await Promise.all([
    Project.deleteOne({ _id: id, userId }),
    Milestone.deleteMany({ projectId: id, userId }),
  ]);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/income");

  return { success: true };
}

export async function createMilestone(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = MilestoneSchema.parse(rawInput);
  await connectToDatabase();

  const milestone = await Milestone.create({
    userId,
    ...validated,
    dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    paidAt: validated.isPaid ? new Date() : undefined,
  });

  // If created as paid, update project paidAmount
  if (validated.isPaid && validated.amount > 0) {
    await Project.updateOne(
      { _id: validated.projectId, userId },
      { $inc: { paidAmount: validated.amount } }
    );

    // Also record transaction
    await Transaction.create({
      userId,
      type: "income",
      category: "project_milestone",
      amount: validated.amount,
      currency: "BDT",
      date: new Date(),
      description: `Milestone payment: ${validated.title}`,
      projectId: validated.projectId,
      milestoneId: milestone._id,
      status: "received",
    });
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${validated.projectId}`);
  revalidatePath("/income");

  return JSON.parse(JSON.stringify(milestone));
}

export async function toggleMilestonePaid(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const milestone = await Milestone.findOne({ _id: id, userId });
  if (!milestone) throw new Error("Milestone not found");

  const isNowPaid = !milestone.isPaid;
  milestone.isPaid = isNowPaid;
  milestone.paidAt = isNowPaid ? new Date() : undefined;
  milestone.status = isNowPaid ? "completed" : "pending";
  await milestone.save();

  // Adjust Project paidAmount accordingly
  const amountDelta = isNowPaid ? milestone.amount : -milestone.amount;
  await Project.updateOne(
    { _id: milestone.projectId, userId },
    { $inc: { paidAmount: amountDelta } }
  );

  // Synchronize with Transaction
  if (isNowPaid) {
    await Transaction.create({
      userId,
      type: "income",
      category: "project_milestone",
      amount: milestone.amount,
      currency: "BDT",
      date: new Date(),
      description: `Milestone payment: ${milestone.title}`,
      projectId: milestone.projectId,
      milestoneId: milestone._id,
      status: "received",
    });
  } else {
    await Transaction.deleteOne({
      userId,
      milestoneId: milestone._id,
    });
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${milestone.projectId}`);
  revalidatePath("/income");

  return JSON.parse(JSON.stringify(milestone));
}

export async function deleteMilestone(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const milestone = await Milestone.findOne({ _id: id, userId });
  if (milestone) {
    if (milestone.isPaid && milestone.amount > 0) {
      await Project.updateOne(
        { _id: milestone.projectId, userId },
        { $inc: { paidAmount: -milestone.amount } }
      );
      await Transaction.deleteOne({ userId, milestoneId: id });
    }
    await Milestone.deleteOne({ _id: id, userId });
  }

  revalidatePath("/");
  revalidatePath("/projects");
  if (milestone) revalidatePath(`/projects/${milestone.projectId}`);
  revalidatePath("/income");

  return { success: true };
}

export async function getProjectStats() {
  const { userId } = await auth();
  if (!userId) return { totalProjects: 0, activeProjects: 0, totalPipeline: 0, totalReceived: 0 };

  await connectToDatabase();

  const projects = await Project.find({ userId }).lean();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => ["in_progress", "review"].includes(p.status)).length;
  const totalPipeline = projects.reduce((acc, p) => acc + (p.totalValue || 0), 0);
  const totalReceived = projects.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  return { totalProjects, activeProjects, totalPipeline, totalReceived };
}
