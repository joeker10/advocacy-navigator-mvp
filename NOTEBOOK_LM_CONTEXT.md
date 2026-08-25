# Special Education Navigator: Comprehensive Technical & Architectural Context
*Optimized for Google NotebookLM Ingestion & In-Depth Analysis*
*Last Updated: August 2026 | Build 160 (v1.0.160)*

---

## 1. Executive Summary & Purpose

**The Special Education Navigator** is an offline-first, multimodal AI advocacy application specifically engineered to empower parents and guardians of special education students in Hawaii. 

Navigating the special education system is legally intricate, emotionally taxing, and structurally imbalanced. Parents are expected to participate as equal members of the Individualized Education Program (IEP) team, yet they often face hundreds of pages of complex educational evaluations, psychometric tests, and dense procedural documentation governed by state and federal laws.

The Navigator equalizes this power dynamic by democratizing the extraction, analysis, and cross-referencing of IEPs, Section 504 accommodation plans, and clinical assessments against the compliance standards of **Hawaii Administrative Rules (HAR) Title 8 Chapter 60** and the federal **Individuals with Disabilities Education Act (IDEA)**.

---

## 2. Core Architectural Pillars

### 2.1. Zero-Trust Local Storage & Strict Privacy by Design
Educational records contain sensitive Protected Health Information (PHI) and Personally Identifiable Information (PII) regulated under FERPA and HIPAA. To ensure uncompromising privacy:
- **Client-Side Storage**: Structured IEP data, child profiles, and 768-dimensional mathematical vector embeddings are stored locally on the user's physical device via `IndexedDB` (using the native `idb` engine with version 4 schema).
- **Transient Cloud Processing**: The backend server (Vercel Serverless / Node.js) acts strictly as a stateless processing tunnel for document extractions and AI synthesis.
- **Data Isolation & Encryption**: UUIDs are cryptographically generated on-device via `crypto.randomUUID()`. Data can be wiped instantly by the parent.

### 2.2. Multimodal Document Staging & OCR Pipeline
Special education records are rarely clean PDFs; they frequently consist of handwritten behavioral charts, photographed assessment matrices, or multi-page printed packets.
- **Client-Side Compression**: The app leverages HTML5 Canvas to resize and compress photos on the client before upload, circumventing serverless payload constraints.
- **Multi-Page Synthesis**: Users can queue sequential camera photos or multi-page PDFs. Google Gemini's multimodal context processes the full array simultaneously, understanding that sequential images comprise a single, unified document.
- **Google Docs & Drive Importer**: Direct 1-tap import allows parents to paste Google Docs share links for automated text extraction.
- **Live Camera Scanner**: Dedicated camera viewfinder supporting Letter (8.5" x 11") and Legal (9:16) aspect ratios with edge-to-edge preview.
- **Meeting Audio Transcription**: Captures and transcribes IEP meetings under Hawaii's one-party consent framework.

### 2.3. Agentic RAG (Retrieval-Augmented Generation) & Semantic Vector Search
The built-in AI Advocate features client-side Vector Search implemented in pure TypeScript/JavaScript:
- When an IEP or assessment is analyzed, a 768-dimensional semantic embedding is generated using the `text-embedding-004` model.
- When a parent asks a question in the chat (e.g., *"Did the doctor recommend speech therapy, and is it in the current IEP?"*), the query is vectorized and compared against every document in the local vault using **Cosine Similarity**.
- Relevant historical chunks are dynamically injected into the system prompt, enabling the AI to cross-reference multiple years of historical evaluations to flag inconsistencies, missing services, or dropped accommodations.

### 2.4. Hybrid Native Mobile Architecture (Ionic Capacitor + Next.js)
The app is engineered with Next.js (React) configured for static export (`output: export`) wrapped in **Ionic Capacitor 8**:
- Runs natively on Android (`app.thespecialeducationnavigator`) and iOS with offline startup capability.
- Communicates securely with cloud endpoints via centralized API clients (`lib/api.ts`) using authorization tokens.
- Native hardware bridge for Camera (`@capacitor/camera`), Filesystem (`@capacitor/filesystem`), and Share (`@capacitor/share`).
- Hardened WebView security with `allowMixedContent: false` and secure sandbox isolation.

---

## 3. Key Features & Legal Tools

### 3.1. ⏱️ IEP Milestone & Statutory Timeline Tracker (`components/TimelineTracker.tsx`)
Calculates real-time countdowns and compliance deadlines based on statutory Hawaii and federal mandates:
- **Annual IEP Review**: Calculates days remaining to the 365-day statutory deadline under **HAR §8-60-48(a)**.
- **Triennial Re-evaluation**: Tracks the 3-year mandatory comprehensive re-evaluation window under **HAR §8-60-35(a)(2)**.
- **60-Day Initial Evaluation Rule**: Enforces the Hawaii 60-calendar-day timeline from signed parental consent to eligibility determination under **HAR §8-60-31(c)**.
- **Color-Coded Status**: Green (Compliant / >45 days), Amber (Upcoming / 15–45 days), and Red (Urgent / Overdue).

### 3.2. 📋 Interactive IEP Meeting Prep Checklist (`components/MeetingPrepChecklist.tsx`)
A chronological parent preparation guide with persistent progress tracking:
- **1–2 Weeks Prior**: Request comprehensive evaluation reports (HAR §8-60-35), draft Parent Concerns Statement (HAR §8-60-44(a)(1)), gather private provider recommendations.
- **3 Days Prior**: Request and review the draft IEP, verify SMART criteria for annual goals.
- **Day of Meeting**: Bring an advocate or support person, confirm audio recording notice, verify required team members (General Ed, Special Ed, LEA Admin, Related Services under HAR §8-60-45).
- **Post-Meeting Review**: Request Prior Written Notice (PWN) for any denied service or placement (HAR §8-60-58) before signing consent.

### 3.3. 📖 Special Education & Hawaii Chapter 60 Glossary (`components/GlossaryModal.tsx`)
Searchable index of core special education legal terms, acronyms, and statutory cross-references:
- **Core Acronyms**: FAPE (Free Appropriate Public Education), LRE (Least Restrictive Environment), PWN (Prior Written Notice), MDR (Manifestation Determination Review), PLEP/PLAAFP (Present Levels of Performance), AT (Assistive Technology), BIP (Behavior Intervention Plan), FBA (Functional Behavioral Assessment), ESY (Extended School Year), IEE (Independent Educational Evaluation), Section 504, IDEA.
- **Hawaii Context**: Explanations of HAR Title 8 Chapter 60 and local resources including LDAH (Leadership in Disabilities & Achievement of Hawaii).

### 3.4. 📄 1-Tap Advocacy Brief Export (`components/ExportModal.tsx`)
Generates a structured, professional advocacy report compiling:
- Student Profile Information
- Extracted Present Levels of Academic and Functional Performance (PLEP)
- Classroom & Testing Accommodations
- Measurable Annual Goals
- Saved AI Insights & Compliance Observations
- **Export Options**: 1-Tap formatted Print-to-PDF or Clipboard Copy for emailing IEP team members.

### 3.5. 💬 Persistent Offline Chat History (`lib/indexeddb.ts`)
- Chat conversations are automatically saved in IndexedDB (`chat_history` store) and reloaded across app restarts.
- Full offline access to past advice, with 1-tap "Save Insight" to the permanent vault and "Clear Chat" management.

### 3.6. 👦 Multi-Child Profile Management
- Supports multiple student profiles with dedicated records, goals, and document filtering.
- Family link accounts allowing primary subscribers to share unlimited access with up to 4 family members.

---

## 4. Security, Hardening & Guardrails

| Security Layer | Implementation Details |
|---|---|
| **Authentication** | Server-side Google OAuth validation via Google's `tokeninfo` endpoint; strictly enforced production `JWT_SECRET`; optional 2-Factor Email OTP authentication. |
| **Abuse Prevention** | Sliding-window in-memory rate limiting (`lib/rate-limit.ts`) protecting login, registration, coupon redemption, and chat endpoints. |
| **Chat Guardrails** | Query length limits (1,000 chars for free tier; 10,000 for subscribed users); regex prompt injection sanitization; output XSS HTML sanitization (`lib/sanitize.ts`). |
| **HTTP Security Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`. |
| **Database Optimization** | Foreign key `@@index` annotations across all Prisma models for scalable relational queries. |
| **Crash Protection** | React `ErrorBoundary` wrapper preventing white-screen crashes and offering seamless session reload. |

---

## 5. Technology Stack Summary

- **Frontend Framework**: Next.js (React 19), TypeScript
- **Styling**: Modern CSS Glassmorphism with dark/light themes and Polynesia/Hawaii cultural accents (Honu and Kapa motifs)
- **AI & ML Engine**: Google Gemini API (Multimodal 1.5 / 2.5 / Flash), `text-embedding-004`
- **Client Database**: IndexedDB (native `idb` wrapper, Schema v4)
- **Serverless Backend**: Next.js API Routes (Vercel / Node.js runtime)
- **Database ORM**: Prisma ORM with PostgreSQL
- **Mobile Runtime**: Ionic Capacitor (Android Studio / Gradle / Xcode)
- **Distribution**: Google Play Store (`app.thespecialeducationnavigator`)

---

## 6. Statutory & Legal Citations Index

- **Hawaii Administrative Rules (HAR) Title 8 Chapter 60**: State of Hawaii Department of Education Special Education Regulations
  - §8-60-2: Definition of FAPE
  - §8-60-15: Least Restrictive Environment (LRE)
  - §8-60-17: Extended School Year Services (ESY)
  - §8-60-31(c): 60-Day Initial Evaluation Rule
  - §8-60-35: Comprehensive Re-evaluations (Triennial Rule)
  - §8-60-44: IEP Content & Parent Concerns Statement
  - §8-60-45: IEP Team Member Attendance & Excusal
  - §8-60-48: Annual IEP Review Timeline & Assistive Technology
  - §8-60-57: Independent Educational Evaluation (IEE)
  - §8-60-58: Prior Written Notice (PWN)
  - §8-60-75: Manifestation Determination Review (MDR)
- **Federal Laws**:
  - Individuals with Disabilities Education Act (IDEA), 20 U.S.C. §1400 et seq.; 34 CFR Part 300
  - Section 504 of the Rehabilitation Act of 1973, 29 U.S.C. §794; 34 CFR Part 104
  - Family Educational Rights and Privacy Act (FERPA), 34 CFR Part 99
