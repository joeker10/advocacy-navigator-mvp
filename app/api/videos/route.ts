import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "NAVIGATE_ADMIN";

const DEFAULT_VIDEOS = [
  {
    title: "Understanding Prior Written Notice (PWN) under HAR Chapter 60",
    description: "A deep dive into why Prior Written Notices are the most critical legal weapon for parents to prevent school districts from making unilateral decisions.",
    youtubeId: "ysz5S6PUM-U",
    type: "video",
    category: "PWNs",
    duration: "10:15",
    releasedAt: "June 12, 2026"
  },
  {
    title: "HAR Chapter 60 evaluation timeline countdown!",
    description: "Quick breakdown of the 60-calendar-day timeline in Hawaii. Hint: summer and weekends count!",
    youtubeId: "dQw4w9WgXcQ",
    type: "short",
    category: "IEP Timelines",
    duration: "0:58",
    releasedAt: "June 10, 2026"
  },
  {
    title: "Did the IEP coordinator verbally promise services? Here's why it is useless.",
    description: "Learn how verbal agreements at special education meetings disappear unless backed by a PWN.",
    youtubeId: "dQw4w9WgXcQ",
    type: "short",
    category: "Parent Rights",
    duration: "0:45",
    releasedAt: "June 08, 2026"
  },
  {
    title: "Writing SMART goals: Specific vs. Vague phrasing.",
    description: "Quick examples of how to rewrite vague goals to make them legally measurable.",
    youtubeId: "dQw4w9WgXcQ",
    type: "short",
    category: "SMART Goals",
    duration: "0:52",
    releasedAt: "June 05, 2026"
  },
  {
    title: "Understanding Least Restrictive Environment (LRE) & Inclusion in Hawaii",
    description: "A detailed explanation of LRE mandates under HAR §8-60-39. What to check on the placement page of the IEP.",
    youtubeId: "ysz5S6PUM-U",
    type: "video",
    category: "HAR Chapter 60",
    duration: "14:20",
    releasedAt: "May 28, 2026"
  },
  {
    title: "Can you audio-record an IEP meeting in Hawaii?",
    description: "Explaining Hawaii Revised Statutes §803-42 one-party consent rules for special education meetings.",
    youtubeId: "dQw4w9WgXcQ",
    type: "short",
    category: "Parent Rights",
    duration: "0:59",
    releasedAt: "May 20, 2026"
  }
];

function extractYoutubeId(input: string): string {
  const cleanInput = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
    return cleanInput;
  }
  const watchPattern = /(?:v=|\/v\/|embed\/|shorts\/|live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanInput.match(watchPattern);
  if (match && match[1]) {
    return match[1];
  }
  return cleanInput;
}

export async function GET(req: NextRequest) {
  try {
    // Check if we have any videos in the database
    let videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Seed defaults if empty
    if (videos.length === 0) {
      for (const defVid of DEFAULT_VIDEOS) {
        await prisma.video.create({
          data: defVid
        });
      }
      videos = await prisma.video.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, youtubeUrlOrId, type, category, duration, releasedAt } = body;

    // Verify admin passcode from header
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (passcodeHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin passcode" },
        { status: 401 }
      );
    }

    if (!title || !description || !youtubeUrlOrId || !type || !category || !duration || !releasedAt) {
      return NextResponse.json(
        { error: "Missing required fields (title, description, youtubeUrlOrId, type, category, duration, releasedAt)" },
        { status: 400 }
      );
    }

    const cleanYoutubeId = extractYoutubeId(youtubeUrlOrId);

    const newVideo = await prisma.video.create({
      data: {
        title,
        description,
        youtubeId: cleanYoutubeId,
        type,
        category,
        duration,
        releasedAt
      }
    });

    return NextResponse.json({ success: true, video: newVideo }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // Verify admin passcode from header
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (passcodeHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin passcode" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing video ID parameter" },
        { status: 400 }
      );
    }

    await prisma.video.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video: " + error.message },
      { status: 500 }
    );
  }
}
