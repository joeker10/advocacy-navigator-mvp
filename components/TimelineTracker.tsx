'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  childName?: string;
  onClose?: () => void;
}

interface Milestone {
  id: string;
  title: string;
  lawRef: string;
  description: string;
  startDate: string;
  durationDays: number;
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  statusColor: string;
}

export function TimelineTracker({ childName = 'Student', onClose }: Props) {
  const storageKey = `spednav_timeline_${childName.toLowerCase().replace(/\s+/g, '_')}`;

  const [iepDate, setIepDate] = useState<string>('');
  const [evalDate, setEvalDate] = useState<string>('');
  const [consentDate, setConsentDate] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.iepDate) setIepDate(parsed.iepDate);
          if (parsed.evalDate) setEvalDate(parsed.evalDate);
          if (parsed.consentDate) setConsentDate(parsed.consentDate);
        } catch (e) {}
      }
    }
  }, [storageKey]);

  const saveDates = (newIep: string, newEval: string, newConsent: string) => {
    setIepDate(newIep);
    setEvalDate(newEval);
    setConsentDate(newConsent);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({
        iepDate: newIep,
        evalDate: newEval,
        consentDate: newConsent,
      }));
    }
  };

  const calculateMilestone = (
    id: string,
    title: string,
    lawRef: string,
    description: string,
    startDateStr: string,
    durationDays: number
  ): Milestone | null => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return null;

    const due = new Date(start);
    due.setDate(due.getDate() + durationDays);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;

    let statusColor = '#10b981'; // Green
    if (isOverdue || daysRemaining <= 14) {
      statusColor = '#ef4444'; // Red
    } else if (daysRemaining <= 45) {
      statusColor = '#f59e0b'; // Amber
    }

    return {
      id,
      title,
      lawRef,
      description,
      startDate: start.toLocaleDateString(),
      durationDays,
      dueDate: due.toLocaleDateString(),
      daysRemaining,
      isOverdue,
      statusColor,
    };
  };

  const milestones: Milestone[] = [
    calculateMilestone(
      'annual_iep',
      'Annual IEP Review',
      'HAR §8-60-48(a) / 34 CFR §300.324(b)',
      'The IEP team must review and revise the IEP periodically, but not less than annually (within 365 days).',
      iepDate,
      365
    ),
    calculateMilestone(
      'triennial_eval',
      'Triennial Re-evaluation',
      'HAR §8-60-35(a)(2) / 34 CFR §300.303(b)',
      'A comprehensive re-evaluation must occur at least once every 3 years unless parent and DOE agree otherwise.',
      evalDate,
      3 * 365
    ),
    calculateMilestone(
      'initial_eval',
      '60-Day Initial Evaluation Rule',
      'HAR §8-60-31(c) / 34 CFR §300.301(c)',
      'Initial evaluation and eligibility determination must be completed within 60 calendar days of receiving parental consent.',
      consentDate,
      60
    ),
  ].filter(Boolean) as Milestone[];

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '1.5rem',
      color: '#f8fafc',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      maxWidth: '650px',
      width: '100%',
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⏱️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>IEP Milestone & Timeline Tracker</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>HAR Chapter 60 & IDEA Statutory Compliance</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        )}
      </div>

      {/* Date Input Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', opacity: 0.8 }}>
            Current IEP Date:
          </label>
          <input
            type="date"
            value={iepDate}
            onChange={(e) => saveDates(e.target.value, evalDate, consentDate)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', opacity: 0.8 }}>
            Last Evaluation Date:
          </label>
          <input
            type="date"
            value={evalDate}
            onChange={(e) => saveDates(iepDate, e.target.value, consentDate)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', opacity: 0.8 }}>
            Consent for Eval Date:
          </label>
          <input
            type="date"
            value={consentDate}
            onChange={(e) => saveDates(iepDate, evalDate, e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Calculated Deadlines Display */}
      {milestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
            Enter your student's IEP, evaluation, or consent dates above to compute official Chapter 60 timeline deadlines.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {milestones.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${m.statusColor}44`,
                borderLeft: `4px solid ${m.statusColor}`,
                borderRadius: '10px',
                padding: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{m.title}</h4>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{m.lawRef}</span>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: `${m.statusColor}22`,
                    color: m.statusColor,
                    border: `1px solid ${m.statusColor}66`,
                  }}
                >
                  {m.isOverdue
                    ? `⚠️ Overdue by ${Math.abs(m.daysRemaining)} days`
                    : `⏳ Due in ${m.daysRemaining} days (${m.dueDate})`}
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
