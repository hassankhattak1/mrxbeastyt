import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getJob, removeJob } from "@/lib/jobManager";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
  }

  const downloaderUrl = process.env.DOWNLOADER_API_URL;

  // If DOWNLOADER_API_URL is configured (Vercel production), proxy finished file stream from VPS!
  if (downloaderUrl && downloaderUrl.trim().length > 0) {
    const vpsBase = downloaderUrl.trim().replace(/\/$/, "");
    const vpsRes = await fetch(`${vpsBase}/api/download/file/${jobId}`);

    if (!vpsRes.ok || !vpsRes.body) {
      return NextResponse.json({ error: "File not ready or expired on VPS" }, { status: vpsRes.status });
    }

    const contentType = vpsRes.headers.get("content-type") || "video/mp4";
    const contentDisposition =
      vpsRes.headers.get("content-disposition") || `attachment; filename="MRXBEASTYT_media.mp4"`;

    return new NextResponse(vpsRes.body as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }

  // Local fallback
  const job = getJob(jobId);
  if (!job || job.status !== "done" || !job.filePath || !fs.existsSync(job.filePath)) {
    return NextResponse.json({ error: "File not ready or job expired" }, { status: 404 });
  }

  const filePath = job.filePath;
  const filename = job.filename;
  const contentType = job.contentType;
  const fileStream = fs.createReadStream(filePath);

  let cleaned = false;
  const cleanupJob = () => {
    if (!cleaned) {
      cleaned = true;
      removeJob(jobId);
    }
  };

  const readableStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk: string | Buffer) => {
        const bufferChunk = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(bufferChunk));
      });

      fileStream.on("end", () => {
        cleanupJob();
        controller.close();
      });

      fileStream.on("error", (err) => {
        cleanupJob();
        controller.error(err);
      });

      fileStream.on("close", () => {
        cleanupJob();
      });
    },
    cancel() {
      fileStream.destroy();
      cleanupJob();
    },
  });

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
}
