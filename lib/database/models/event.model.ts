import { Schema, model, models, Document } from "mongoose";

export interface IEventDocument extends Document {
  userId: string;
  title: string;
  description?: string;
  type:
    | "meeting"
    | "client_call"
    | "deadline"
    | "event"
    | "reminder"
    | "personal";
  startDateTime: Date;
  endDateTime?: Date;
  isAllDay: boolean;
  location?: string;
  meetingLink?: string;
  projectId?: Schema.Types.ObjectId;
  remindMinutesBefore: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEventDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: [
        "meeting",
        "client_call",
        "deadline",
        "event",
        "reminder",
        "personal",
      ],
      default: "meeting",
      index: true,
    },
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date },
    isAllDay: { type: Boolean, default: false },
    location: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    remindMinutesBefore: { type: Number, default: 15 },
    isCompleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

EventSchema.index({ userId: 1, startDateTime: 1 });

export const Event =
  models.Event || model<IEventDocument>("Event", EventSchema);
