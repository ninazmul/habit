export type PriorityLevel = "p1" | "p2" | "p3" | "p4";

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export type RecurringPattern = "daily" | "weekly" | "monthly" | "custom";

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate?: string | Date;
  dueTime?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  recurringDays?: number[];
  tags: string[];
  projectId?: string;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type AIAccountTier = "free" | "plus" | "pro" | "team" | "api";

export type AIAccountStatus = "ready" | "in_use" | "cooling_down" | "exhausted" | "disabled";

export interface IAIAccount {
  _id: string;
  userId: string;
  service: string; // chatgpt, claude, cursor, gemini, etc.
  name: string;
  email?: string;
  tier: AIAccountTier;
  status: AIAccountStatus;
  cooldownDurationMinutes: number; // default cooldown in minutes
  cooldownUntil?: string | Date;
  exhaustedAt?: string | Date;
  lastUsedAt?: string | Date;
  quotaResetTime?: string;
  notes?: string;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type ProjectStatus = "lead" | "in_progress" | "review" | "completed" | "on_hold" | "cancelled";

export interface IProject {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  clientName?: string;
  status: ProjectStatus;
  priority: "low" | "medium" | "high" | "urgent";
  totalValue: number; // BDT
  paidAmount: number;
  startDate?: string | Date;
  deadline?: string | Date;
  color?: string;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "delayed";

export interface IMilestone {
  _id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string | Date;
  dueDate?: string | Date;
  status: MilestoneStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type TransactionType = "income" | "expense";

export type TransactionStatus = "expected" | "received" | "paid" | "pending";

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  date: string | Date;
  description?: string;
  projectId?: string;
  milestoneId?: string;
  paymentMethod?: string;
  status: TransactionStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IInvestment {
  _id: string;
  userId: string;
  title: string;
  assetType: "stocks" | "savings_certificate" | "mutual_fund" | "real_estate" | "crypto" | "business" | "other";
  amountInvested: number;
  currentValue?: number;
  startDate: string | Date;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ILoan {
  _id: string;
  userId: string;
  type: "lent" | "borrowed";
  counterparty: string;
  principalAmount: number;
  remainingAmount: number;
  dueDate?: string | Date;
  status: "active" | "partially_paid" | "settled";
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IShoppingItem {
  _id: string;
  userId: string;
  title: string;
  category: "grocery" | "tech_gadgets" | "household" | "clothing" | "personal" | "other";
  estimatedPrice?: number;
  actualPrice?: number;
  priority: "low" | "medium" | "high";
  isPurchased: boolean;
  purchasedAt?: string | Date;
  targetMonth?: string; // YYYY-MM
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type EventType = "meeting" | "client_call" | "deadline" | "event" | "reminder" | "personal";

export interface IEvent {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: EventType;
  startDateTime: string | Date;
  endDateTime?: string | Date;
  isAllDay: boolean;
  location?: string;
  meetingLink?: string;
  projectId?: string;
  remindMinutesBefore?: number;
  isCompleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type VaultCategory = "credential" | "api_key" | "recovery_code" | "secret_note" | "document";

export interface IVaultItem {
  _id: string;
  userId: string;
  title: string;
  category: VaultCategory;
  encryptedData: string;
  iv: string;
  authTag: string;
  tags: string[];
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICustomField {
  name: string;
  key: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  options?: string[];
}

export interface ICustomModule {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  fields: ICustomField[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICustomRecord {
  _id: string;
  userId: string;
  moduleId: string;
  data: Record<string, unknown>;
  createdAt: string | Date;
  updatedAt: string | Date;
}
