import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// Define hardcoded promo codes that are always active
const HARDCODED_COUPONS = ['NAVIGATE2026', 'WELCOME2026', 'HAR60', 'FAMILY50'];

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    let isValid = false;

    // Check hardcoded defaults
    if (HARDCODED_COUPONS.includes(normalizedCode)) {
      isValid = true;
    } else {
      // Check database-backed coupons
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode }
      });
      if (dbCoupon && dbCoupon.isActive) {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    // Upgrade user to SUBSCRIBED
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: { subscriptionStatus: 'SUBSCRIBED' }
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon redeemed successfully! Unlimited access unlocked.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    });

  } catch (error: any) {
    console.error('Coupon redemption error:', error);
    return NextResponse.json({ error: 'Failed to redeem coupon: ' + error.message }, { status: 500 });
  }
}
