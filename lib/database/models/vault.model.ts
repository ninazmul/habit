import { Schema, model, models, Document } from "mongoose";

export interface IVaultDocument extends Document {
  userId: string;
  title: string;
  category: "credential" | "api_key" | "recovery_code" | "secret_note" | "document";
  encryptedData: string;
  iv: string;
  authTag: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVaultDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["credential", "api_key", "recovery_code", "secret_note", "document"],
      default: "secret_note",
      index: true,
    },
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

VaultSchema.index({ userId: 1, category: 1 });

export const Vault =
  models.Vault || model<IVaultDocument>("Vault", VaultSchema);
