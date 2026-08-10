import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";
import {
  validateAndSanitizeUrl,
  validateFormatId,
  getYtDlpCommand,
  getFfmpegPath,
} from "./ytdlp";
import { tryAcquireJob, releaseJob } from "./concurrency";

export type JobStatus = "queued" | "downloading" | "merging" | "done" | "error";

export interface JobState {
  jobId: string;
  url: string;
  formatId: string;
  title: string;
  status: JobStatus;
  progress: number;
  filePath: string | null;
  filename: string;
  contentType: string;
  error: string | null;
  createdAt: number;
}

// In-memory Map storing active and completed download jobs
const jobsMap = new Map<string, JobState>();

// Automatic cleanup interval to prevent memory and disk leaks (cleans jobs > 10 mins old)
if (typeof globalThis !== "undefined") {
  const globalWithCleanup = globalThis as unknown as { _jobCleanupInterval?: NodeJS.Timeout };
  if (!globalWithCleanup._jobCleanupInterval) {
    globalWithCleanup._jobCleanupInterval = setInterval(() => {
      const now = Date.now();
      const tenMinutesMs = 10 * 60 * 1000;

      for (const [jobId, job] of jobsMap.entries()) {
        if (now - job.createdAt > tenMinutesMs) {
          if (job.filePath && fs.existsSync(job.filePath)) {
            try {
              fs.unlinkSync(job.filePath);
            } catch {
              // Ignore unlink error
            }
          }
          jobsMap.delete(jobId);
        }
      }
    }, 60 * 1000); // Check every minute
  }
}

export function getJob(jobId: string): JobState | undefined {
  return jobsMap.get(jobId);
}

export function createDownloadJob(
  rawUrl: string,
  rawFormatId: string,
  rawTitle: string
): { success: boolean; jobId?: string; error?: string } {
  // Validate FFmpeg
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) {
    return { success: false, error: "FFmpeg is required on the server for audio/video muxing." };
  }

  // Validate URL against whitelist
  const urlVal = validateAndSanitizeUrl(rawUrl);
  if (!urlVal.valid || !urlVal.url) {
    return { success: false, error: urlVal.error || "Invalid video URL" };
  }

  // Validate format ID
  if (!validateFormatId(rawFormatId)) {
    return { success: false, error: "Invalid format identifier requested" };
  }

  const url = urlVal.url;
  const jobId = crypto.randomUUID();
  const isAudio = rawFormatId.toLowerCase().includes("audio") || rawFormatId.toLowerCase().includes("mp3");

  const sanitizedTitle =
    rawTitle
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 60) || "Media";

  const extension = isAudio ? "mp3" : "mp4";
  const filename = `MRXBEASTYT_${sanitizedTitle}.${extension}`;
  const contentType = isAudio ? "audio/mpeg" : "video/mp4";

  // Create unique temp file path
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

  // Trigger background execution task
  processNextJobOrStart(jobId, ffmpegPath);

  return { success: true, jobId };
}

function processNextJobOrStart(jobId: string, ffmpegPath: string) {
  const job = jobsMap.get(jobId);
  if (!job) return;

  // Try acquiring concurrency slot
  if (!tryAcquireJob()) {
    job.status = "queued";
    // Retry acquiring slot after 1 second
    setTimeout(() => processNextJobOrStart(jobId, ffmpegPath), 1000);
    return;
  }

  // Acquired slot, start downloading
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

  const child = spawn(/*turbopackIgnore: true*/ command, args, { shell: false });

  let stderr = "";

  child.stdout.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      // Check if yt-dlp reported progress percentage
      const percentMatch = trimmed.match(/(\d+\.?\d*)%/);
      if (percentMatch && percentMatch[1]) {
        const parsed = parseFloat(percentMatch[1]);
        if (!isNaN(parsed)) {
          job.progress = Math.min(Math.round(parsed), 99);
        }
      }

      // Check if ffmpeg postprocessing / merging started
      if (trimmed.includes("[Merger]") || trimmed.includes("Merging formats") || trimmed.includes("[ExtractAudio]")) {
        job.status = "merging";
      }
    }
  });

  child.stderr.on("data", (data: Buffer) => {
    stderr += data.toString();
  });

  child.on("error", (err) => {
    releaseJob();
    job.status = "error";
    job.error = `Failed to execute yt-dlp child process: ${err.message}`;
  });

  child.on("close", (code) => {
    releaseJob();

    if (code === 0 && job.filePath && fs.existsSync(job.filePath)) {
      job.status = "done";
      job.progress = 100;
    } else {
      job.status = "error";
      let cleanErr = stderr.split("\n").filter((line) => line.includes("ERROR:")).join(" ");
      if (!cleanErr) cleanErr = `Process failed with exit code ${code}`;
      job.error = cleanErr;

      if (job.filePath && fs.existsSync(job.filePath)) {
        try {
          fs.unlinkSync(job.filePath);
        } catch {
          // Ignore unlink error
        }
      }
    }
  });
}

export function removeJob(jobId: string): void {
  const job = jobsMap.get(jobId);
  if (job) {
    if (job.filePath && fs.existsSync(job.filePath)) {
      try {
        fs.unlinkSync(job.filePath);
      } catch {
        // Ignore unlink error
      }
    }
    jobsMap.delete(jobId);
  }
}
