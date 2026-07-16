import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Check code and expiration
    if (user.verificationToken !== normalizedCode) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please sign up again to get a new code.' }, { status: 400 });
    }

    // Mark user as verified, clear token/expiration
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      }
    });

    // Sign session JWT
    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      subscriptionStatus: updatedUser.subscriptionStatus
    });

    // Calculate subscription ending date (1 year from creation)
    const expiresDate = new Date(updatedUser.createdAt);
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    const subscriptionExpiresAt = expiresDate.toISOString();

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionTier: updatedUser.subscriptionTier,
        profileLimit: updatedUser.profileLimit,
        subscriptionExpiresAt
      }
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed: ' + error.message }, { status: 500 });
  }
}
