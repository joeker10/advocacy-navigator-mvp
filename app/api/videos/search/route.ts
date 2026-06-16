import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ success: true, videos: [] });
    }

    // Search query targeting the channel's search page directly
    const searchUrl = `https://www.youtube.com/@thespecialeducationnavigator/search?query=${encodeURIComponent(q)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      throw new Error(`YouTube responded with status ${res.status}`);
    }

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) {
      console.warn("Could not find ytInitialData in YouTube HTML response");
      return NextResponse.json({ success: true, videos: [] });
    }

    const json = JSON.parse(match[1]);
    const renderers: any[] = [];

    function findVideoRenderers(obj: any) {
      if (!obj || typeof obj !== "object") return;
      if (obj.videoRenderer) {
        renderers.push(obj.videoRenderer);
      } else {
        for (const key of Object.keys(obj)) {
          findVideoRenderers(obj[key]);
        }
      }
    }

    findVideoRenderers(json);

    const parsedVideos = renderers.map((r: any) => {
      const videoId = r.videoId;
      const title = r.title?.runs?.[0]?.text || "Untitled Video";
      const description = r.descriptionSnippet?.runs?.[0]?.text || "";
      const duration = r.lengthText?.simpleText || r.lengthText?.runs?.[0]?.text || "0:00";
      const releasedAt = r.publishedTimeText?.simpleText || "";

      // Detect if it is a Short or Widescreen Video
      const isShort = duration.includes(":") && !duration.includes("::") && (
        (duration.split(":").length === 2 && parseInt(duration.split(":")[0]) === 0) || 
        duration === "1:00" || 
        duration === "0:59"
      );

      return {
        id: `yt-${videoId}`,
        title,
        description,
        youtubeId: videoId,
        type: isShort ? "short" : "video",
        category: "YouTube Channel",
        duration,
        releasedAt
      };
    });

    return NextResponse.json({ success: true, videos: parsedVideos });
  } catch (error: any) {
    console.error("Error in YouTube search API route:", error);
    return NextResponse.json(
      { error: "Failed to search YouTube: " + error.message },
      { status: 500 }
    );
  }
}
