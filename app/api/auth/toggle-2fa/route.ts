import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { enabled } = await req.json();

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        twoFactorEnabled: !!enabled,
        twoFactorSecret: null,
        twoFactorExpires: null
      }
    });

    return NextResponse.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled
    });

  } catch (error: any) {
    console.error('Toggle 2FA error:', error);
    return NextResponse.json({ error: 'Failed to update 2FA settings: ' + error.message }, { status: 500 });
  }
}
