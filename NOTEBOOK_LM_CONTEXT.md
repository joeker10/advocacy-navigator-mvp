# Special Education Navigator: Technical & Architectural Context
*Generated for NotebookLM Ingestion*

## Overview
The Special Education Navigator is a multimodal AI advocacy application designed for parents navigating the special education system in Hawaii. Its primary objective is to equalize the power dynamic between schools and parents by democratizing legal analysis of Individualized Education Programs (IEPs), 504 plans, and psychological assessments.

## Core Architectural Pillars

### 1. Zero-Trust Local Storage & Privacy
Because IEPs contain heavily protected Protected Health Information (PHI) and Personally Identifiable Information (PII) regulated under HIPAA and FERPA, this application utilizes a "Zero-Trust" architectural model:
- The backend server (Vercel) acts strictly as a transient tunnel. It holds no databases.
- When an IEP is analyzed, the resulting structured JSON data and 768-dimensional mathematical vector embeddings are stored **exclusively on the user's physical device** using the browser's `IndexedDB` API (via the Dexie wrapper).
- If the user deletes the app or clears their browser cache, the data is permanently destroyed.

### 2. The Multimodal Staging Area
Educational documents are rarely perfectly formatted PDFs. They are often crumpled, multi-page handwritten behavioral logs or photos of matrices. The app employs a Document Staging Area:
- Users can photograph individual pages of an IEP in sequence.
- The UI resizes and compresses these images on the client-side (via HTML5 Canvas) to bypass strict serverless payload limits.
- The user queues the photos in order and submits them in a single batch.
- **Gemini 1.5 Flash Integration:** The Vercel API ingests the entire array of media simultaneously. Gemini's massive multimodal context window allows it to inherently understand that 5 separate images represent 5 sequential pages of a single document, resulting in one unified legal extraction.
- **Meeting Audio:** The app also utilizes the `MediaRecorder` API to capture and transcribe live IEP meetings, treating audio as just another document type.

### 3. Agentic RAG (Retrieval-Augmented Generation)
The app features an interactive Chat Panel that acts as a legal advocate. It uses a Vector Search mechanism built entirely in JavaScript:
- When the backend analyzes an IEP, it generates a 768-D semantic vector utilizing the `text-embedding-004` model.
- When a parent asks a question in the chat (e.g., "What are my child's reading goals?"), the app converts the question into a vector and mathematically calculates the **Cosine Similarity** against every document in the offline vault.
- The most relevant chunks of past IEPs and assessments are pulled locally and injected into the system prompt.
- This allows Gemini to instantly cross-reference multiple years of historical documents to flag inconsistencies or missing services (e.g., "The 2023 psychological assessment recommended occupational therapy, but it is missing from the 2024 IEP").

### 4. Hybrid Native Mobile Bridge (Capacitor)
To publish the app to Google Play and the Apple App Store, the Next.js React frontend is exported statically (`output: 'export'`) and wrapped in Ionic Capacitor.
- The UI runs locally on the phone's native WebView, requiring no internet to load.
- It relies on physical hardware permissions (`CAMERA` and `RECORD_AUDIO`) injected into the Android/iOS manifests.
- The static app securely proxies its API requests to the cloud-hosted Vercel backend using environment variables (`NEXT_PUBLIC_API_URL`), protecting the core Google API keys from being reverse-engineered by malicious actors.

## Legal Directives & Constraints
- The AI is strictly prompted to operate under the legal framework of **Hawaii Administrative Rules (HAR) Chapter 60**.
- The AI must explicitly avoid providing binding legal counsel, appending appropriate legal disclaimers to its output.
- The system enforces "One-Party Consent" legal disclaimers within the UI before allowing audio transcription.
