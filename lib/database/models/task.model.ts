import { Schema, model, models, Document } from "mongoose";

export interface ITaskDocument extends Document {
  userId: string;
  title: string;
  description?: string;
  priority: "p1" | "p2" | "p3" | "p4";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date;
  dueTime?: string;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly" | "custom";
  recurringDays?: number[];
  tags: string[];
  projectId?: Schema.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["p1", "p2", "p3", "p4"],
      default: "p3",
      index: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "cancelled"],
      default: "todo",
      index: true,
    },
    dueDate: { type: Date, index: true },
    dueTime: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
    },
    recurringDays: [{ type: Number, min: 0, max: 6 }],
    tags: [{ type: String, trim: true }],
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, dueDate: 1, status: 1 });

export const Task = models.Task || model<ITaskDocument>("Task", TaskSchema);
