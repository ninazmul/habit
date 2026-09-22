import { Schema, model, models, Document } from "mongoose";

export interface IShoppingDocument extends Document {
  userId: string;
  title: string;
  category:
    | "grocery"
    | "tech_gadgets"
    | "household"
    | "clothing"
    | "personal"
    | "other";
  estimatedPrice?: number;
  actualPrice?: number;
  priority: "low" | "medium" | "high";
  isPurchased: boolean;
  purchasedAt?: Date;
  targetMonth?: string; // e.g. "2026-09"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingSchema = new Schema<IShoppingDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "grocery",
        "tech_gadgets",
        "household",
        "clothing",
        "personal",
        "other",
      ],
      default: "grocery",
      index: true,
    },
    estimatedPrice: { type: Number },
    actualPrice: { type: Number },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isPurchased: { type: Boolean, default: false, index: true },
    purchasedAt: { type: Date },
    targetMonth: { type: String, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ShoppingSchema.index({ userId: 1, targetMonth: 1, isPurchased: 1 });

export const Shopping =
  models.Shopping || model<IShoppingDocument>("Shopping", ShoppingSchema);
