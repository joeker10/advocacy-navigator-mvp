'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  googleDocUrl: string;
  setGoogleDocUrl: (url: string) => void;
  isImportingGoogleDoc: boolean;
  handlePasteAndImport: () => Promise<void>;
  handleGoogleDocImport: (targetUrl?: string) => Promise<void>;
  openGoogleDrivePicker?: () => void;
}

export function GoogleDocModal({
  isOpen,
  onClose,
  googleDocUrl,
  setGoogleDocUrl,
  isImportingGoogleDoc,
  handlePasteAndImport,
  handleGoogleDocImport,
  openGoogleDrivePicker,
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
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'var(--surface)',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Polynesian Kapa Accent Bar */}
        <div className="kapa-accent-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)', margin: 0 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="var(--primary)">
              <circle cx="50" cy="55" r="22" />
              <circle cx="50" cy="22" r="8" />
              <path d="M50 22 L50 33 M25 45 Q10 30 5 50 M75 45 Q90 30 95 50 M30 72 Q10 85 8 72 M70 72 Q90 85 92 72" stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
            Import Google Doc / Drive
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--foreground)', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* 3 Simple Steps Banner */}
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: '14px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📌</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>How to Import Your Google Doc:</strong>
          </div>
          <div style={{ fontSize: '0.825rem', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: '0.3rem', lineHeight: 1.4 }}>
            <div><strong>1.</strong> In Google Docs, open your IEP or assessment document.</div>
            <div><strong>2.</strong> Tap <strong>Share</strong> &rarr; ensure <em>General access</em> is <strong>&quot;Anyone with the link&quot;</strong> &rarr; <strong>Copy link</strong>.</div>
            <div><strong>3.</strong> Return here and tap <strong>📋 Paste Link &amp; Import</strong> below!</div>
            <div style={{ marginTop: '0.2rem', opacity: 0.8, fontSize: '0.78rem' }}>
              💡 <em>Alternatively, tap <strong>📁 Pick File from Google Drive</strong> or export the doc as PDF/DOCX and upload directly.</em>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePasteAndImport}
            disabled={isImportingGoogleDoc}
            style={{
              flex: '1 1 200px',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isImportingGoogleDoc ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            {isImportingGoogleDoc ? '⏳ Importing Doc...' : '📋 Paste Link & Import'}
          </button>

          {openGoogleDrivePicker && (
            <button
              type="button"
              onClick={openGoogleDrivePicker}
              disabled={isImportingGoogleDoc}
              style={{
                flex: '1 1 180px',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                fontWeight: 650,
                fontSize: '0.9rem',
                cursor: isImportingGoogleDoc ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              📁 Pick from Drive / Files
            </button>
          )}

          <a
            href="https://docs.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '0.85rem',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5, margin: '0.25rem 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase' }}>OR ENTER LINK MANUALLY</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>

        {/* Option 2: Manual Link Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.85 }}>Google Doc Share Link:</label>
          <input
            type="text"
            placeholder="https://docs.google.com/document/d/... (or drive.google.com)"
            value={googleDocUrl}
            onChange={(e) => setGoogleDocUrl(e.target.value)}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.925rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            onClick={async () => {
              if (!googleDocUrl.trim()) return;
              await handleGoogleDocImport();
              onClose();
            }}
            disabled={isImportingGoogleDoc || !googleDocUrl.trim()}
            style={{
              flex: 2,
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'var(--secondary)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isImportingGoogleDoc || !googleDocUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: isImportingGoogleDoc || !googleDocUrl.trim() ? 0.6 : 1,
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
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontWeight: 650,
              fontSize: '0.95rem',
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
