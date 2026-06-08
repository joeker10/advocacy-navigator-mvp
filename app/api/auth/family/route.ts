import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email to link is required' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Verify parent has an active subscription
    const parentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!parentUser || parentUser.subscriptionStatus !== 'SUBSCRIBED') {
      return NextResponse.json({ error: 'Only active subscribers can link family members' }, { status: 403 });
    }

    if (parentUser.email === targetEmail) {
      return NextResponse.json({ error: 'You cannot link your own email' }, { status: 400 });
    }

    // Limit family size to e.g. 4 additional accounts
    const existingLinksCount = await prisma.user.count({
      where: { parentId: parentUser.id }
    });

    if (existingLinksCount >= 4) {
      return NextResponse.json({ error: 'Family Discount limit reached (max 4 linked accounts)' }, { status: 400 });
    }

    // Check if target user already exists
    let targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (targetUser) {
      if (targetUser.parentId && targetUser.parentId !== parentUser.id) {
        return NextResponse.json({ error: 'This email is already linked to another family plan' }, { status: 400 });
      }
      
      // Update target user to link them
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { parentId: parentUser.id }
      });
    } else {
      // Create user placeholder with random blank password hash
      targetUser = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: 'LINKED_PLACEHOLDER_PASS_2026', // They can reset/register this later
          parentId: parentUser.id,
          subscriptionStatus: 'UNSUBSCRIBED' // Inherited status from parent is resolved at run-time
        }
      });
    }

    const linkedAccounts = await prisma.user.findMany({
      where: { parentId: parentUser.id },
      select: { id: true, email: true, createdAt: true }
    });

    return NextResponse.json({
      success: true,
      message: `${targetEmail} has been added to your Family Discount plan.`,
      linkedAccounts
    });

  } catch (error: any) {
    console.error('Family linking error:', error);
    return NextResponse.json({ error: 'Failed to link account: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Account ID to unlink is required' }, { status: 400 });
    }

    // Verify parent
    const parentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!parentUser) {
      return NextResponse.json({ error: 'Parent user not found' }, { status: 401 });
    }

    // Verify relationship exists
    const targetUser = await prisma.user.findFirst({
      where: { id: id, parentId: parentUser.id }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Linked user not found under this plan' }, { status: 404 });
    }

    // Unlink the user
    await prisma.user.update({
      where: { id: id },
      data: { parentId: null }
    });

    const linkedAccounts = await prisma.user.findMany({
      where: { parentId: parentUser.id },
      select: { id: true, email: true, createdAt: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Linked account removed successfully.',
      linkedAccounts
    });

  } catch (error: any) {
    console.error('Family unlinking error:', error);
    return NextResponse.json({ error: 'Failed to unlink account: ' + error.message }, { status: 500 });
  }
}
