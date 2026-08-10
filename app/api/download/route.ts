import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import {
  validateAndSanitizeUrl,
  validateFormatId,
  getYtDlpCommand,
  getFfmpegPath,
} from "@/lib/ytdlp";
import { tryAcquireJob, releaseJob } from "@/lib/concurrency";

export async function GET(req: NextRequest) {
  let isAcquired = false;
  let tempFilePath: string | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");
    const formatId = searchParams.get("formatId") || "best";
    const rawTitle = searchParams.get("title") || "Downloaded_Video";

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing video URL parameter" }, { status: 400 });
    }

    // 1. Check FFmpeg availability on server
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) {
      return NextResponse.json(
        { error: "FFmpeg is required on the server for audio/video muxing." },
        { status: 500 }
      );
    }

    // 2. Validate URL against allowed domain whitelist
    const urlValidation = validateAndSanitizeUrl(rawUrl);
    if (!urlValidation.valid || !urlValidation.url) {
      return NextResponse.json({ error: urlValidation.error || "Invalid video URL" }, { status: 400 });
    }

    // 3. Validate formatId string
    if (!validateFormatId(formatId)) {
      return NextResponse.json({ error: "Invalid format identifier requested" }, { status: 400 });
    }

    // 4. In-memory concurrency limit check
    if (!tryAcquireJob()) {
      return NextResponse.json(
        { error: "Server download concurrency limit reached. Please try again in a few seconds." },
        { status: 429 }
      );
    }
    isAcquired = true;

    const validatedUrl = urlValidation.url;
    const isAudio = formatId.toLowerCase().includes("audio") || formatId.toLowerCase().includes("mp3");

    // 5. Build format selector pairing with best audio if needed
    let formatSelector = formatId;
    if (!isAudio && !formatId.includes("+")) {
      formatSelector = `${formatId}+bestaudio/best`;
    }

    // Clean title for Content-Disposition header
    const sanitizedTitle =
      rawTitle
        .replace(/[^a-zA-Z0-9_\- ]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .substring(0, 60) || "Media";

    const extension = isAudio ? "mp3" : "mp4";
    const filename = `MRXBEASTYT_${sanitizedTitle}.${extension}`;

    // 6. Create unique temp file path in os.tmpdir() subfolder
    const tempDir = path.join(os.tmpdir(), "mrxbeastyt_downloads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    tempFilePath = path.join(tempDir, `${uniqueId}.${extension}`);

    // 7. Resolve yt-dlp binary command
    const { command, argsPrefix } = getYtDlpCommand();
    const args = [
      ...argsPrefix,
      "-f",
      formatSelector,
      "--ffmpeg-location",
      ffmpegPath,
      "--merge-output-format",
      extension,
      "--postprocessor-args",
      "ffmpeg:-c:v copy -c:a aac",
      "-o",
      tempFilePath,
      "--no-playlist",
      validatedUrl,
    ];

    // 8. Spawn yt-dlp with ffmpeg audio/video merging to disk
    await new Promise<void>((resolve, reject) => {
      const child = spawn(/*turbopackIgnore: true*/ command, args, { shell: false });

      let stderr = "";

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        reject(new Error(`Failed to execute yt-dlp child process: ${err.message}`));
      });

      child.on("close", (code) => {
        if (code === 0 && tempFilePath && fs.existsSync(tempFilePath)) {
          resolve();
        } else {
          let cleanErr = stderr.split("\n").filter((line) => line.includes("ERROR:")).join(" ");
          if (!cleanErr) cleanErr = `Process exited with code ${code}`;
          reject(new Error(`yt-dlp/ffmpeg execution failed: ${cleanErr}`));
        }
      });
    });

    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Merged media output file was not created.");
    }

    const targetTempFile = tempFilePath;
    const fileStream = fs.createReadStream(targetTempFile);

    let released = false;
    const cleanup = () => {
      if (!released) {
        released = true;
        releaseJob();
      }
      if (fs.existsSync(targetTempFile)) {
        fs.unlink(targetTempFile, () => {});
      }
    };

    // 9. Stream readStream to Web ReadableStream and clean temp file on complete/close
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk: string | Buffer) => {
          const bufferChunk = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(bufferChunk));
        });

        fileStream.on("end", () => {
          cleanup();
          controller.close();
        });

        fileStream.on("error", (err) => {
          cleanup();
          controller.error(err);
        });

        fileStream.on("close", () => {
          cleanup();
        });
      },
      cancel() {
        fileStream.destroy();
        cleanup();
      },
    });

    const contentType = isAudio ? "audio/mpeg" : "video/mp4";

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    if (isAcquired) {
      releaseJob();
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // Silently ignore unlink error
      }
    }

    console.error("Download route error:", error);
    const errorMessage = (error as Error).message || "Download and muxing failed.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
