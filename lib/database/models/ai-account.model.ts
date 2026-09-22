import { Schema, model, models, Document } from "mongoose";

export interface IAIAccountDocument extends Document {
  userId: string;
  service: string;
  name: string;
  email?: string;
  tier: "free" | "plus" | "pro" | "team" | "api";
  status: "ready" | "in_use" | "cooling_down" | "exhausted" | "disabled";
  cooldownDurationMinutes: number;
  cooldownUntil?: Date;
  exhaustedAt?: Date;
  lastUsedAt?: Date;
  quotaResetTime?: string;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AIAccountSchema = new Schema<IAIAccountDocument>(
  {
    userId: { type: String, required: true, index: true },
    service: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    tier: {
      type: String,
      enum: ["free", "plus", "pro", "team", "api"],
      default: "pro",
    },
    status: {
      type: String,
      enum: ["ready", "in_use", "cooling_down", "exhausted", "disabled"],
      default: "ready",
      index: true,
    },
    cooldownDurationMinutes: { type: Number, default: 180 },
    cooldownUntil: { type: Date, index: true },
    exhaustedAt: { type: Date },
    lastUsedAt: { type: Date },
    quotaResetTime: { type: String },
    notes: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AIAccountSchema.index({ userId: 1, service: 1, status: 1 });

export const AIAccount =
  models.AIAccount || model<IAIAccountDocument>("AIAccount", AIAccountSchema);
