import { z } from "zod";

// Task Validation
export const TaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["p1", "p2", "p3", "p4"]).default("p3"),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  recurringDays: z.array(z.number().min(0).max(6)).optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional().nullable(),
});

// AI Account Validation
export const AIAccountSchema = z.object({
  service: z.string().min(1, "Service name is required"),
  name: z.string().min(1, "Account identifier is required"),
  email: z.string().email().optional().or(z.literal("")),
  tier: z.enum(["free", "plus", "pro", "team", "api"]).default("pro"),
  status: z.enum(["ready", "in_use", "cooling_down", "exhausted", "disabled"]).default("ready"),
  cooldownDurationMinutes: z.coerce.number().min(1).default(180),
  quotaResetTime: z.string().optional(),
  notes: z.string().optional(),
  order: z.coerce.number().default(0),
});

// Project Validation
export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  status: z.enum(["lead", "in_progress", "review", "completed", "on_hold", "cancelled"]).default("in_progress"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  totalValue: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  startDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  color: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Milestone Validation
export const MilestoneSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().min(0).default(0),
  isPaid: z.boolean().default(false),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["pending", "in_progress", "completed", "delayed"]).default("pending"),
});

// Finance / Transaction Validation
export const TransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().default("BDT"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  paymentMethod: z.string().optional(),
  status: z.enum(["expected", "received", "paid", "pending"]).default("received"),
});

// Investment Validation
export const InvestmentSchema = z.object({
  title: z.string().min(1, "Investment title is required"),
  assetType: z.enum(["stocks", "savings_certificate", "mutual_fund", "real_estate", "crypto", "business", "other"]),
  amountInvested: z.coerce.number().positive("Amount must be greater than 0"),
  currentValue: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
});

// Loan Validation
export const LoanSchema = z.object({
  type: z.enum(["lent", "borrowed"]),
  counterparty: z.string().min(1, "Counterparty is required"),
  principalAmount: z.coerce.number().positive("Principal must be greater than 0"),
  remainingAmount: z.coerce.number().min(0),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["active", "partially_paid", "settled"]).default("active"),
  notes: z.string().optional(),
});

// Shopping Validation
export const ShoppingSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  category: z.enum(["grocery", "tech_gadgets", "household", "clothing", "personal", "other"]).default("grocery"),
  estimatedPrice: z.coerce.number().min(0).optional(),
  actualPrice: z.coerce.number().min(0).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  isPurchased: z.boolean().default(false),
  targetMonth: z.string().optional(),
  notes: z.string().optional(),
});

// Event Validation
export const EventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  type: z.enum(["meeting", "client_call", "deadline", "event", "reminder", "personal"]).default("meeting"),
  startDateTime: z.string().min(1, "Start date/time is required"),
  endDateTime: z.string().optional().nullable(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  meetingLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  projectId: z.string().optional().nullable(),
  remindMinutesBefore: z.coerce.number().min(0).default(15),
});

// Vault Item Validation
export const VaultItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  category: z.enum(["credential", "api_key", "recovery_code", "secret_note", "document"]).default("secret_note"),
  secretContent: z.string().min(1, "Secret content cannot be empty"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Custom Module Validation
export const CustomFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  key: z.string().min(1, "Field key is required"),
  type: z.enum(["text", "number", "date", "boolean", "select"]).default("text"),
  options: z.array(z.string()).optional().default([]),
});

export const CustomModuleSchema = z.object({
  name: z.string().min(1, "Module name is required"),
  slug: z.string().optional(),
  icon: z.string().optional().default("Boxes"),
  color: z.string().optional().default("#3b82f6"),
  fields: z.array(CustomFieldSchema).min(1, "At least one field is required"),
});

export const CustomRecordSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  data: z.record(z.unknown()),
});
