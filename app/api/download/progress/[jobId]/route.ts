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

  const initialJob = getJob(jobId);
  if (!initialJob) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
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

      // Poll job state every 350ms
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
