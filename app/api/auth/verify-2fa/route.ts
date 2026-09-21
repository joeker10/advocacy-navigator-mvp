import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, signToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`verify-2fa:${ip}`, { maxRequests: 5, windowMs: 5 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait 5 minutes and try again.' },
        { status: 429 }
      );
    }

    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json({ error: 'Temporary token and verification code are required' }, { status: 400 });
    }

    // Verify temp token
    const payload = verifyToken(tempToken);
    if (!payload || !payload.is2faTemp || !payload.userId) {
      return NextResponse.json({ error: 'Invalid or expired temporary session' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the code
    if (!user.twoFactorSecret || user.twoFactorSecret !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Verify expiration
    if (user.twoFactorExpires && user.twoFactorExpires < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Clear temp fields on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorExpires: null
      }
    });

    // Determine subscription inheritance
    let subscriptionStatus = user.subscriptionStatus;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
        subscriptionStatus = 'SUBSCRIBED';
      }
    }

    // Sign final session JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      subscriptionStatus
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });

  } catch (error: any) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Verification failed: ' + error.message }, { status: 500 });
  }
}
