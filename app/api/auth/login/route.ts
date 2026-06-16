import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Determine current subscription status, inheriting from parent account if linked
    let subscriptionStatus = user.subscriptionStatus;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
        subscriptionStatus = 'SUBSCRIBED';
      }
    }

    // If 2-Factor Authentication is enabled, intercept login and issue tempToken
    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: code,
          twoFactorExpires: codeExpires
        }
      });

      console.log(`\n=================================================`);
      console.log(`[2FA OTP] Code generated for user: ${user.email}`);
      console.log(`[2FA OTP] Code: ${code}`);
      console.log(`[2FA OTP] Expires at: ${codeExpires.toISOString()}`);
      console.log(`=================================================\n`);

      const tempToken = signToken({
        userId: user.id,
        email: user.email,
        is2faTemp: true
      }, 300); // 5 minutes expiration

      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        tempToken
      });
    }

    // Sign session JWT
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed: ' + error.message }, { status: 500 });
  }
}
