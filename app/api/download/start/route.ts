import { NextRequest, NextResponse } from "next/server";
import { createDownloadJob } from "@/lib/jobManager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, formatId, title } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing video URL parameter" }, { status: 400 });
    }

    if (!formatId || typeof formatId !== "string") {
      return NextResponse.json({ error: "Missing formatId parameter" }, { status: 400 });
    }

    const downloaderUrl = process.env.DOWNLOADER_API_URL;

    // If DOWNLOADER_API_URL is configured (Vercel production), proxy start job request to VPS!
    if (downloaderUrl && downloaderUrl.trim().length > 0) {
      const vpsBase = downloaderUrl.trim().replace(/\/$/, "");
      const res = await fetch(`${vpsBase}/api/download/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, formatId, title }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.jobId) {
        return NextResponse.json({ error: data.error || "Failed to start job on VPS" }, { status: res.status });
      }

      return NextResponse.json({ success: true, jobId: data.jobId });
    }

    // Local fallback for dev without VPS
    const result = createDownloadJob(url, formatId, title || "Downloaded_Media");

    if (!result.success || !result.jobId) {
      return NextResponse.json({ error: result.error || "Failed to start download job" }, { status: 400 });
    }

    return NextResponse.json({ success: true, jobId: result.jobId });
  } catch (error) {
    console.error("Start download job error:", error);
    return NextResponse.json({ error: "Internal server error starting job" }, { status: 500 });
  }
}
