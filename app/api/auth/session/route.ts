import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    // Fetch user from DB to get fresh state
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Determine final subscription status, inheriting from parent if linked
    let subscriptionStatus = user.subscriptionStatus;
    let subscriptionTier = user.subscriptionTier;
    let profileLimit = user.profileLimit;
    let parentEmail = null;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent) {
        parentEmail = parent.email;
        if (parent.subscriptionStatus === 'SUBSCRIBED') {
          subscriptionStatus = 'SUBSCRIBED';
          subscriptionTier = parent.subscriptionTier;
          profileLimit = parent.profileLimit;
        }
      }
    }

    // If this is a parent account, fetch linked sub-accounts
    const linkedAccounts = await prisma.user.findMany({
      where: { parentId: user.id },
      select: { id: true, email: true, createdAt: true }
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
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus,
        subscriptionTier,
        profileLimit,
        parentId: user.parentId,
        parentEmail,
        linkedAccounts: linkedAccounts || [],
        subscriptionExpiresAt
      }
    });

  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Session check failed: ' + error.message }, { status: 500 });
  }
}
