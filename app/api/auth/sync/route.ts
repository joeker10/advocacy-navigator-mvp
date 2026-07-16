import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// 1. GET: Fetch all profiles and insights for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await prisma.childProfile.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'asc' },
    });

    const insights = await prisma.savedInsight.findMany({
      where: { userId: payload.userId },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      success: true,
      childProfiles: profiles.map(p => ({
        id: p.id,
        name: p.name,
        school: p.school || "",
        grade: p.grade || "",
        dob: p.dob || "",
      })),
      savedInsights: insights.map(i => ({
        id: i.id,
        query: i.query,
        response: i.response,
        childId: i.childId || undefined,
        name: i.name || undefined,
        timestamp: new Date(i.timestamp).getTime(),
      })),
    });
  } catch (error: any) {
    console.error("Sync GET API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Upsert child profiles and insights (incremental sync or save)
export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { childProfiles, savedInsights } = body;

    if (Array.isArray(childProfiles)) {
      for (const p of childProfiles) {
        if (!p.id || !p.name) continue;
        await prisma.childProfile.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            school: p.school || null,
            grade: p.grade || null,
            dob: p.dob || null,
          },
          create: {
            id: p.id,
            userId: payload.userId,
            name: p.name,
            school: p.school || null,
            grade: p.grade || null,
            dob: p.dob || null,
          },
        });
      }
    }

    if (Array.isArray(savedInsights)) {
      for (const i of savedInsights) {
        if (!i.id || !i.query || !i.response) continue;
        const childIdVal = i.childId && i.childId !== 'general' ? i.childId : null;
        await prisma.savedInsight.upsert({
          where: { id: i.id },
          update: {
            childId: childIdVal,
            query: i.query,
            response: i.response,
            name: i.name || null,
          },
          create: {
            id: i.id,
            userId: payload.userId,
            childId: childIdVal,
            query: i.query,
            response: i.response,
            name: i.name || null,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync POST API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Remove profile or insight from server database
export async function DELETE(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // "profile" or "insight"
    const id = url.searchParams.get("id");

    if (!id || (type !== "profile" && type !== "insight")) {
      return NextResponse.json({ error: 'Missing type or id parameters' }, { status: 400 });
    }

    if (type === "profile") {
      await prisma.childProfile.delete({
        where: { id, userId: payload.userId }
      });
    } else {
      await prisma.savedInsight.delete({
        where: { id, userId: payload.userId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync DELETE API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
