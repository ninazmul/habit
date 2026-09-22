import { Schema, model, models, Document } from "mongoose";

export interface IProjectDocument extends Document {
  userId: string;
  name: string;
  description?: string;
  clientName?: string;
  status: "lead" | "in_progress" | "review" | "completed" | "on_hold" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  totalValue: number;
  paidAmount: number;
  startDate?: Date;
  deadline?: Date;
  color?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientName: { type: String, trim: true },
    status: {
      type: String,
      enum: ["lead", "in_progress", "review", "completed", "on_hold", "cancelled"],
      default: "in_progress",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    totalValue: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    startDate: { type: Date },
    deadline: { type: Date, index: true },
    color: { type: String, default: "#3b82f6" },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, status: 1, deadline: 1 });

export const Project =
  models.Project || model<IProjectDocument>("Project", ProjectSchema);
