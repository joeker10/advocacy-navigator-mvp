# Special Education Navigator: App Overview & Features

This document provides a comprehensive summary of the Special Education Navigator application, including its core architectural philosophy, user features, subscription models, and coupon redemption workflows.

---

## 🌟 Core Features

### 1. Zero-Trust Local Storage & Absolute Privacy
* **PHI & PII Protection**: Since IEP documents contain highly sensitive Protected Health Information (PHI) and Personally Identifiable Information (PII) regulated under HIPAA and FERPA, the application operates on a zero-trust model.
* **IndexedDB Storage**: The backend server acts strictly as a transient tunnel. Extracted data, document vectors, and chat history are saved **exclusively on the user's physical device** using the browser's local `IndexedDB` database. Clearing browser data or deleting the app permanently erases the data.

### 2. Multimodal Staging Area
* **Batch Photo Processing**: Users can photograph or scan multiple paper pages of an IEP in sequence.
* **Canvas Compression**: Images are compressed client-side via HTML5 Canvas before uploading to bypass strict serverless payload limits.
* **Single Batch Ingestion**: All pages are sent to Gemini in a single prompt context, enabling the AI to read multi-page documents as a single cohesive report.
* **Audio Transcription**: Captures live IEP meetings using the native `MediaRecorder` API and transcribes them directly into the context.

### 3. Agentic RAG (Retrieval-Augmented Generation)
* **Local Vector Math**: When a document is analyzed, the app retrieves semantic embeddings from Gemini and computes **Cosine Similarity** locally in JavaScript.
* **Cross-Document Analysis**: The chat interface pulls context across multiple historical IEPs or psychological reports to identify contradictions, missing services, or year-over-year progress changes.
* **HAR Chapter 60 Alignment**: The AI advocates under the legal framework of **Hawaii Administrative Rules (HAR) Chapter 60**, checking documents specifically for Hawaii state compliance.

### 4. Saved Insights & Reader Mode Controls
* **Saved Insights Directory**: click-to-save insights organized by child profiles or in a general offline vault.
* **Reader Controls**: Individual saved insights can be viewed in a minimalist reader layout with options to:
  * **Scale text sizes** (Small, Medium, Large, Extra Large).
  * **Toggle Dark/Light Mode** instantly.
  * **Print** the formatted insight cleanly (omitting nav elements).
  * **Download as a `.txt`** file.
* **Sorting & Ordering**: Sort saved insights lists in ascending/descending order by date or custom names.

---

## 💳 Subscription Levels & Limits

The application enforces specific tier limits to encourage native app downloads and handle costs sustainably:

| Tier | Environment | Features Included | Limits & Constraints |
| :--- | :--- | :--- | :--- |
| **Guest Web App** | Mobile/Desktop Web Browser | 1 initial document extraction & inquiry. | **Locked after 1 inquiry**. Invited to download the mobile app. |
| **Free Mobile App** | iOS & Android Native Apps | Local storage, camera scanning, tutorials, videos, and FAQs. | **5 free document insights** reset every calendar month. |
| **Paid Premium** | Web & Native Apps | Unlimited analyses, organized Child folder profiles, Family & Advocate sharing (up to 4 accounts), advanced Reader Mode. | No limits. Can be unlocked via **Stripe web payments** or **Coupon codes**. |

---

## 🎫 Coupon Code & Invalidation Flow

* **Single-Use Coupons**: The database schema supports dynamically generated coupon codes. When a code is redeemed via the Settings menu, the `/api/auth/redeem` route instantly marks the coupon as `isActive = false`.
* **Account Migration & Promo Support**: Since database coupons are single-use, they are perfect for:
  * Transferring a subscription from a web-only visitor to a native mobile app.
  * Distributing promotional codes to influencers, advocates, or teachers.
  * Migrating web payments (e.g. Stripe checkout) into the native app.

---

## 📱 Mobile Hybrid Construction (Capacitor)
* **WebView Integration**: Ionic Capacitor compiles the Next.js static output into native Xcode (iOS) and Android Studio configurations.
* **Hardware Bridges**: Injects camera and microphone permissions natively into iOS/Android manifests.
* **Secure Proxies**: Protects Google API keys by routing requests securely through a transient Vercel endpoint rather than embedding keys inside the app package.
