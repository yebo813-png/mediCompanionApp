# Billing Overview & Open AI Model Switcher Architecture

An executive financial analytics and billing intelligence suite for South African medical practices, paired with an open AI model management engine supporting free-tier Gemini models and custom AI providers.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate the choices confirmed in Phase 1:
> - **Navigation & Placement**: Dedicated `Billing Overview` menu tab accessible from the top navigation bar, plus a live interactive financial widget card on the primary Dashboard and Practice Diary view.
> - **Data Visualization**: Interactive, lightweight Tailwind-styled SVG charts featuring smooth curves, hover tooltips, status-filtered data slices, and aging buckets (0–30 days, 31–60 days, 61–90 days, 90+ days).
> - **Open AI Model Switcher**: In-app model selector supporting free Google Gemini models (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`), alongside configurable endpoints for external models (OpenRouter, DeepSeek, HuggingFace, Ollama, and custom OpenAI-compatible endpoints) with local key management and seamless fallback.

---

### 1. Overview & Core Concept

- **What It Does**:
  - **Financial Intelligence**: Equips doctors and practice billing administrators with real-time insight into practice collections, medical scheme claims turnaround, payment aging backlogs (current, 30, 60, 90+ days), and rejection distributions across South African medical aids (Discovery Health, GEMS, Bonitas, Medscheme, Momentum).
  - **Open AI Model Engine**: Provides an accessible, in-app model drawer and status indicator allowing doctors to choose which AI model powers their clinical notes analysis, appointment triage, and diagnostic assistant—defaulting to free-tier Gemini models without requiring paid subscriptions, with the ability to configure any custom or local AI model.
- **Target Audience / Persona**: South African general practitioners, medical specialists, and practice managers running private or group practices who need automated financial reconciliation and customizable AI assistance.
- **Key Value**: Replaces opaque paper or disconnected switch reconciliations with clear SVG visual analytics, accelerates debt collection on aging claims, and removes AI provider lock-in.

---

### 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Brand, Switch Status, AI Model Pill ("Gemini 3.8 Flash (Free) ▾"), Doctor     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Nav Menu: [Practice Diary] [Patient Files] [AI Assistant] [Billing Overview ★] ...     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Billing Overview Workspace:                                                            │
│ ┌──────────────────────────┬──────────────────────────┬──────────────────────────────┐ │
│ │ Monthly Revenue Trend    │ Claims Distribution      │ Payment Aging Buckets        │ │
│ │ (SVG Bar & Line Chart)   │ (Interactive SVG Donut)  │ (Stacked 30/60/90+ day Bars) │ │
│ └──────────────────────────┴──────────────────────────┴──────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Medical Scheme Breakdown & Reconciliation Ledger (Discovery, GEMS, Bonitas, etc.)  │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key User Flows
1. **Navigating to Billing Overview**:
   - The doctor clicks the **Billing Overview** tab in the main navigation (or clicks the **Billing Overview widget** on the Practice Diary / Dashboard).
   - The view presents monthly gross billings vs. cash collections, claim adjudication success rates, and outstanding debt aging.
2. **Interacting with SVG Charts**:
   - Hovering over monthly bars displays exact gross billings, settled payments, and co-payment shortfalls in ZAR with formatted tabular numbers (`R 142,500.00`).
   - Clicking slices on the Claims Distribution Donut filters the underlying reconciliation table by status (`Adjudicated & Paid`, `Partially Paid`, `Pending Pre-Auth`, `Rejected`).
   - The Payment Aging chart highlights claims past 60 and 90 days with a 1-click `"Generate Scheme Follow-up / Remittance Resubmit"` action.
3. **Switching AI Models (In-App Drawer)**:
   - The doctor clicks the AI Model indicator in the header or the settings cog in the AI Assistant.
   - An intuitive modal presents **Free Tier Google Gemini Models** (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) as zero-setup defaults.
   - A **Custom & Alternative Models** tab allows entering any OpenAI-compatible API base URL (e.g. OpenRouter, DeepSeek API, Ollama localhost, or HuggingFace) with optional API key input stored securely in browser session/local storage.

#### Visual Identity & Theme
- **Dominant Neutral Canvas**: Deep slate foundation (`#0B1120` and `#0F172A`) matching MedSwitch SA's existing clinical command posture.
- **Color Accent Discipline**:
  - Emerald (`#10B981`): Settled / Paid claims and positive revenue growth.
  - Cyan (`#06B6D4`): Routine GP consultations and primary interactive controls.
  - Amber (`#F59E0B`): 30–60 day aging claims and partial payments / co-payments.
  - Rose / Red (`#EF4444`): 90+ day aging claims, switch rejections, and PMB dispute flags.
  - Purple (`#8B5CF6`): Open-source & alternative AI models.
- **Typography**: Display titles in clean semi-bold sans; all currencies, dates, claim IDs, and chart labels use monospace tabular figures (`font-mono tabular-nums`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native SVG vs. Bulky External Chart Libraries**:
  - *Chosen Approach*: Lightweight, custom React SVG charts tailored specifically for medical billing (bar chart, donut ring, aging stacked timeline) without external charting dependencies.
  - *Why*: Eliminates bundle bloat, ensures instant render performance, prevents canvas scaling artifacts on retina displays, and allows precise Tailwind theme synchronization.
  - *Alternatives Considered*: Recharts / Chart.js (adds ~150KB bundle weight and rigid styling constraints).
- **Decision 2: Dual Integration (Dedicated View + Dashboard Widget)**:
  - *Chosen Approach*: Provide a rich dedicated `BillingOverview.tsx` view linked from the main navigation menu, while updating the right-column billing widget in `PracticeDiary.tsx` / `Dashboard.tsx` with a quick link to expand the full financial overview.
  - *Why*: Satisfies the user's preference to toggle from the menu when needed while keeping instant high-level financial health visible on the daily diary desk.
- **Decision 3: Universal AI Model Abstraction Layer**:
  - *Chosen Approach*: Implement a flexible client/server proxy pattern where requests pass through the backend endpoint with model provider parameters. If set to Gemini, the server leverages `@google/genai` with `gemini-3.8-flash` or `gemini-3.1-flash-lite`. If set to a custom or open-source endpoint (e.g., DeepSeek / OpenRouter / Ollama), the backend routes the prompt according to the configured endpoint and key.
  - *Why*: Guarantees that any model can be selected while preserving free out-of-the-box operation and strict safety.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Application                            │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Navigation & Top Bar  │  │ App State (Active View, Claims, AI)   │  │
│  └──────────┬────────────┘  └──────────────────┬────────────────────┘  │
│             │                                  │                       │
│             ▼                                  ▼                       │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ BillingOverview.tsx   │  │ ModelSwitcherModal.tsx                │  │
│  │ - MonthlyRevenueChart │  │ - Free Gemini Tier (3.8 Flash, Lite)  │  │
│  │ - ClaimsDonutChart    │  │ - Custom Endpoint / OpenRouter / Any  │  │
│  │ - AgingTrendChart     │  │ - Connection Test & Active Indicator  │  │
│  │ - SchemeReconTable    │  └──────────────────┬────────────────────┘  │
│  └───────────────────────┘                     │                       │
└────────────────────────────────────────────────┼───────────────────────┘
                                                 │
                                 POST /api/ai/universal-chat
                                 POST /api/gemini/analyze-appointments-urgency
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server (server.ts)                      │
│                                                                        │
│  ┌───────────────────────────────────┐  ┌───────────────────────────┐  │
│  │ @google/genai SDK Handler         │  │ Custom / Open Provider    │  │
│  │ - gemini-3.8-flash (Free default) │  │ - OpenRouter, DeepSeek,   │  │
│  │ - gemini-3.1-flash-lite           │  │   Ollama, HuggingFace     │  │
│  └───────────────────────────────────┘  └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Components & Deliverables
1. **`src/components/BillingOverview.tsx`**:
   - Executive revenue metrics: Month-to-date billed, collected, outstanding co-payments, and collection ratio.
   - **Monthly Revenue Chart**: Interactive SVG multi-bar & trend line illustrating last 6 months of practice financial performance.
   - **Claims Status Distribution Donut**: SVG donut chart showing breakdown by `Adjudicated Paid`, `Partially Paid`, `Pending Pre-Auth`, and `Rejected`.
   - **Payment Aging Analysis**: Visual aging timeline (Current <30d, 31–60d, 61–90d, >90d overdue) with medical aid debtors analysis.
   - **Medical Scheme Reconciliation Table**: Detailed scheme performance for Discovery Health, GEMS, Bonitas, Medscheme, and private cash.
2. **`src/components/ModelSwitcherModal.tsx` & Header Integration**:
   - Header badge displaying current active model (e.g., `⚡ Gemini 3.8 Flash (Free)`).
   - In-app switcher modal with one-click selection of free models (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) and custom endpoint configuration (Base URL, Model Name, API Key) allowing any open-source or custom model to be used.
3. **Integration into Navigation & Dashboard**:
   - Navigation item in `Navigation.tsx` for `Billing Overview`.
   - Updated widget on `PracticeDiary.tsx` / `Dashboard.tsx` with one-click navigation to the billing view.
   - AI assistant updated to run requests through the selected model.
