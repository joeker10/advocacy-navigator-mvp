'use client';

import React from 'react';
import { ChildProfile } from '@/lib/indexeddb';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vaultSearch: string;
  setVaultSearch: (s: string) => void;
  vaultFilter: string;
  setVaultFilter: (f: string) => void;
  vaultLoading: boolean;
  vaultInsights: any[];
  childProfiles: ChildProfile[];
  handleMoveInsightProfile: (id: string, newChildId: string) => Promise<void>;
  handleCopyVaultInsight: (id: string, response: string) => void;
  copiedInsightId: string | null;
  handleDeleteVaultInsight: (id: string) => Promise<void>;
  renderTextWithEmailBreaks: (text: string) => React.ReactNode;
}

export function VaultModal({
  isOpen,
  onClose,
  vaultSearch,
  setVaultSearch,
  vaultFilter,
  setVaultFilter,
  vaultLoading,
  vaultInsights,
  childProfiles,
  handleMoveInsightProfile,
  handleCopyVaultInsight,
  copiedInsightId,
  handleDeleteVaultInsight,
  renderTextWithEmailBreaks,
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
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '100%',
          borderRadius: '0',
          background: 'var(--background-end)',
          borderLeft: '1px solid var(--glass-border)',
          padding: '2rem 1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              ⭐ Saved Insights Vault
            </h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem', marginBottom: 0 }}>
              Stored securely offline on your device &amp; synced to your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.75rem', color: 'var(--foreground)', cursor: 'pointer', padding: '0 0.5rem' }}
            aria-label="Close Vault"
          >
            &times;
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            value={vaultSearch}
            onChange={(e) => setVaultSearch(e.target.value)}
            placeholder="🔍 Search saved insights..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setVaultFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: vaultFilter === 'all' ? 'var(--primary)' : 'var(--surface)',
                color: vaultFilter === 'all' ? 'white' : 'var(--foreground)',
                transition: 'all 0.2s',
              }}
            >
              🌎 All ({vaultInsights.length})
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('general')}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: vaultFilter === 'general' ? 'var(--primary)' : 'var(--surface)',
                color: vaultFilter === 'general' ? 'white' : 'var(--foreground)',
                transition: 'all 0.2s',
              }}
            >
              📥 General ({vaultInsights.filter((i) => !i.childId || i.childId === 'general').length})
            </button>
            {childProfiles.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setVaultFilter(child.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: vaultFilter === child.id ? 'var(--primary)' : 'var(--surface)',
                  color: vaultFilter === child.id ? 'white' : 'var(--foreground)',
                  transition: 'all 0.2s',
                }}
              >
                👦 {child.name} ({vaultInsights.filter((i) => i.childId === child.id).length})
              </button>
            ))}
          </div>
        </div>

        {/* Insight List */}
        {vaultLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            <p>Loading your offline vault...</p>
          </div>
        ) : vaultInsights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', opacity: 0.8 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Vault is Empty</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Click <strong>&quot;⭐ Save Insight&quot;</strong> on any AI response in the dashboard to store it securely offline.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vaultInsights
              .filter((item) => {
                if (vaultFilter === 'general') return !item.childId || item.childId === 'general';
                if (vaultFilter !== 'all') return item.childId === vaultFilter;
                return true;
              })
              .filter((item) => {
                if (!vaultSearch.trim()) return true;
                const q = vaultSearch.toLowerCase();
                return (
                  (item.query || '').toLowerCase().includes(q) ||
                  (item.response || '').toLowerCase().includes(q) ||
                  (item.name || '').toLowerCase().includes(q)
                );
              })
              .map((item) => {
                const linkedChild = childProfiles.find((c) => c.id === item.childId);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>
                            {item.name || 'Saved Insight'}
                          </span>
                          {linkedChild && (
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 }}>
                              👦 {linkedChild.name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>
                          {new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>

                        {/* Move to Profile Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>PROFILE:</span>
                          <select
                            value={item.childId || 'general'}
                            onChange={(e) => handleMoveInsightProfile(item.id, e.target.value)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'var(--background)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--primary)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="general">🌍 General Account</option>
                            {childProfiles.map((child) => (
                              <option key={child.id} value={child.id}>👦 {child.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyVaultInsight(item.id, item.response)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: copiedInsightId === item.id ? 'var(--success-glow)' : 'var(--background)',
                            border: `1px solid ${copiedInsightId === item.id ? 'var(--success)' : 'var(--border)'}`,
                            color: copiedInsightId === item.id ? 'var(--success)' : 'var(--foreground)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          title="Copy response to clipboard"
                        >
                          {copiedInsightId === item.id ? '✅ Copied' : '📋 Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVaultInsight(item.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          title="Delete insight"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {item.query && (
                      <div style={{ background: 'var(--primary-glow)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>
                        <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.75rem', marginBottom: '2px', textTransform: 'uppercase' }}>Question / Topic:</strong>
                        {item.query}
                      </div>
                    )}

                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                      {renderTextWithEmailBreaks(item.response)}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
