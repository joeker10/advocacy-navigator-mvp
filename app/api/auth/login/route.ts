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

    // Block login and request verification if email is not verified
    if (!user.emailVerified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: code,
          verificationExpires: codeExpires
        }
      });

      // Send email using Resend
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || 'MOCK_KEY');
      if (process.env.RESEND_API_KEY) {
        try {
          const { data, error } = await resend.emails.send({
            from: 'The Special Education Navigator <no-reply@thespecialeducationnavigator.app>',
            to: normalizedEmail,
            subject: 'Verify your Special Education Navigator account',
            text: `Your 6-digit email verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
            html: `<p>Thank you for registering with <strong>The Special Education Navigator</strong>.</p><p>Your 6-digit verification code is:</p><h2 style="font-size: 2rem; color: #0284c7; letter-spacing: 0.1em; font-family: monospace;">${code}</h2><p>This code will expire in 15 minutes.</p>`
          });
          if (error) {
            console.error('Resend API Error (Login Re-Send):', error);
          } else {
            console.log('Resend Success (Login Re-Send):', data);
          }
        } catch (emailError: any) {
          console.error('Failed to send verification email during login:', emailError);
        }
      } else {
        console.log(`\n=================================================`);
        console.log(`[EMAIL VERIFICATION OTP] Sent to: ${normalizedEmail}`);
        console.log(`[EMAIL VERIFICATION OTP] Code: ${code} (LOGIN FLOW RE-SEND)`);
        console.log(`=================================================\n`);
      }

      return NextResponse.json({
        success: true,
        verificationRequired: true,
        email: normalizedEmail,
        message: 'Email verification is required. A new code has been sent.'
      });
    }

    // Determine current subscription status, inheriting from parent account if linked
    let subscriptionStatus = user.subscriptionStatus;
    let subscriptionTier = user.subscriptionTier;
    let profileLimit = user.profileLimit;
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed: ' + error.message }, { status: 500 });
  }
}
