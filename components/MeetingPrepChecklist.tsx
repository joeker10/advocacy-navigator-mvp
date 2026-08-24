'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  childName?: string;
  onClose?: () => void;
}

interface ChecklistItem {
  id: string;
  phase: '1_week_prior' | '3_days_prior' | 'day_of' | 'post_meeting';
  phaseTitle: string;
  title: string;
  details: string;
  lawTip?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // 1–2 Weeks Prior
  {
    id: 'req_evals',
    phase: '1_week_prior',
    phaseTitle: '1–2 Weeks Before Meeting',
    title: 'Request Comprehensive Evaluation Reports',
    details: 'Ask the school for copies of any new psychological, speech, OT, or academic assessments in advance so you can review them with outside specialists.',
    lawTip: 'HAR §8-60-35 & 34 CFR §300.613 grant parents the right to inspect all educational records.',
  },
  {
    id: 'write_parent_concerns',
    phase: '1_week_prior',
    phaseTitle: '1–2 Weeks Before Meeting',
    title: 'Write Your Parent Concerns Statement',
    details: 'Draft a bulleted 1-page summary of your child\'s strengths, areas of need, behavioral patterns at home, and specific goals you want addressed. Ask for this to be attached to the IEP.',
    lawTip: 'HAR §8-60-44(a)(1) mandates that the IEP team MUST consider the concerns of the parents for enhancing the education of their child.',
  },
  {
    id: 'gather_medical_notes',
    phase: '1_week_prior',
    phaseTitle: '1–2 Weeks Before Meeting',
    title: 'Collect Private Provider & Medical Reports',
    details: 'Gather letters or prescription notes from your child\'s pediatrician, therapist, or clinical psychologist recommending specific accommodations or related services.',
  },

  // 3 Days Prior
  {
    id: 'req_draft_iep',
    phase: '3_days_prior',
    phaseTitle: '3 Days Before Meeting',
    title: 'Request a Copy of the Draft IEP',
    details: 'Email the Care Coordinator requesting a written copy of the draft IEP, proposed goals, and service minutes to review before sitting down at the meeting table.',
    lawTip: 'Best Practice: You are an equal IEP team member; you cannot meaningfully participate if seeing complex documents for the first time during the meeting.',
  },
  {
    id: 'review_goals_accommodations',
    phase: '3_days_prior',
    phaseTitle: '3 Days Before Meeting',
    title: 'Review Proposed Goals with SMART Criteria',
    details: 'Ensure each goal is Specific, Measurable, Attainable, Relevant, and Time-bound, and that baseline data reflects present academic/functional performance (PLEP).',
    lawTip: 'HAR §8-60-44(a)(2) requires measurable annual goals, including academic and functional goals.',
  },

  // Day of Meeting
  {
    id: 'bring_support_person',
    phase: 'day_of',
    phaseTitle: 'Day of Meeting',
    title: 'Bring an Advocate, Friend, or Support Person',
    details: 'Have someone accompany you to take detailed minutes, track time, and help keep discussions focused on your child\'s unique needs.',
  },
  {
    id: 'audio_record_notice',
    phase: 'day_of',
    phaseTitle: 'Day of Meeting',
    title: 'Confirm Audio Recording Policy',
    details: 'If recording the meeting, confirm school notification. Hawaii is a one-party consent jurisdiction, but providing advance courtesy notice fosters transparency.',
  },
  {
    id: 'verify_team_attendance',
    phase: 'day_of',
    phaseTitle: 'Day of Meeting',
    title: 'Verify Required Team Members are Present',
    details: 'Ensure the General Ed Teacher, Special Ed Teacher, School Administrator (LEA Representative), and related service providers are in attendance.',
    lawTip: 'HAR §8-60-45 requires a written excusal agreement signed by parents if a required member is absent.',
  },

  // Post-Meeting
  {
    id: 'request_pwn',
    phase: 'post_meeting',
    phaseTitle: 'After the Meeting',
    title: 'Request Prior Written Notice (PWN) for Denied Requests',
    details: 'If the school refuses any accommodation, service, or placement you requested, ask for a formal PWN detailing why the request was refused and what data was used to decide.',
    lawTip: 'HAR §8-60-58 requires written notice within a reasonable time before the DOE proposes or refuses any educational placement or provision of FAPE.',
  },
  {
    id: 'do_not_feel_rushed',
    phase: 'post_meeting',
    phaseTitle: 'After the Meeting',
    title: 'Take Time to Review the Final IEP Before Signing',
    details: 'You do not have to sign consent immediately at the table. Take the finalized copy home to cross-reference with your meeting notes.',
  },
];

export function MeetingPrepChecklist({ childName = 'Student', onClose }: Props) {
  const storageKey = `spednav_checklist_${childName.toLowerCase().replace(/\s+/g, '_')}`;
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setCheckedState(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [storageKey]);

  const toggleItem = (id: string) => {
    const updated = { ...checkedState, [id]: !checkedState[id] };
    setCheckedState(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all checklist items?')) {
      setCheckedState({});
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
    }
  };

  const completedCount = Object.values(checkedState).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const phases = ['1_week_prior', '3_days_prior', 'day_of', 'post_meeting'] as const;

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
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>IEP Meeting Prep Checklist</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>For: {childName} &bull; Step-by-Step Parent Strategy</p>
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

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: 700 }}>
          <span>Readiness Progress</span>
          <span style={{ color: progressPercent === 100 ? '#10b981' : '#60a5fa' }}>{completedCount} of {totalCount} completed ({progressPercent}%)</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #38bdf8)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scrollable Checklist */}
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {phases.map((phaseKey) => {
          const itemsInPhase = CHECKLIST_ITEMS.filter(i => i.phase === phaseKey);
          if (itemsInPhase.length === 0) return null;
          const phaseHeading = itemsInPhase[0].phaseTitle;

          return (
            <div key={phaseKey}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {phaseHeading}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {itemsInPhase.map((item) => {
                  const isChecked = !!checkedState[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                        border: isChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div
                        style={{ marginTop: '0.2rem', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: isChecked ? '#6ee7b7' : '#f8fafc', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {item.title}
                        </strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {item.details}
                        </p>
                        {item.lawTip && (
                          <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            ⚖️ {item.lawTip}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handleReset}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Reset Checklist
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
