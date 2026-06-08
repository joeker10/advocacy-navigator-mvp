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
    let parentEmail = null;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent) {
        parentEmail = parent.email;
        if (parent.subscriptionStatus === 'SUBSCRIBED') {
          subscriptionStatus = 'SUBSCRIBED';
        }
      }
    }

    // If this is a parent account, fetch linked sub-accounts
    const linkedAccounts = await prisma.user.findMany({
      where: { parentId: user.id },
      select: { id: true, email: true, createdAt: true }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus,
        parentId: user.parentId,
        parentEmail,
        linkedAccounts: linkedAccounts || []
      }
    });

  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Session check failed: ' + error.message }, { status: 500 });
  }
}
