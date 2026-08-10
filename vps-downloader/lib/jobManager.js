const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { validateAndSanitizeUrl, validateFormatId, getYtDlpCommand, getFfmpegPath } = require("./ytdlp");

const jobsMap = new Map();

// Automatic periodic cleanup interval (10 minutes)
const TEN_MINUTES_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobsMap.entries()) {
    if (now - job.createdAt > TEN_MINUTES_MS) {
      if (job.filePath && fs.existsSync(job.filePath)) {
        try {
          fs.unlinkSync(job.filePath);
        } catch {
          // Ignore deletion error
        }
      }
      jobsMap.delete(jobId);
    }
  }
}, 60 * 1000);

let activeJobCount = 0;
const MAX_CONCURRENT_JOBS = 5;

function createDownloadJob(rawUrl, rawFormatId, rawTitle) {
  const urlVal = validateAndSanitizeUrl(rawUrl);
  if (!urlVal.valid || !urlVal.url) {
    return { success: false, error: urlVal.error || "Invalid URL" };
  }

  if (!validateFormatId(rawFormatId)) {
    return { success: false, error: "Invalid format identifier" };
  }

  const url = urlVal.url;
  const jobId = crypto.randomUUID();
  const isAudio = rawFormatId.toLowerCase().includes("audio") || rawFormatId.toLowerCase().includes("mp3");

  const sanitizedTitle =
    (rawTitle || "Media")
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 60) || "Media";

  const extension = isAudio ? "mp3" : "mp4";
  const filename = `MRXBEASTYT_${sanitizedTitle}.${extension}`;
  const contentType = isAudio ? "audio/mpeg" : "video/mp4";

  const tempDir = path.join(os.tmpdir(), "mrxbeastyt_vps_jobs");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `${jobId}.${extension}`);

  const initialJob = {
    jobId,
    url,
    formatId: rawFormatId,
    title: rawTitle,
    status: "queued",
    progress: 0,
    filePath: tempFilePath,
    filename,
    contentType,
    error: null,
    createdAt: Date.now(),
  };

  jobsMap.set(jobId, initialJob);
  processNextJob(jobId);

  return { success: true, jobId };
}

function processNextJob(jobId) {
  const job = jobsMap.get(jobId);
  if (!job) return;

  if (activeJobCount >= MAX_CONCURRENT_JOBS) {
    job.status = "queued";
    setTimeout(() => processNextJob(jobId), 1000);
    return;
  }

  activeJobCount++;
  job.status = "downloading";

  const { command, argsPrefix } = getYtDlpCommand();
  const ffmpegPath = getFfmpegPath();

  const isAudio = job.formatId.toLowerCase().includes("audio") || job.formatId.toLowerCase().includes("mp3");
  const extension = isAudio ? "mp3" : "mp4";

  let formatSelector = job.formatId;
  if (!isAudio && !job.formatId.includes("+")) {
    formatSelector = `${job.formatId}+bestaudio/best`;
  }

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
    "--newline",
    "--progress-template",
    "%(progress._percent_str)s",
    "-o",
    job.filePath,
    "--no-playlist",
    job.url,
  ];

  // Spawn child process safely using argument array only
  const child = spawn(command, args, { shell: false });
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const percentMatch = trimmed.match(/(\d+\.?\d*)%/);
      if (percentMatch) {
        const val = parseFloat(percentMatch[1]);
        if (!isNaN(val)) {
          job.progress = Math.min(Math.round(val), 99);
        }
      }

      if (trimmed.includes("[Merger]") || trimmed.includes("[ffmpeg]") || trimmed.includes("Extracting audio")) {
        job.status = "merging";
      }
    }
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("error", (err) => {
    activeJobCount = Math.max(0, activeJobCount - 1);
    job.status = "error";
    job.error = `VPS execution error: ${err.message}`;
  });

  child.on("close", (code) => {
    activeJobCount = Math.max(0, activeJobCount - 1);
    if (code === 0 && job.filePath && fs.existsSync(job.filePath)) {
      job.status = "done";
      job.progress = 100;
    } else {
      job.status = "error";
      let cleanErr = stderr.split("\n").filter((l) => l.includes("ERROR:")).join(" ");
      if (!cleanErr) cleanErr = "Download failed or format stream is unavailable on VPS.";
      job.error = cleanErr;
    }
  });
}

function getJobState(jobId) {
  return jobsMap.get(jobId) || null;
}

function deleteJob(jobId) {
  const job = jobsMap.get(jobId);
  if (job) {
    if (job.filePath && fs.existsSync(job.filePath)) {
      try {
        fs.unlinkSync(job.filePath);
      } catch {
        // Ignore deletion error
      }
    }
    jobsMap.delete(jobId);
  }
}

module.exports = {
  createDownloadJob,
  getJobState,
  deleteJob,
};
