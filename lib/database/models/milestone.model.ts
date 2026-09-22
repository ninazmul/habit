import { Schema, model, models, Document } from "mongoose";

export interface IMilestoneDocument extends Document {
  userId: string;
  projectId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
  dueDate?: Date;
  status: "pending" | "in_progress" | "completed" | "delayed";
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestoneDocument>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false, index: true },
    paidAt: { type: Date },
    dueDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "delayed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

MilestoneSchema.index({ userId: 1, isPaid: 1, dueDate: 1 });

export const Milestone =
  models.Milestone || model<IMilestoneDocument>("Milestone", MilestoneSchema);
