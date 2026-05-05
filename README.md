# Special Education Navigator

A highly secure, privacy-first advocacy platform designed to empower parents of special education students in Hawaii. The platform utilizes advanced multimodal AI (Gemini 1.5 Flash) and Agentic RAG to extract, analyze, and cross-reference complex legal documents (IEPs, 504s, psychological assessments) against Hawaii Administrative Rules (HAR) Chapter 60 compliance standards.

## Core Features
- **Zero-Trust Offline Vault:** All extracted data and 768-D vector embeddings are stored locally on the user's device via IndexedDB. No PII is permanently stored on external servers.
- **Multimodal Document Staging:** Parents can queue multiple PDF documents, high-resolution photographs of handwritten notes (compressed client-side), or audio meeting recordings. The system synthesizes disjointed pages into a single, cohesive legal extraction.
- **Agentic RAG Assistant:** An interactive AI Advocate that searches the local device vault using semantic vector similarity, allowing parents to instantly identify missing accommodations or unmet legal requirements across years of documentation.
- **Native Mobile Bridge:** The application is architected as a static Next.js frontend wrapped in Ionic Capacitor for native iOS/Android deployment, while securely proxying extraction tasks to a Vercel Serverless backend.

## Tech Stack
- **Frontend:** Next.js (React), Vanilla CSS (Glassmorphism UI)
- **AI Engine:** Google Gemini 1.5 Flash (Multimodal OCR/Transcription), `text-embedding-004` (Semantic Search)
- **Database:** Local IndexedDB (Dexie/IDB) with Client-Side Vector Storage
- **Mobile Wrapper:** Ionic Capacitor

## Development Setup

```bash
# Install dependencies
npm install

# Start local web development server
npm run dev

# Compile Static Export & Sync to Native Mobile
CAPACITOR_BUILD=true NEXT_PUBLIC_API_URL=https://advocacy-navigator-mvp.vercel.app npm run build
npx cap sync
```
