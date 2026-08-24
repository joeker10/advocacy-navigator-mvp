'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  googleDocUrl: string;
  setGoogleDocUrl: (url: string) => void;
  isImportingGoogleDoc: boolean;
  handlePasteAndImport: () => Promise<void>;
  handleGoogleDocImport: () => Promise<void>;
}

export function GoogleDocModal({
  isOpen,
  onClose,
  googleDocUrl,
  setGoogleDocUrl,
  isImportingGoogleDoc,
  handlePasteAndImport,
  handleGoogleDocImport,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Polynesian Kapa Accent Bar */}
        <div className="kapa-accent-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)', margin: 0 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="var(--primary)">
              <circle cx="50" cy="55" r="22" />
              <circle cx="50" cy="22" r="8" />
              <path d="M50 22 L50 33 M25 45 Q10 30 5 50 M75 45 Q90 30 95 50 M30 72 Q10 85 8 72 M70 72 Q90 85 92 72" stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
            Import Google Doc / Drive
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* 3 Simple Steps Banner */}
        <div style={{ padding: '1rem 1.25rem', borderRadius: '14px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📌</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--foreground)' }}>How to Import Any Google Doc in Seconds:</strong>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: 1.4 }}>
            <div><strong>1.</strong> In the Google Docs or Drive app, open your document.</div>
            <div><strong>2.</strong> Tap <strong>Share</strong> (or <strong>... &rarr; Share & export &rarr; Copy link</strong>).</div>
            <div><strong>3.</strong> Return here and tap <strong>📋 Paste Link & Import</strong> below!</div>
          </div>
        </div>

        {/* 1-Tap Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePasteAndImport}
            disabled={isImportingGoogleDoc}
            style={{
              flex: '1 1 200px',
              padding: '1rem',
              borderRadius: '14px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isImportingGoogleDoc ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            {isImportingGoogleDoc ? '⏳ Importing Doc...' : '📋 Paste Link & Import Now'}
          </button>

          <a
            href="https://docs.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: '1 1 140px',
              padding: '1rem',
              borderRadius: '14px',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontWeight: 650,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
            }}
          >
            🌐 Open Google Docs
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5 }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>OR PASTE / EDIT LINK</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>

        {/* Option 2: Manual Link Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.85 }}>Google Doc Web Share Link:</label>
          <input
            type="text"
            placeholder="https://docs.google.com/document/d/..."
            value={googleDocUrl}
            onChange={(e) => setGoogleDocUrl(e.target.value)}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            onClick={async () => {
              await handleGoogleDocImport();
              onClose();
            }}
            disabled={isImportingGoogleDoc || !googleDocUrl.trim()}
            style={{
              flex: 2,
              padding: '0.9rem',
              borderRadius: '12px',
              background: 'var(--secondary)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isImportingGoogleDoc || !googleDocUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: isImportingGoogleDoc || !googleDocUrl.trim() ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {isImportingGoogleDoc ? 'Importing...' : '📥 Import Staged Link'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.9rem',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontWeight: 650,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
