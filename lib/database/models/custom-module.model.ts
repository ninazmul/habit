import { Schema, model, models, Document } from "mongoose";

export interface ICustomFieldDoc {
  name: string;
  key: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  options?: string[];
}

export interface ICustomModuleDocument extends Document {
  userId: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  fields: ICustomFieldDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema = new Schema<ICustomFieldDoc>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "date", "boolean", "select"],
      required: true,
    },
    options: [{ type: String }],
  },
  { _id: false }
);

const CustomModuleSchema = new Schema<ICustomModuleDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    icon: { type: String },
    color: { type: String },
    fields: [CustomFieldSchema],
  },
  { timestamps: true }
);

CustomModuleSchema.index({ userId: 1, slug: 1 }, { unique: true });

export const CustomModule =
  models.CustomModule ||
  model<ICustomModuleDocument>("CustomModule", CustomModuleSchema);

export interface ICustomRecordDocument extends Document {
  userId: string;
  moduleId: Schema.Types.ObjectId;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRecordSchema = new Schema<ICustomRecordDocument>(
  {
    userId: { type: String, required: true, index: true },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "CustomModule",
      required: true,
      index: true,
    },
    data: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

CustomRecordSchema.index({ userId: 1, moduleId: 1 });

export const CustomRecord =
  models.CustomRecord ||
  model<ICustomRecordDocument>("CustomRecord", CustomRecordSchema);
