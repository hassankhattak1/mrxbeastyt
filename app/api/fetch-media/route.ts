import { NextRequest, NextResponse } from "next/server";
import { validateAndSanitizeUrl, fetchVideoInfoWithYtDlp } from "@/lib/ytdlp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter a valid video URL" },
        { status: 400 }
      );
    }

    // 1. Server-side URL validation & sanitization against domain whitelist
    const urlValidation = validateAndSanitizeUrl(url);
    if (!urlValidation.valid || !urlValidation.url) {
      return NextResponse.json(
        { success: false, error: urlValidation.error || "Invalid URL provided." },
        { status: 400 }
      );
    }

    const sanitizedUrl = urlValidation.url;

    // 2. Run server-side yt-dlp extraction
    const videoData = await fetchVideoInfoWithYtDlp(sanitizedUrl);

    // 3. Return real normalized media response
    return NextResponse.json({
      success: true,
      data: videoData,
    });
  } catch (error) {
    const errorMessage = (error as Error).message || "Failed to extract video information.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
