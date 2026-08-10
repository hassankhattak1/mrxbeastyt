import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobManager";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
  }

  const downloaderUrl = process.env.DOWNLOADER_API_URL;

  // If DOWNLOADER_API_URL is configured (Vercel production), proxy SSE progress stream from VPS!
  if (downloaderUrl && downloaderUrl.trim().length > 0) {
    const vpsBase = downloaderUrl.trim().replace(/\/$/, "");
    const vpsRes = await fetch(`${vpsBase}/api/download/progress/${jobId}`, {
      headers: { Accept: "text/event-stream" },
    });

    if (!vpsRes.ok || !vpsRes.body) {
      return NextResponse.json({ error: "Failed to connect to VPS SSE stream" }, { status: vpsRes.status });
    }

    return new NextResponse(vpsRes.body as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Local fallback
  const initialJob = getJob(jobId);
  if (!initialJob) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendState = () => {
        const job = getJob(jobId);
        if (!job) {
          const payload = JSON.stringify({ status: "error", progress: 0, error: "Job expired or not found" });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.close();
          return true;
        }

        const payload = JSON.stringify({
          status: job.status,
          progress: job.progress,
          error: job.error,
        });

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

        if (job.status === "done" || job.status === "error") {
          controller.close();
          return true;
        }

        return false;
      };

      const finished = sendState();
      if (finished) return;

      const interval = setInterval(() => {
        const isClosed = sendState();
        if (isClosed) {
          clearInterval(interval);
        }
      }, 350);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
