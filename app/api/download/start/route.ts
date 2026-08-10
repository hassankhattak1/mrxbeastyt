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
