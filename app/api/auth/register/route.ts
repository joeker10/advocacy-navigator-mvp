import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'MOCK_KEY');

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      // If user exists but is not verified, we can let them re-register and send a new code
      if (!existingUser.emailVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            verificationToken: code,
            verificationExpires: codeExpires,
            passwordHash: hashPassword(password) // Update password just in case they typed a different one
          }
        });

        // Send email
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
              console.error('Resend API Error (Re-Register):', error);
            } else {
              console.log('Resend Success (Re-Register):', data);
            }
          } catch (emailError: any) {
            console.error('Failed to send verification email (Re-Register):', emailError);
          }
        } else {
          console.log(`\n=================================================`);
          console.log(`[EMAIL VERIFICATION OTP] Sent to: ${normalizedEmail}`);
          console.log(`[EMAIL VERIFICATION OTP] Code: ${code} (RE-REGISTER)`);
          console.log(`=================================================\n`);
        }

        return NextResponse.json({
          success: true,
          verificationRequired: true,
          email: normalizedEmail,
          message: "Verification code sent to your email."
        });
      }

      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Hash password and store user
    const passwordHash = hashPassword(password);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        subscriptionStatus: 'UNSUBSCRIBED', // Default tier
        emailVerified: false,
        verificationToken: code,
        verificationExpires: codeExpires
      }
    });

    // Send email
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
          console.error('Resend API Error (Register):', error);
        } else {
          console.log('Resend Success (Register):', data);
        }
      } catch (emailError: any) {
        console.error('Failed to send verification email (Register):', emailError);
      }
    } else {
      console.log(`\n=================================================`);
      console.log(`[EMAIL VERIFICATION OTP] Sent to: ${normalizedEmail}`);
      console.log(`[EMAIL VERIFICATION OTP] Code: ${code}`);
      console.log(`=================================================\n`);
    }

    return NextResponse.json({
      success: true,
      verificationRequired: true,
      email: normalizedEmail,
      message: "Verification code sent to your email."
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 });
  }
}
