'use client';

import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

interface TermItem {
  term: string;
  fullName: string;
  definition: string;
  citation?: string;
  category: 'Legal/Federal' | 'Hawaii Law' | 'IEP Process' | 'Evaluation & Support';
}

const GLOSSARY_TERMS: TermItem[] = [
  {
    term: 'FAPE',
    fullName: 'Free Appropriate Public Education',
    definition: 'Special education and related services that are provided at public expense, under public supervision, meeting state educational standards, and in conformity with an individualized education program (IEP).',
    citation: '34 CFR §300.17 & HAR §8-60-2',
    category: 'Legal/Federal',
  },
  {
    term: 'LRE',
    fullName: 'Least Restrictive Environment',
    definition: 'To the maximum extent appropriate, children with disabilities must be educated with children who are nondisabled. Special classes, separate schooling, or removal occurs only if education in regular classes with supplementary aids and services cannot be achieved satisfactorily.',
    citation: '34 CFR §300.114 & HAR §8-60-15',
    category: 'Legal/Federal',
  },
  {
    term: 'PWN',
    fullName: 'Prior Written Notice',
    definition: 'A formal written document that the school must give parents whenever the school proposes or refuses to initiate or change the identification, evaluation, educational placement, or provision of FAPE to the child.',
    citation: 'HAR §8-60-58',
    category: 'Hawaii Law',
  },
  {
    term: 'PLEP / PLAAFP',
    fullName: 'Present Levels of Educational / Academic Achievement & Functional Performance',
    definition: 'A comprehensive statement describing how the child\'s disability affects their involvement and progress in the general education curriculum, establishing baseline metrics for all annual goals.',
    citation: 'HAR §8-60-44(a)(1)',
    category: 'IEP Process',
  },
  {
    term: 'HAR Chapter 60',
    fullName: 'Hawaii Administrative Rules Title 8 Chapter 60',
    definition: 'The official state regulations governing special education services, timelines, parental rights, and procedural safeguards for the State of Hawaii Department of Education.',
    citation: 'Hawaii Department of Education Title 8 Ch. 60',
    category: 'Hawaii Law',
  },
  {
    term: 'MDR',
    fullName: 'Manifestation Determination Review',
    definition: 'A meeting held within 10 school days of any decision to change the placement of a child with a disability because of a violation of a code of student conduct, determining if behavior was caused by the disability or failure to implement the IEP.',
    citation: 'HAR §8-60-75',
    category: 'Legal/Federal',
  },
  {
    term: 'AT',
    fullName: 'Assistive Technology',
    definition: 'Any item, piece of equipment, or software system used to increase, maintain, or improve functional capabilities of a child with a disability. The IEP team must consider AT needs annually.',
    citation: 'HAR §8-60-48(a)(2)(E)',
    category: 'Evaluation & Support',
  },
  {
    term: 'BIP',
    fullName: 'Behavior Intervention Plan',
    definition: 'A targeted plan developed by the IEP team using positive behavioral interventions and supports to address specific behaviors that impede the child\'s learning or that of others.',
    citation: 'HAR §8-60-48(a)(2)(A)',
    category: 'Evaluation & Support',
  },
  {
    term: 'FBA',
    fullName: 'Functional Behavioral Assessment',
    definition: 'A comprehensive assessment process for identifying the underlying purpose or function of a student\'s problem behavior and the environmental factors that trigger and maintain it.',
    citation: '34 CFR §300.530(d)(1)(ii)',
    category: 'Evaluation & Support',
  },
  {
    term: 'ESY',
    fullName: 'Extended School Year Services',
    definition: 'Special education and related services provided to a student beyond the normal school year (e.g. summer) at no cost to parents when needed to prevent severe regression.',
    citation: 'HAR §8-60-17',
    category: 'IEP Process',
  },
  {
    term: 'Section 504',
    fullName: 'Section 504 of the Rehabilitation Act of 1973',
    definition: 'A civil rights law preventing discrimination against individuals with disabilities in programs receiving federal funds, providing accommodations for equal access even without specialized instruction.',
    citation: '34 CFR Part 104',
    category: 'Legal/Federal',
  },
  {
    term: 'IDEA',
    fullName: 'Individuals with Disabilities Education Act',
    definition: 'The primary federal special education law ensuring students with disabilities receive FAPE tailored to their individual needs in the least restrictive environment.',
    citation: '20 U.S.C. §1400 et seq.',
    category: 'Legal/Federal',
  },
  {
    term: 'IEE',
    fullName: 'Independent Educational Evaluation',
    definition: 'An evaluation conducted by a qualified examiner who is not employed by the school district. Parents have the right to an IEE at public expense if they disagree with the school\'s evaluation.',
    citation: 'HAR §8-60-57',
    category: 'Evaluation & Support',
  },
  {
    term: 'LDAH',
    fullName: 'Leadership in Disabilities & Achievement of Hawaii',
    definition: 'Hawaii\'s Parent Training and Information Center (PTI) offering free guidance, advocacy resources, and parent support across all islands (www.ldahawaii.org | 808-536-9684).',
    citation: 'Hawaii PTI Resource',
    category: 'Hawaii Law',
  },
];

export function GlossaryModal({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filtered = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Legal/Federal', 'Hawaii Law', 'IEP Process', 'Evaluation & Support'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
              📖 Special Education & Chapter 60 Glossary
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
              Key terms, acronyms, and statutory legal citations for parents and advocates.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--background)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="🔍 Search acronyms or terms (e.g. FAPE, LRE, PWN, 60-day)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: activeCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: activeCategory === cat ? 'var(--primary-glow)' : 'transparent',
                  color: activeCategory === cat ? 'var(--primary)' : 'var(--foreground)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Terms List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.6 }}>
              <p>No matching terms found. Try adjusting your search query.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.term}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.term}</strong>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>&mdash; {item.fullName}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', opacity: 0.8 }}>
                    {item.category}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0.5rem 0', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--foreground)', opacity: 0.9 }}>
                  {item.definition}
                </p>
                {item.citation && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--secondary)', opacity: 0.9 }}>
                    ⚖️ Citation: {item.citation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)' }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{filtered.length} terms displayed</span>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
