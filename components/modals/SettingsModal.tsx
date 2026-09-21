'use client';

import React from 'react';
import { ChildProfile } from '@/lib/indexeddb';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  appPromptCount: number;
  couponCode: string;
  setCouponCode: (c: string) => void;
  couponSuccess: string;
  couponError: string;
  handleRedeemCoupon: (e: React.FormEvent) => Promise<void>;
  familyEmail: string;
  setFamilyEmail: (e: string) => void;
  familySuccess: string;
  familyError: string;
  handleAddFamilyMember: (e: React.FormEvent) => Promise<void>;
  handleRemoveFamilyMember: (id: string) => Promise<void>;
  isSubscribedToNewsletter: boolean;
  handleToggleNewsletterSubscription: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  childProfiles: ChildProfile[];
  handleDeleteChildProfile: (id: string, name: string) => Promise<void>;
  newChildName: string;
  setNewChildName: (n: string) => void;
  handleAddChildProfile: (e: React.FormEvent) => Promise<void>;
  handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  handleLogout: () => void;
  formatEmailForMobile: (email?: string | null) => React.ReactNode;
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  token,
  setUser,
  appPromptCount,
  couponCode,
  setCouponCode,
  couponSuccess,
  couponError,
  handleRedeemCoupon,
  familyEmail,
  setFamilyEmail,
  familySuccess,
  familyError,
  handleAddFamilyMember,
  handleRemoveFamilyMember,
  isSubscribedToNewsletter,
  handleToggleNewsletterSubscription,
  childProfiles,
  handleDeleteChildProfile,
  newChildName,
  setNewChildName,
  handleAddChildProfile,
  handleLinkClick,
  handleLogout,
  formatEmailForMobile,
}: Props) {
  if (!isOpen) return null;

  const isOwnerOrPro = user?.email?.toLowerCase() === 'joeker10@gmail.com' || user?.subscriptionTier === 'PROFESSIONAL' || user?.subscriptionTier === 'UNLIMITED';
  const effectiveLimit = isOwnerOrPro ? 9999 : (user?.subscriptionStatus === 'SUBSCRIBED' ? Math.max(user?.profileLimit ?? 4, 4) : (user?.profileLimit ?? 1));
  const isLimitReached = childProfiles.length >= effectiveLimit;

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
          maxWidth: '450px',
          height: '100%',
          borderRadius: '0',
          background: 'var(--background-end)',
          borderLeft: '1px solid var(--glass-border)',
          padding: '2.5rem',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Account & Settings</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* User Identity Info */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.85rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Logged In As</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem', marginBottom: '0.75rem' }}>{formatEmailForMobile(user?.email)}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  background: user?.subscriptionStatus === 'SUBSCRIBED' ? 'var(--success-glow)' : 'rgba(255,255,255,0.05)',
                  border: user?.subscriptionStatus === 'SUBSCRIBED' ? '1px solid var(--success)' : '1px solid var(--border)',
                  color: user?.subscriptionStatus === 'SUBSCRIBED' ? 'var(--success)' : 'var(--foreground)',
                }}
              >
                {user?.subscriptionStatus === 'SUBSCRIBED' ? '👑 Subscribed (Unlimited)' : 'Free Trial (Limited)'}
              </span>
              {user?.parentId && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Linked Family Account</span>}
            </div>

            {user?.subscriptionStatus === 'SUBSCRIBED' ? (
              user?.subscriptionExpiresAt && (
                <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                  Subscription ends: <strong>{new Date(user.subscriptionExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
              )
            ) : (
              <div style={{ fontSize: '0.85rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ margin: 0 }}>Usage Limit: <strong>{appPromptCount} / 5</strong> Free Prompts / month</p>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Redeem a coupon below or link a family account to unlock unlimited access.</p>
              </div>
            )}
          </div>
        </div>

        {/* Google Play Subscription */}
        {user?.subscriptionStatus !== 'SUBSCRIBED' && (
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⭐ Unlock Unlimited Access
            </h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>
              Get unlimited AI advocacy chats, IEP document extractions, meeting transcriptions, and family sharing.
            </p>

            <button
              type="button"
              onClick={async () => {
                try {
                  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
                  if (isNative) {
                    alert('Opening Google Play Subscription window...');
                    window.open('https://play.google.com/store/account/subscriptions?sku=sped_nav_monthly_unlimited&package=app.thespecialeducationnavigator', '_system');
                  } else {
                    alert('To complete your subscription, please open The Special Education Navigator app on Google Play to complete payment via Google Play Billing.');
                  }
                } catch (err) {
                  console.error('Subscription purchase error:', err);
                  alert('Unable to launch Google Play Store billing.');
                }
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px var(--primary-glow)',
                marginBottom: '1.25rem',
              }}
            >
              💳 Subscribe via Google Play ($9.99/mo)
            </button>
          </div>
        )}

        {/* Promo Coupon Redemption */}
        {user?.subscriptionStatus !== 'SUBSCRIBED' && (
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Redeem Promo Coupon</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Have a coupon code? Enter it below to unlock unlimited document analysis.</p>

            <form onSubmit={handleRedeemCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', textTransform: 'uppercase' }}
              />
              <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Apply</button>
            </form>
            {couponSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{couponSuccess}</p>}
            {couponError && <p style={{ color: 'hsl(0, 80%, 50%)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{couponError}</p>}
          </div>
        )}

        {/* Family Discount Tier */}
        {user?.subscriptionStatus === 'SUBSCRIBED' && !user?.parentId && (
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Family Discount Links</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Share your subscription benefits with up to 4 additional family email accounts.</p>

            <form onSubmit={handleAddFamilyMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="family@email.com"
                value={familyEmail}
                onChange={(e) => setFamilyEmail(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Link</button>
            </form>
            {familySuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{familySuccess}</p>}
            {familyError && <p style={{ color: 'hsl(0, 80%, 50%)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{familyError}</p>}

            {user?.linkedAccounts && user.linkedAccounts.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Linked Accounts</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {user.linkedAccounts.map((member: any) => (
                    <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatEmailForMobile(member.email)}</span>
                      <button onClick={() => handleRemoveFamilyMember(member.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(0, 80%, 50%)', fontSize: '0.8rem', cursor: 'pointer' }}>Unlink</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2FA Toggle */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Security Settings</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Enhance your account safety by enabling 2-Factor Authentication (Email OTP).</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Enable 2FA (Email OTP)</span>
            <input
              type="checkbox"
              checked={!!user?.twoFactorEnabled}
              onChange={async (e) => {
                const enabled = e.target.checked;
                try {
                  const API_URL = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() ? 'https://www.thespecialeducationnavigator.app' : '';
                  const res = await fetch(`${API_URL}/api/auth/toggle-2fa`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ enabled }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setUser((prev: any) => ({ ...prev, twoFactorEnabled: data.twoFactorEnabled }));
                  } else {
                    alert(data.error || 'Failed to update 2FA settings.');
                  }
                } catch (err) {
                  alert('Network error updating 2FA settings.');
                }
              }}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Newsletter Settings</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Stay informed with special education compliance tips.</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Subscribe to free newsletter</span>
            <input
              type="checkbox"
              checked={isSubscribedToNewsletter}
              onChange={handleToggleNewsletterSubscription}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        {/* Child Profiles Management */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>👦 Child Profiles</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Create profiles to filter insights and keep separate student records.</p>

          {childProfiles.length === 0 ? (
            <p style={{ fontSize: '0.85rem', opacity: 0.5, fontStyle: 'italic', marginBottom: '1rem' }}>No child profiles created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
              {childProfiles.map((child) => (
                <div
                  key={child.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>👦 {child.name}</span>
                  <button
                    onClick={() => handleDeleteChildProfile(child.id, child.name)}
                    style={{ background: 'transparent', border: 'none', color: 'hsl(0, 80%, 50%)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {isLimitReached ? (
            <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fbbf24' }}>
              ⚠️ Profile limit reached ({childProfiles.length} of {effectiveLimit}). Upgrade or redeem a coupon to add more profiles.
            </div>
          ) : (
            <form onSubmit={handleAddChildProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Child's Name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ width: '100%', padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
            </form>
          )}
        </div>

        {/* Help & Support */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Help & Support</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Encountered an issue or have feedback?</p>

          <a
            href="/tutorials"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleLinkClick(e, '/tutorials')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            📖 View Tutorials & FAQs
          </a>

          <div style={{ fontSize: '0.85rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Email Support</span>
            <a href="mailto:support@thespecialeducationnavigator.app" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
              support@thespecialeducationnavigator.app
            </a>
          </div>

          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdDSAJHvlrEJ5JYra7vokzqDoNJT4SKQaRcvak7YDN3F3kIkQ/viewform"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => handleLinkClick(e, 'https://docs.google.com/forms/d/e/1FAIpQLSdDSAJHvlrEJ5JYra7vokzqDoNJT4SKQaRcvak7YDN3F3kIkQ/viewform')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            🐛 Report a Bug / Feedback
          </a>
        </div>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'hsla(0, 80%, 50%, 0.1)', border: '1px solid hsla(0, 80%, 50%, 0.3)', color: 'hsl(0, 80%, 60%)', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
