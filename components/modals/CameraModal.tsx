'use client';

import React, { RefObject } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraAspectRatio: 'letter' | 'legal';
  setCameraAspectRatio: (ratio: 'letter' | 'legal') => void;
  capturePhoto: () => void;
}

export function CameraModal({
  isOpen,
  onClose,
  videoRef,
  cameraAspectRatio,
  setCameraAspectRatio,
  capturePhoto,
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
          maxWidth: '640px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Live Camera Capture</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setCameraAspectRatio('letter')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: cameraAspectRatio === 'letter' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              color: cameraAspectRatio === 'letter' ? 'white' : 'var(--foreground)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📄 Letter (8.5&quot; x 11&quot;)
          </button>
          <button
            type="button"
            onClick={() => setCameraAspectRatio('legal')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: cameraAspectRatio === 'legal' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              color: cameraAspectRatio === 'legal' ? 'white' : 'var(--foreground)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📋 Legal (9:16)
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto',
            aspectRatio: cameraAspectRatio === 'letter' ? '8.5/11' : '9/16',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            transition: 'aspect-ratio 0.3s ease',
          }}
        >
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={capturePhoto}
            style={{
              flex: 2,
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
          >
            📸 Capture Photo
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '1rem',
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
