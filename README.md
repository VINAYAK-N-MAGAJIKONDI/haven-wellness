# Haven Mental Wellness — AI-Powered Companion Platform

> **A space to talk. A little more understanding, every day.**  
> A complete, empathetic AI mental wellness web platform built with **Next.js**, **Cloudflare Workers**, **Cloudflare D1 (SQLite)**, and the **Google Gemini API**, designed from the ground up for a **strict ₹0 (zero-cost) deployment budget**.

---

## 1. Product & Architecture Overview

Haven is designed not as a generic AI chatbot, but as a calm, reflective wellness sanctuary. It provides individuals with a safe, confidential environment to express difficult thoughts, reflect on emotional patterns, and connect with verified mental health professionals when human care is required.

### Important Product Boundary
> **Haven is a mental wellness support companion, not a licensed clinic, therapist, or emergency response unit.**  
> It does not diagnose mental illnesses, prescribe pharmaceuticals, claim clinical therapy credentials, or replace emergency crisis lines.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HAVEN CLIENT ARCHITECTURE                       │
│                                                                        │
│   Next.js 14 Static Export (HTML/CSS/JS) Hosted on Cloudflare Pages    │
│   ├── Landing Page, Chat Workspace, Emotion Insights Dashboard        │
│   ├── Memory Management, Consultant Directory, Settings & GDPR Portal   │
│   └── Admin Governance & Consultant Appointment Portals                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / Cookies
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER BACKEND (₹0 TIER)                  │
│                                                                        │
│   TypeScript + Hono Router on Edge                                     │
│   ├── Auth: Web Crypto PBKDF2 Passwords & SHA-256 Session Hashing      │
│   ├── Independent Safety & Risk Engine (Deterministic + Negation)      │
│   ├── Empathy-First Prompt Engine (Version-Controlled)                 │
│   ├── Emotion Classifier (13 Categories + User Self-Corrections)       │
│   ├── Cross-Session Memory Summarizer (Episodic + Semantic)            │
│   └── Pseudonymous Escalation & Referral Funnel Telemetry             │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │ Prepared SQL Queries                     │ Google AI Studio
               ▼                                          ▼ (Free Tier)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│     Cloudflare D1 (SQLite)   │          │      Google Gemini API       │
│  - Users & Consents          │          │  - Empathic Conversations    │
│  - Chat Sessions & Messages  │          │  - Structured Summaries      │
│  - Episodic/Semantic Memory  │          │  - Emotion Classification    │
│  - Mood Check-ins & Safety   │          │  - Model: gemini-1.5-flash   │
│  - Verified Consultants      │          │  - Model Configurable        │
└──────────────────────────────┘          └──────────────────────────────┘
```

---

## 2. Key Features

- **Empathetic AI Companion**: Guided by an empathy-first system prompt that prioritizes listening before advising, avoids hollow motivational fluff, and avoids forced positivity.
- **Independent Safety & Risk Detection Engine**: Evaluates incoming statements across 4 tiers (**LOW**, **MODERATE**, **HIGH**, **IMMINENT**). Context-aware with negation handling (e.g. *"I do not want to die"* or movie quotes do not trigger false alarms).
- **Verified Emergency Resources**: Direct one-tap connections to India emergency services:
  - **112**: National Emergency Line
  - **14416**: Tele-MANAS (24/7 National Tele-Mental Health Programme supported by NIMHANS)
  - **+91 9999 666 555**: Vandrevala Foundation
  - **1800-599-0019**: KIRAN Helpline
- **Cross-Session Memory Engine**:
  - **Episodic Memory**: Key themes and coping reflections extracted after session milestones.
  - **Semantic Memory**: Explicit user preferences (e.g., *"Prefer short breathing exercises"*).
  - **User Governance**: Full portal to view, edit, or delete memories with one click.
- **Emotion Analysis & Reflective Dashboard**:
  - Classifies 13 distinct emotions (*Happiness, Sadness, Anxiety, Fear, Anger, Frustration, Loneliness, Guilt, Hopelessness, Confusion, Calmness, Relief, Hopefulness*).
  - Recharts visualisations: Intensity line trends and distribution bar charts.
  - Users can submit daily 1–5 mood check-ins and override/correct any AI observation.
- **Verified Consultant Directory**: Real verified mental wellness institutions and clinical psychologists with credentials verification badges and pseudonymous booking redirects.
- **Privacy & GDPR Portability**:
  - Full archive export in JSON format.
  - Permanent account deletion ("Right to be Forgotten") wiping all records from D1.
  - Strict privacy: No raw conversation messages in analytics or admin logs.

---

## 3. Technology Stack (100% Free-Tier / ₹0 Budget)

| Layer | Technology | Free Tier Quota / Details |
|---|---|---|
| **Frontend** | Next.js 14 (Static Export), React 18, Tailwind CSS, Lucide, Recharts | Cloudflare Pages: **Unlimited requests**, 500 builds/mo |
| **Backend** | Cloudflare Workers, TypeScript, Hono Framework | Cloudflare Workers Free: **100,000 requests/day**, 10ms CPU/req |
| **Database** | Cloudflare D1 (Serverless SQLite) | Cloudflare D1 Free: **5 GB storage**, **5M rows read/day**, **100k writes/day** |
| **AI Model** | Google Gemini API (`gemini-1.5-flash`) | Google AI Studio Free Tier: **15 requests/minute**, **1M tokens/day** |
| **Security** | Web Crypto API (PBKDF2 with SHA-256) | Standard browser & Cloudflare V8 native cryptographic runtime |

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- Git

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd haven-wellness

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Copy `.env.example` in both folders or configure Worker vars:

In `backend/wrangler.toml`:
```toml
name = "haven-backend"
main = "src/index.ts"
compatibility_date = "2024-11-12"
compatibility_flags = ["nodejs_compat"]

[vars]
GEMINI_MODEL = "gemini-1.5-flash"
ENVIRONMENT = "development"
ADMIN_BOOTSTRAP_SECRET = "your_bootstrap_passphrase_here"

[[d1_databases]]
binding = "DB"
database_name = "haven_wellness_db"
database_id = "local-d1-haven-id"
migrations_dir = "../migrations"
```

Configure Worker secrets for Gemini:
```bash
# Set Gemini API key locally or via secret
# In dev: create a .dev.vars file inside backend/:
GEMINI_API_KEY="your_google_ai_studio_api_key"
ADMIN_BOOTSTRAP_SECRET="bootstrap_haven_admin_secret_2026"
```

In `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:8787"
NEXT_PUBLIC_APP_NAME="Haven Mental Wellness"
```

### 3. Run Database Migrations Locally
```bash
cd backend
npx wrangler d1 migrations apply haven_wellness_db --local
```

### 4. Run Development Servers
In terminal 1 (Backend Worker on port `8787`):
```bash
cd backend
npm run dev
```

In terminal 2 (Frontend Next.js on port `3000`):
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to interact with the Haven platform!

---

## 5. Automated Testing & Verification

Haven includes a full test suite covering cryptography, safety rules, emotion classifications, API integration, and synthetic benchmarks.

### 1. Run Backend & Integration Tests (Vitest)
```bash
cd backend
npm test
```
**Test Results**: 20/20 tests passing across:
- `test/safety.test.ts`: 7 tests passing (Imminent attempts, high ideation, negation checks, false positives, session risk persistence, verified Indian crisis numbers).
- `test/emotion.test.ts`: 4 tests passing (Anxiety, happiness, loneliness, frustration validation).
- `test/crypto.test.ts`: 2 tests passing (PBKDF2 100,000-round password hashing, SHA-256 token hashing).
- `test/integration.test.ts`: 7 tests passing (Health check, crisis resources, registration, login, authenticated `/me`, chat message response generation).

### 2. Run Synthetic Risk Detection Benchmark
```bash
node evals/safety_eval.js
```
**Benchmark Results**: 16/16 test scenarios passing (100% accuracy) covering direct statements, indirect statements, negations, book/movie references, and idiomatic phrases (*"killing it at work"*, *"dead tired"*).

### 3. Verify Static Export Build
```bash
cd frontend
npm run build
```
Generates 100% static HTML/CSS/JS export in `frontend/out`.

---

## 6. Cloudflare Deployment Instructions (₹0 Cost)

### Step 1: Create Free Cloudflare D1 Database
```bash
cd backend
npx wrangler d1 create haven_wellness_db
```
Copy the returned `database_id` into `backend/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "haven_wellness_db"
database_id = "<your-production-database-id>"
```

### Step 2: Apply Migrations to Remote D1
```bash
npx wrangler d1 migrations apply haven_wellness_db --remote
```

### Step 3: Configure Worker Production Secrets
```bash
npx wrangler secret put GEMINI_API_KEY
# Enter your free Google AI Studio API key

npx wrangler secret put ADMIN_BOOTSTRAP_SECRET
# Enter your secure administrator passphrase
```

### Step 4: Deploy the Cloudflare Worker Backend
```bash
npm run deploy
```
Your backend will be live at `https://haven-backend.<your-subdomain>.workers.dev`.

### Step 5: Deploy Next.js Frontend to Cloudflare Pages
1. Build the production static assets:
```bash
cd ../frontend
# Point API URL to your deployed Worker
$env:NEXT_PUBLIC_API_URL="https://haven-backend.<your-subdomain>.workers.dev"
npm run build
```
2. Deploy the `out/` folder to Cloudflare Pages for free:
```bash
npx wrangler pages deploy out --project-name=haven-wellness
```
Your frontend will be accessible at `https://haven-wellness.pages.dev`.

---

## 7. Security, Privacy & Quota Limitations

1. **Free-Tier Limits**:
   - **Google Gemini API Free Tier**: 15 requests per minute (RPM). If multiple concurrent requests trigger a 429 quota, Haven displays a polite, calming pause message without crashing.
   - **Cloudflare Workers Free Tier**: 100,000 requests per day.
   - **Cloudflare D1 Free Tier**: 5GB database storage, 5 million row reads/day.
2. **Security Protections**:
   - Web Crypto PBKDF2 with 100,000 iterations for password hashing with unique random salt.
   - All session tokens are stored as SHA-256 hashes in SQLite; raw session tokens never touch the database.
   - Strict CORS configuration and security headers (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`).
3. **Privacy Integrity**:
   - No raw conversational messages are stored in analytics tables or accessible via the admin dashboard.
   - User data export and permanent account deletion are fully supported.
   - Cross-session memory is strictly guarded by user consent.

---

## 8. License & Disclaimers

Distributed under the MIT License.  
Haven is developed as a zero-cost demonstration of empathetic AI architecture and crisis escalation workflows.
