import { Schema, model, models, Document } from "mongoose";

export interface ITransactionDocument extends Document {
  userId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
  projectId?: Schema.Types.ObjectId;
  milestoneId?: Schema.Types.ObjectId;
  paymentMethod?: string;
  status: "expected" | "received" | "paid" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    date: { type: Date, required: true, index: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: "Milestone", index: true },
    paymentMethod: { type: String, trim: true },
    status: {
      type: String,
      enum: ["expected", "received", "paid", "pending"],
      default: "received",
      index: true,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, type: 1, date: -1 });

export const Transaction =
  models.Transaction ||
  model<ITransactionDocument>("Transaction", TransactionSchema);
