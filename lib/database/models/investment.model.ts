import { Schema, model, models, Document } from "mongoose";

export interface IInvestmentDocument extends Document {
  userId: string;
  title: string;
  assetType:
    | "stocks"
    | "savings_certificate"
    | "mutual_fund"
    | "real_estate"
    | "crypto"
    | "business"
    | "other";
  amountInvested: number;
  currentValue?: number;
  startDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestmentDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    assetType: {
      type: String,
      enum: [
        "stocks",
        "savings_certificate",
        "mutual_fund",
        "real_estate",
        "crypto",
        "business",
        "other",
      ],
      required: true,
      index: true,
    },
    amountInvested: { type: Number, required: true },
    currentValue: { type: Number },
    startDate: { type: Date, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

InvestmentSchema.index({ userId: 1, assetType: 1 });

export const Investment =
  models.Investment ||
  model<IInvestmentDocument>("Investment", InvestmentSchema);
