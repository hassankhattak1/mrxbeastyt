import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { getYtDlpCommand, getFfmpegPath } from "./ytdlp";
import { tryAcquireJob, releaseJob } from "./concurrency";

export interface JobState {
  jobId: string;
  url: string;
  formatId: string;
  title: string;
  status: "queued" | "downloading" | "merging" | "done" | "error";
  progress: number; // 0 to 100
  filePath: string | null;
  filename: string | null;
  contentType: string | null;
  error: string | null;
  createdAt: number;
}

// In-memory Map tracking active download jobs
const jobsMap = new Map<string, JobState>();

// Periodic cleanup: purge jobs and temp files older than 10 minutes
const TEN_MINUTES_MS = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobsMap.entries()) {
    if (now - job.createdAt > TEN_MINUTES_MS) {
      if (job.filePath && fs.existsSync(job.filePath)) {
        try {
          fs.unlinkSync(job.filePath);
        } catch {
          // Ignore cleanup errors
        }
      }
      jobsMap.delete(jobId);
    }
  }
}, 60 * 1000);

export function createDownloadJob(url: string, rawFormatId: string, rawTitle: string): { success: boolean; jobId: string } {
  const ffmpegPath = getFfmpegPath();
  const jobId = crypto.randomUUID();

  const isAudio = rawFormatId.toLowerCase().includes("audio") || rawFormatId.toLowerCase().includes("mp3");
  const sanitizedTitle =
    rawTitle
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 60) || "Media";

  const extension = isAudio ? "mp3" : "mp4";
  const filename = `MRXBEASTYT_${sanitizedTitle}.${extension}`;
  const contentType = isAudio ? "audio/mpeg" : "video/mp4";

  const tempDir = path.join(os.tmpdir(), "mrxbeastyt_jobs");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `${jobId}.${extension}`);

  const initialJob: JobState = {
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

  processNextJobOrStart(jobId, ffmpegPath);

  return { success: true, jobId };
}

function processNextJobOrStart(jobId: string, ffmpegPath: string) {
  const job = jobsMap.get(jobId);
  if (!job) return;

  if (!tryAcquireJob()) {
    job.status = "queued";
    setTimeout(() => processNextJobOrStart(jobId, ffmpegPath), 1000);
    return;
  }

  job.status = "downloading";

  const { command, argsPrefix } = getYtDlpCommand();
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
    job.filePath!,
    "--no-playlist",
    job.url,
  ];

  const child = spawn(command, args, { shell: false });
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer) => {
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

  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  child.on("error", (err: Error) => {
    releaseJob();
    job.status = "error";
    job.error = `Failed to start download process: ${err.message}`;
  });

  child.on("close", (code: number) => {
    releaseJob();
    if (code === 0 && job.filePath && fs.existsSync(job.filePath)) {
      job.status = "done";
      job.progress = 100;
    } else {
      job.status = "error";
      let cleanErr = stderr.split("\n").filter((l) => l.includes("ERROR:")).join(" ");
      if (!cleanErr) cleanErr = "Download failed or format stream is unavailable.";
      job.error = cleanErr;
    }
  });
}

export function getJobState(jobId: string): JobState | null {
  return jobsMap.get(jobId) || null;
}

export function deleteJob(jobId: string): void {
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
