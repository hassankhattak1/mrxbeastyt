const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { validateAndSanitizeUrl, validateFormatId, fetchVideoInfoWithYtDlp } = require("./lib/ytdlp");
const { createDownloadJob, getJobState, deleteJob } = require("./lib/jobManager");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "MRXBEASTYT VPS Downloader API", uptime: process.uptime() });
});

// Fetch Media Metadata Endpoint
app.post("/api/fetch-media", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid URL parameter." });
    }

    const { valid, error: validationError, url: sanitizedUrl } = validateAndSanitizeUrl(url);
    if (!valid || !sanitizedUrl) {
      return res.status(400).json({ success: false, error: validationError || "Unsupported or invalid URL domain." });
    }

    const mediaInfo = await fetchVideoInfoWithYtDlp(sanitizedUrl);
    return res.status(200).json({ success: true, data: mediaInfo });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "VPS metadata extraction failed." });
  }
});

// Start Download Job Endpoint
app.post("/api/download/start", (req, res) => {
  try {
    const { url, formatId, title } = req.body || {};

    const { valid, error: validationError, url: sanitizedUrl } = validateAndSanitizeUrl(url);
    if (!valid || !sanitizedUrl) {
      return res.status(400).json({ success: false, error: validationError || "Invalid URL." });
    }

    if (!formatId || !validateFormatId(formatId)) {
      return res.status(400).json({ success: false, error: "Invalid format selection identifier." });
    }

    const result = createDownloadJob(sanitizedUrl, formatId, title || "Media");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to start download job on VPS." });
  }
});

// SSE Progress Event Stream Endpoint
app.get("/api/download/progress/:jobId", (req, res) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = setInterval(() => {
    const job = getJobState(jobId);
    if (!job) {
      sendEvent({ status: "error", error: "Job ID not found or expired on VPS.", progress: 0 });
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

// Download Completed File Stream Endpoint
app.get("/api/download/file/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = getJobState(jobId);

  if (!job || job.status !== "done" || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ error: "Requested download file is not ready or has expired on VPS." });
  }

  const filename = job.filename || "MRXBEASTYT_media.mp4";
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
  console.log(`[MRXBEASTYT VPS Downloader] Listening on port ${PORT}`);
});
