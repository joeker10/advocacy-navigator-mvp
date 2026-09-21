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

        const existing = await prisma.childProfile.findUnique({ where: { id: p.id } });
        if (existing) {
          if (existing.userId !== payload.userId) {
            // Prevent modifying profiles owned by other users
            continue;
          }
          await prisma.childProfile.update({
            where: { id: p.id },
            data: {
              name: p.name,
              school: p.school || null,
              grade: p.grade || null,
              dob: p.dob || null,
            },
          });
        } else {
          await prisma.childProfile.create({
            data: {
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
    }

    if (Array.isArray(savedInsights)) {
      for (const i of savedInsights) {
        if (!i.id || !i.query || !i.response) continue;

        let childIdVal: string | null = null;
        if (i.childId && i.childId !== 'general') {
          const existingChild = await prisma.childProfile.findUnique({ where: { id: i.childId } });
          if (existingChild && existingChild.userId === payload.userId) {
            childIdVal = i.childId;
          }
        }

        const existingInsight = await prisma.savedInsight.findUnique({ where: { id: i.id } });
        if (existingInsight) {
          if (existingInsight.userId !== payload.userId) {
            // Prevent modifying insights owned by other users
            continue;
          }
          await prisma.savedInsight.update({
            where: { id: i.id },
            data: {
              childId: childIdVal,
              query: i.query,
              response: i.response,
              name: i.name || null,
            },
          });
        } else {
          await prisma.savedInsight.create({
            data: {
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
      const existing = await prisma.childProfile.findFirst({
        where: { id, userId: payload.userId }
      });
      if (existing) {
        await prisma.childProfile.delete({
          where: { id }
        });
      }
    } else {
      const existing = await prisma.savedInsight.findFirst({
        where: { id, userId: payload.userId }
      });
      if (existing) {
        await prisma.savedInsight.delete({
          where: { id }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync DELETE API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
