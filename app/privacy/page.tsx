'use strict';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem',
      color: 'var(--text-color, #333)',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.7',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{
          textDecoration: 'none',
          color: '#0284c7',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.95rem'
        }}>
          ← Back to App
        </Link>
      </div>

      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.025em'
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Effective Date: July 4, 2026
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Our Commitment to Privacy
        </h2>
        <p>
          At <strong>The Special Education Navigator</strong>, we believe that educational records and personal data are strictly private. Because Individualized Education Programs (IEPs), 504 plans, and behavioral assessments contain protected health and personal information, we have built this application with a <strong>Zero-Trust Architecture</strong>.
        </p>
        <p>
          We do not collect, store, or monetize your personal information or your children's records. Everything remains under your complete control.
        </p>
      </section>

      <section style={{ 
        marginBottom: '2.5rem', 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        padding: '1.5rem' 
      }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0' }}>
          🛡️ Zero-Trust Offline Storage
        </h2>
        <p style={{ margin: '0 0 1rem 0' }}>
          All files, photo scans, transcripts, vector search embeddings, and insights you generate are stored <strong>exclusively on your physical device</strong> using the browser's local database (IndexedDB).
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>We operate no databases that store your uploaded documents or transcripts.</li>
          <li style={{ marginBottom: '0.5rem' }}>If you delete the app or clear your browser data/cache, all documents are permanently destroyed.</li>
          <li style={{ marginBottom: '0.5rem' }}>Your data never leaves your device except for transient AI processing as described below.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Transient AI Processing
        </h2>
        <p>
          To analyze documents, generate IEP summaries, and run the interactive AI Advocate chat, the app secure-connects via HTTPS to serverless cloud functions running on Vercel and requests processing from Google's Gemini API:
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Transient Ingestion:</strong> Your documents are read and translated into text and math vectors, which are immediately sent back to your phone to save. They are not saved or cached permanently on Vercel or any third-party server.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>No Model Training:</strong> The data sent to the Google Gemini API through this application is strictly not used to train Google's models or any machine learning algorithms.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Device Permissions Used
        </h2>
        <p>
          The application requests specific mobile system permissions to enable key features. These are used strictly locally:
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.8rem' }}>
            <strong>Camera:</strong> Used only when you choose to scan a physical piece of paper (like an assessment page) via photo. Images are resized locally on your device's canvas before secure transmission for text extraction.
          </li>
          <li style={{ marginBottom: '0.8rem' }}>
            <strong>Microphone / Audio Recording:</strong> Used only when you explicitly press the record button to transcribe a live IEP meeting (subject to local one-party consent regulations). The recording is converted to text and stored locally on your device.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Third-Party Links
        </h2>
        <p>
          For your convenience, the app links to Hawaii educational services (like the Special Parent Information Network - SPIN, and the Learning Disabilities Association of Hawaii - LDAH). We do not control and are not responsible for the privacy practices of these external websites.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Account Creation & Data Deletion Rights
        </h2>
        <p>
          To authenticate users and secure subscription features, we collect your email address and generate a unique user ID. This is the only personal data stored on our servers.
        </p>
        <p>
          You have the right to delete your account and all associated personal data at any time. To request deletion of your account and personal data, please contact us by emailing <strong>support@thespecialeducationnavigator.app</strong>. Upon receiving your request, we will permanently delete your account and email data from our database within 30 days.
        </p>
      </section>

      <footer style={{ 
        borderTop: '1px solid #e2e8f0', 
        paddingTop: '1.5rem', 
        marginTop: '3rem', 
        textAlign: 'center', 
        color: '#64748b', 
        fontSize: '0.85rem' 
      }}>
        <p>© 2026 The Special Education Navigator. Hawaii Special Education Advocacy Companion.</p>
      </footer>
    </div>
  );
}
