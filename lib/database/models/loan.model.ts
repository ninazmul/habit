import { Schema, model, models, Document } from "mongoose";

export interface ILoanDocument extends Document {
  userId: string;
  type: "lent" | "borrowed";
  counterparty: string;
  principalAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  status: "active" | "partially_paid" | "settled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoanDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["lent", "borrowed"],
      required: true,
      index: true,
    },
    counterparty: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    dueDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ["active", "partially_paid", "settled"],
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

LoanSchema.index({ userId: 1, type: 1, status: 1 });

export const Loan = models.Loan || model<ILoanDocument>("Loan", LoanSchema);
