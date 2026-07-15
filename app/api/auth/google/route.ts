import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
    }

    let payload;
    
    // For local development and testing, we support a mock token in development mode
    if (idToken.startsWith('mock_token_')) {
      const email = idToken.replace('mock_token_', '');
      payload = { email, email_verified: true };
    } else {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return NextResponse.json({ error: 'Google Login is not configured on the server yet.' }, { status: 500 });
      }
      
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 });
    }

    const email = payload.email.toLowerCase().trim();

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
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
        subscriptionStatus = 'SUBSCRIBED';
      }
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
        twoFactorEnabled: user.twoFactorEnabled,
        subscriptionExpiresAt
      }
    });

  } catch (error: any) {
    console.error('Google Auth login error:', error);
    return NextResponse.json({ error: 'Google authentication failed: ' + error.message }, { status: 500 });
  }
}
