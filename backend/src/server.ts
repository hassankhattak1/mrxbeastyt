import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { validateAndSanitizeUrl, validateFormatId, fetchVideoInfoWithYtDlp } from "./lib/ytdlp";
import { createDownloadJob, getJobState, deleteJob } from "./lib/jobManager";

// Load environment variables
dotenv.config();
if (fs.existsSync(path.join(__dirname, "..", ".env.local"))) {
  dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (allow process.env.FRONTEND_URL with '*' fallback for local dev)
const allowedOrigin = process.env.FRONTEND_URL || "*";
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (allowedOrigin === "*" || !origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for cross-origin downloads
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// 1. Health Check Endpoint (required for Render healthCheckPath: /api/health)
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "MRXBEASTYT Downloader API", uptime: process.uptime() });
});

// 2. Fetch Media Metadata
app.post("/api/fetch-media", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing or invalid URL parameter." });
    }

    const { valid, error: validationError, url: sanitizedUrl } = validateAndSanitizeUrl(url);
    if (!valid || !sanitizedUrl) {
      return res.status(400).json({ error: validationError || "Unsupported or invalid URL domain." });
    }

    const mediaInfo = await fetchVideoInfoWithYtDlp(sanitizedUrl);
    return res.status(200).json({ success: true, data: mediaInfo });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message || "Failed to process media extraction." });
  }
});

// 3. Start Download Job
app.post("/api/download/start", (req: Request, res: Response) => {
  try {
    const { url, formatId, title } = req.body;

    const { valid, error: validationError, url: sanitizedUrl } = validateAndSanitizeUrl(url);
    if (!valid || !sanitizedUrl) {
      return res.status(400).json({ error: validationError || "Invalid URL." });
    }

    if (!formatId || !validateFormatId(formatId)) {
      return res.status(400).json({ error: "Invalid format selection identifier." });
    }

    const result = createDownloadJob(sanitizedUrl, formatId, title || "Media");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || "Failed to initiate download job." });
  }
});

// 4. SSE Real-Time Job Progress Stream
app.get("/api/download/progress/:jobId", (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = setInterval(() => {
    const job = getJobState(jobId);
    if (!job) {
      sendEvent({ status: "error", error: "Job ID not found or expired.", progress: 0 });
      clearInterval(intervalId);
      return res.end();
    }

    sendEvent({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      filename: job.filename,
    });

    if (job.status === "done" || job.status === "error") {
      clearInterval(intervalId);
      res.end();
    }
  }, 350);

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

// 5. Download Completed File Stream
app.get("/api/download/file/:jobId", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = getJobState(jobId);

  if (!job || job.status !== "done" || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ error: "Requested download file is not ready or has expired." });
  }

  const filename = job.filename || `MRXBEASTYT_media.mp4`;
  const contentType = job.contentType || "video/mp4";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);

  const fileStream = fs.createReadStream(job.filePath);
  fileStream.pipe(res);

  fileStream.on("end", () => {
    deleteJob(jobId);
  });

  fileStream.on("error", () => {
    deleteJob(jobId);
  });
});

app.listen(PORT, () => {
  console.log(`[MRXBEASTYT Backend] Listening on port ${PORT}`);
});
