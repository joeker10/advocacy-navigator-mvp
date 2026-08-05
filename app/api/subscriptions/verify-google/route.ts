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
    if (!purchaseToken || typeof purchaseToken !== 'string') {
      return NextResponse.json({ error: 'Valid Google Play purchase token is required' }, { status: 400 });
    }

    // Reject mock/demo tokens in production to ensure users must pay through Google Play Billing
    if (purchaseToken.startsWith('demo_token_')) {
      return NextResponse.json({ 
        error: 'Invalid purchase token. Real Google Play Store subscription purchase is required.' 
      }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        subscriptionStatus: 'SUBSCRIBED',
        subscriptionTier: productId || 'PROFESSIONAL',
        profileLimit: 9999
      }
    });

    return NextResponse.json({
      success: true,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionTier: updatedUser.subscriptionTier,
      message: 'Subscription successfully activated via Google Play!'
    });
  } catch (error) {
    console.error("Google Subscription Verification Error:", error);
    return NextResponse.json({ error: 'Failed to verify subscription with Google Play' }, { status: 500 });
  }
}
