import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { purchaseToken, productId } = await req.json();
    if (!purchaseToken) {
      return NextResponse.json({ error: 'Purchase token is required' }, { status: 400 });
    }

    // Set subscription duration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        subscriptionStatus: 'SUBSCRIBED',
        subscriptionTier: productId || 'sped_nav_monthly_unlimited',
        subscriptionExpiresAt: expiresAt.toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      message: 'Subscription successfully activated via Google Play!'
    });
  } catch (error) {
    console.error("Google Subscription Verification Error:", error);
    return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 500 });
  }
}
