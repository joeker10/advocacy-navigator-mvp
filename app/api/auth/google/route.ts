import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const VALID_GOOGLE_CLIENT_IDS = [
  '584515942995-o6cjeqcm3k14jgr3jrkrmro0ash879qs.apps.googleusercontent.com',
  '76978043008-5riscv5374dum0a66mamauu2vnsovlb8.apps.googleusercontent.com'
];

if (process.env.GOOGLE_CLIENT_ID && !VALID_GOOGLE_CLIENT_IDS.includes(process.env.GOOGLE_CLIENT_ID)) {
  VALID_GOOGLE_CLIENT_IDS.push(process.env.GOOGLE_CLIENT_ID);
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || VALID_GOOGLE_CLIENT_IDS[0]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken, accessToken } = body;

    if (!idToken && !accessToken) {
      return NextResponse.json({ error: 'Google ID token or Access token is required' }, { status: 400 });
    }

    let verifiedEmail: string | null = null;

    // 1. Verify Google ID Token if provided
    if (idToken) {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: VALID_GOOGLE_CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email && payload.email_verified) {
          verifiedEmail = payload.email.toLowerCase().trim();
        }
      } catch (err: any) {
        console.warn('verifyIdToken failed, falling back to tokeninfo endpoint:', err?.message);
        // Fallback to direct Google tokeninfo endpoint
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenRes.ok) {
          const info = await tokenRes.json();
          const isAudValid = VALID_GOOGLE_CLIENT_IDS.includes(info.aud) || VALID_GOOGLE_CLIENT_IDS.includes(info.azp);
          if (isAudValid && info.email && (info.email_verified === 'true' || info.email_verified === true)) {
            verifiedEmail = info.email.toLowerCase().trim();
          }
        }
      }
    }

    // 2. Verify Google Access Token if ID token wasn't provided or didn't resolve
    if (!verifiedEmail && accessToken) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
        if (tokenRes.ok) {
          const info = await tokenRes.json();
          const isAudValid = !info.aud || VALID_GOOGLE_CLIENT_IDS.includes(info.aud) || VALID_GOOGLE_CLIENT_IDS.includes(info.azp);
          if (isAudValid && info.email && (info.email_verified === 'true' || info.email_verified === true || info.verified_email === true)) {
            verifiedEmail = info.email.toLowerCase().trim();
          }
        }
      } catch (err: any) {
        console.error('Google access token verification error:', err);
      }
    }

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Invalid or unverified Google credentials' }, { status: 401 });
    }

    const email = verifiedEmail;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create user automatically, marked as emailVerified: true
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'GOOGLE_AUTH_PLACEHOLDER', // Placeholder since they log in via Google
          subscriptionStatus: 'UNSUBSCRIBED',
          emailVerified: true
        }
      });
    } else if (!user.emailVerified) {
      // Mark as verified if they successfully log in via Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }

    // Determine subscription status
    let subscriptionStatus = user.subscriptionStatus;
    let subscriptionTier = user.subscriptionTier;
    let profileLimit = user.profileLimit || 1;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
        subscriptionStatus = 'SUBSCRIBED';
        subscriptionTier = parent.subscriptionTier;
        profileLimit = parent.profileLimit;
      }
    }

    const isOwnerOrPro = user.email.toLowerCase() === 'joeker10@gmail.com' || subscriptionTier === 'PROFESSIONAL' || subscriptionTier === 'UNLIMITED';
    if (isOwnerOrPro) {
      profileLimit = 9999;
      subscriptionStatus = 'SUBSCRIBED';
    } else if (subscriptionStatus === 'SUBSCRIBED') {
      profileLimit = Math.max(profileLimit, 4);
    }

    // Sign session JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      subscriptionStatus
    });

    // Calculate subscription ending date (1 year from parent creation or own creation)
    let expiresDate = new Date(user.createdAt);
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent) {
        expiresDate = new Date(parent.createdAt);
      }
    }
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    const subscriptionExpiresAt = expiresDate.toISOString();

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus,
        subscriptionTier,
        profileLimit,
        twoFactorEnabled: user.twoFactorEnabled,
        subscriptionExpiresAt
      }
    });

  } catch (error: any) {
    console.error('Google Auth login error:', error);
    return NextResponse.json({ error: 'Google authentication failed: ' + error.message }, { status: 500 });
  }
}
