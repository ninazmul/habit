<div align="center">

# ⚡ Habit by Rizmec (v1.0.0)

### The Ultimate Personal Command Center & Life Operating System

[![Next.js](https://img.shields.io/badge/Next.js-16_(Turbopack)-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-f6821f?style=for-the-badge&logo=pwa)](https://habit.rizmec.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

_A state-of-the-art, high-performance personal command center web application and PWA designed to take full control of your life, career, finances, projects, AI workflows, and digital security._

[Live App](https://habit.rizmec.com) · [Documentation](docs/) · [Report Bug](https://github.com/ninazmul/habit/issues) · [Request Feature](https://github.com/ninazmul/habit/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Modules & Features](#-key-modules--features)
  - [⚡ Daily Mission & Executive Dashboard](#-daily-mission--executive-dashboard)
  - [🤖 AI Accounts & Quota Rotation Engine](#-ai-accounts--quota-rotation-engine)
  - [📋 Tasks & Habit Tracking](#-tasks--habit-tracking)
  - [🚀 Projects & Milestones](#-projects--milestones)
  - [💰 Complete Financial Operating System](#-complete-financial-operating-system)
  - [🛒 Smart Shopping & Inventory](#-smart-shopping--inventory)
  - [📅 Schedule & Timeline Events](#-schedule--timeline-events)
  - [🔐 Encrypted Vault (AES-256-GCM)](#-encrypted-vault-aes-256-gcm)
  - [🧩 Dynamic Custom Modules Engine](#-dynamic-custom-modules-engine)
  - [🔍 Universal Quick Search (⌘K / Ctrl+K)](#-universal-quick-search-k--ctrlk)
  - [🔔 System Engine, Alerts & Cron Worker](#-system-engine-alerts--cron-worker)
  - [📱 Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [Tech Stack](#-tech-stack)
- [Architecture & Next.js 16 Proxy](#-architecture--nextjs-16-proxy)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Database Models](#-database-models)
- [Main Application Routes](#-main-application-routes)
- [Scripts Reference](#-scripts-reference)
- [Author & Credits](#-author--credits)
- [License](#-license)

---

## 🚀 Overview

**Habit by Rizmec** is an all-in-one personal command center. Modern knowledge workers, founders, creators, and engineers juggle dozens of fragmented apps: task managers, spreadsheet budgets, AI subscription limits, scattered password notes, and project kanbans.

**Habit** unifies all facets into a unified, ultra-responsive, privacy-focused dashboard:
- **Productivity**: Tasks, habits, recurring routines, and multi-stage projects with milestone tracking.
- **AI Tooling**: AI account roster with token/message quota limits, reset cooldown timers, and rotation management.
- **Financial Freedom**: Comprehensive double-entry transactions, income streams, budgets, investments, and loan tracking with BDT (৳) & multi-currency support.
- **Military-Grade Privacy**: Integrated encrypted vault using AES-256-GCM for sensitive credentials, secrets, and private recovery notes.
- **Infinite Extensibility**: Dynamic schema-driven Custom Modules allowing you to build custom database tables without writing code.
- **Installable Everywhere**: Offline-capable Progressive Web App (PWA) with native shortcuts on desktop, iOS, and Android.

---

## ✨ Key Modules & Features

### ⚡ Daily Mission & Executive Dashboard
- **Real-Time Pulse**: View urgent tasks, active AI account cooldowns, upcoming deadlines, and monthly cash flow in one screen.
- **Quick Actions**: One-click logging for quick expenses, tasks, AI accounts, and vault entries.
- **System Health & Status**: Live database ping, active alerts badge, and data sync verification.

### 🤖 AI Accounts & Quota Rotation Engine
- **Manage Multi-Account AI Stacks**: Track accounts across ChatGPT Plus/Team, Claude Pro, Gemini Advanced, Perplexity, Cursor, GitHub Copilot, Midjourney, and more.
- **Quota & Cooldown Timers**: Monitor usage percentages, message limits, and automatic reset countdowns (e.g. 3-hour / 5-hour cooldown periods).
- **Rotation Optimizer**: Instantly identifies which AI account is off cooldown and ready for your next deep work session.

### 📋 Tasks & Habit Tracking
- **Smart Prioritization**: Categorize by urgency (Critical, High, Medium, Low) and tags.
- **Habit Streaks & Recurrence**: Track daily habits, consistency rates, and completion history.
- **Filtering & Views**: Filter by status (Pending, In Progress, Completed), project affiliation, or due date.

### 🚀 Projects & Milestones
- **Multi-Phase Projects**: Manage personal ventures, client deliverables, software projects, and learning roadmaps.
- **Milestone Engine**: Break projects into quantifiable milestones with target dates and dynamic completion percentages.
- **Budget Tracking**: Connect projects to estimated and actual financial costs.

### 💰 Complete Financial Operating System
- **Income & Cash Flow Tracking**: Real-time breakdown of recurring salaries, client retainers, dividends, and freelance income.
- **Expense Categorization**: Group spending across business, living, utilities, technology, and health.
- **Investments & Assets**: Track stocks, mutual funds, gold, real estate, and crypto portfolios with unrealized gains/losses.
- **Loans & Debt Manager**: Monitor borrowed and lent funds, repayment milestones, and remaining balances.
- **Localized Currency**: Native Bangladeshi Taka (`৳` BDT) display with global currency customization.

### 🛒 Smart Shopping & Inventory
- **Organized Checklists**: Group items by store, priority, or purchase frequency.
- **Estimated vs. Actual Cost**: Automatic subtotal and budget estimation before shopping.
- **One-Tap Fulfillment**: Move items directly from wishlists to purchase records.

### 📅 Schedule & Timeline Events
- **Agenda & Timeline View**: Visual chronological stream of upcoming meetings, renewals, deadlines, and milestones.
- **Smart Reminders**: Never miss subscription renewals, billing dates, or project deliverables.

### 🔐 Encrypted Vault (AES-256-GCM)
- **Zero-Knowledge Architecture**: Secrets are encrypted at rest using industry-standard `AES-256-GCM` with cryptographic authentication tags and unique initialization vectors (IV).
- **Secure Reveal Actions**: Plaintext is never exposed in client bundles or public endpoints; access requires authenticated server action verification with Clerk session validation.
- **Integrated Password Generator**: Create cryptographically secure high-entropy passwords on the fly.

### 🧩 Dynamic Custom Modules Engine
- **Custom No-Code Database**: Create your own custom entities (e.g., Book Tracker, Car Maintenance, Client CRM, Health Logs).
- **Schema-Driven Fields**: Supports text, number, date, select dropdowns, and boolean toggles.
- **Starter Blueprints**: Pre-configured templates to spin up new tracker collections in seconds.

### 🔍 Universal Quick Search (⌘K / Ctrl+K)
- **Instant Global Navigation**: Search across all tasks, projects, AI accounts, finances, notes, and custom records simultaneously.
- **Keyboard-First Design**: Fully accessible keyboard navigation for lightning-fast power-user workflows.

### 🔔 System Engine, Alerts & Cron Worker
- **Automated Background Cron**: `/api/cron` background worker executes scheduled maintenance, checks renewals, and generates alerts.
- **System Diagnostics**: Built-in system health inspector and full database backup JSON export.
- **Email Notifications**: Gmail SMTP integration for dispatching critical alerts and daily briefings.

### 📱 Progressive Web App (PWA)
- **Installable Native Experience**: Works seamlessly as a standalone app on macOS, Windows, Linux, iOS, and Android.
- **App Shortcuts**: Direct launch shortcuts into Tasks, AI Accounts, Projects, and Finance.
- **Offline Reliability**: Service worker caching and fallback support (`/~offline`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom Glassmorphic Dark UI |
| **Components** | [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts & Visuals** | [Recharts 3](https://recharts.org/) |
| **Database & ODM** | [MongoDB](https://www.mongodb.com/) + [Mongoose 8](https://mongoosejs.com/) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Security & Crypto** | Node.js `crypto` (`AES-256-GCM`) |
| **Form Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod 3](https://zod.dev/) |
| **PWA Engine** | [@ducanh2912/next-pwa](https://github.com/DuCanhDe/next-pwa) |
| **AI Integration** | [Google Gemini AI API](https://ai.google.dev/) |
| **Email Service** | Nodemailer / Gmail SMTP |

---

## ⚡ Architecture & Next.js 16 Proxy

Next.js 16 deprecated the old `middleware.ts` naming convention in favor of **`proxy.ts`**. 

Habit strictly adheres to this standard:
- [`proxy.ts`](proxy.ts) operates as a zero-overhead request proxy, enforcing Clerk authentication across protected app routes.
- Public routes (`/sign-in`, `/sign-up`, `/manifest.webmanifest`, `/api/cron`, `robots.txt`, `sitemap.xml`) are cleanly whitelisted.
- Background worker endpoints like `/api/cron` are bypassed to ensure automated background sync execution without browser redirect loops.

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or higher (Node 20+ LTS recommended)
- **Package Manager**: `npm` (or `pnpm` / `yarn`)
- **MongoDB**: Local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **Clerk Account**: Free account at [clerk.com](https://clerk.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ninazmul/habit.git
cd habit

# 2. Install dependencies
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_ENCRYPTION_KEY=your_encryption_key_here

# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/habit?retryWrites=true&w=majority

# Optional: Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# Optional: Gmail SMTP Notification Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-sender@gmail.com
SMTP_PASSWORD=your-16-character-app-password
NOTIFICATION_EMAIL=your-recipient@gmail.com
```

### Running the Application

```bash
# Start local development server with Turbopack
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🗄️ Database Models

| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| **`Task`** | Task & habit tracking | `clerkId`, `title`, `description`, `priority`, `status`, `dueDate`, `tags`, `isHabit`, `streak` |
| **`AIAccount`** | AI roster & rotation | `clerkId`, `serviceName`, `accountEmail`, `planType`, `status`, `cooldownUntil`, `usageLimit` |
| **`Project`** | Projects & portfolios | `clerkId`, `title`, `description`, `status`, `progress`, `deadline`, `budget`, `color` |
| **`Milestone`** | Project milestones | `clerkId`, `projectId`, `title`, `targetDate`, `isCompleted` |
| **`Transaction`** | Ledger entries | `clerkId`, `title`, `amount`, `type` (income/expense), `category`, `date`, `paymentMethod` |
| **`Investment`** | Portfolio holdings | `clerkId`, `name`, `assetType`, `investedAmount`, `currentValue`, `returnPercentage` |
| **`Loan`** | Borrowed / lent debt | `clerkId`, `title`, `type` (borrowed/lent), `personName`, `totalAmount`, `remainingAmount` |
| **`Shopping`** | Shopping checklist | `clerkId`, `name`, `estimatedCost`, `category`, `priority`, `isPurchased` |
| **`Event`** | Schedule & timeline | `clerkId`, `title`, `startDate`, `endDate`, `location`, `reminderMinutes`, `isAllDay` |
| **`Vault`** | AES-256 encrypted secrets | `clerkId`, `title`, `category`, `encryptedData`, `iv`, `tag`, `notes` |
| **`CustomModule`**| User dynamic entities | `clerkId`, `name`, `slug`, `fields`, `records` |

---

## 🗺️ Main Application Routes

| Route | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| `/` | Daily Command Center | Executive KPI summary, task checklist, AI rotation, cash flow overview |
| `/tasks` | Tasks & Habits | Priority queues, habit streaks, status filters, date scheduling |
| `/ai-accounts` | AI Accounts | Service quota tracking, cooldown timers, account switcher |
| `/projects` | Projects | Project portfolios, milestone progress bars, deadlines |
| `/projects/[id]`| Project Detail | Dedicated project workspace, milestone checklist, project budget |
| `/finance` | Financial Hub | Income vs expense charts, category breakdowns, recent transactions |
| `/income` | Income Streams | Recurring salary, client retainers, freelance earnings tracker |
| `/shopping` | Shopping List | Checklist, estimated expenditure calculator, purchased filters |
| `/schedule` | Schedule | Upcoming timeline, agenda, renewals, milestone deadlines |
| `/vault` | Encrypted Vault | AES-256-GCM secure credentials, password generator, reveal action |
| `/custom-modules`| Custom Modules | Dynamic schema builder, custom tables, blueprint templates |
| `/settings` | System Settings | App configuration, theme toggles, JSON backup export, diagnostics |

---

## 📜 Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Compiles production-optimized build and executes TypeScript validation |
| `npm run start` | Boots the compiled Next.js production server |
| `npm run lint` | Runs ESLint syntax and code quality verification |

---

## 👤 Author & Credits

**N. I. Nazmul** — *RIZMEC*
- Website: [rizmec.com](https://www.rizmec.com/)
- GitHub: [@ninazmul](https://github.com/ninazmul)
- Email: [nazmulsaw@gmail.com](mailto:nazmulsaw@gmail.com)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

<div align="center">
  <sub>Built with ❤️ by RIZMEC for high-performance builders and personal mastery.</sub>
</div>
