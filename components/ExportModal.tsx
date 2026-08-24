'use client';

import React, { useState } from 'react';

interface Props {
  childProfile?: {
    name: string;
    school?: string;
    grade?: string;
    dob?: string;
  } | null;
  extractedDocuments?: any[];
  savedInsights?: any[];
  onClose: () => void;
}

export function ExportModal({ childProfile, extractedDocuments = [], savedInsights = [], onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const studentName = childProfile?.name || 'Student';
  const reportDate = new Date().toLocaleDateString();

  const generatePlainText = () => {
    let text = `=================================================\n`;
    text += `SPECIAL EDUCATION ADVOCACY SUMMARY BRIEF\n`;
    text += `Student: ${studentName}\n`;
    if (childProfile?.school) text += `School: ${childProfile.school}\n`;
    if (childProfile?.grade) text += `Grade: ${childProfile.grade}\n`;
    if (childProfile?.dob) text += `DOB: ${childProfile.dob}\n`;
    text += `Generated: ${reportDate}\n`;
    text += `Framework: IDEA & Hawaii Administrative Rules (HAR) Chapter 60\n`;
    text += `=================================================\n\n`;

    if (extractedDocuments.length > 0) {
      text += `--- EXTRACTED IEP & EVALUATION HIGHLIGHTS ---\n`;
      extractedDocuments.forEach((doc, idx) => {
        text += `\n[Document ${idx + 1}: ${doc.fileName || 'IEP'}]\n`;
        if (doc.plaafp) text += `• Present Levels (PLEP): ${doc.plaafp}\n`;
        if (doc.lreStatement) text += `• LRE Placement: ${doc.lreStatement}\n`;
        if (doc.accommodations && Array.isArray(doc.accommodations)) {
          text += `• Accommodations:\n`;
          doc.accommodations.forEach((acc: any) => {
            text += `   - ${typeof acc === 'string' ? acc : acc.details || JSON.stringify(acc)}\n`;
          });
        }
        if (doc.goals && Array.isArray(doc.goals)) {
          text += `• Annual Goals:\n`;
          doc.goals.forEach((goal: any) => {
            text += `   - ${typeof goal === 'string' ? goal : goal.target || JSON.stringify(goal)}\n`;
          });
        }
      });
      text += `\n`;
    }

    if (savedInsights.length > 0) {
      text += `--- ADVOCACY INSIGHTS & STATUTORY NOTES ---\n`;
      savedInsights.forEach((item, idx) => {
        text += `\n${idx + 1}. Inquiry: ${item.query}\n`;
        text += `   Analysis: ${item.response}\n`;
      });
      text += `\n`;
    }

    text += `\n-------------------------------------------------\n`;
    text += `Produced by The Special Education Navigator\n`;
    text += `www.thespecialeducationnavigator.app\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
              📄 Advocacy Summary Brief
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
              Ready for IEP meetings, evaluations, and advocate consultations.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Preview Content */}
        <div id="printable-advocacy-report" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', background: 'var(--background)', whiteSpace: 'pre-wrap', borderRadius: '8px', margin: '1rem' }}>
          {generatePlainText()}
        </div>

        {/* Action Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontWeight: 650,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {copied ? '✅ Copied to Clipboard!' : '📋 Copy Text'}
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: '10px',
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
