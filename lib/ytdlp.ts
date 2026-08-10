import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Allowed domain whitelist to prevent SSRF / arbitrary command execution
const ALLOWED_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.watch",
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "vimeo.com",
  "www.vimeo.com",
  "pinterest.com",
  "www.pinterest.com",
  "pin.it",
  "reddit.com",
  "www.reddit.com",
  "twitch.tv",
  "www.twitch.tv",
];

export function validateAndSanitizeUrl(urlString: string): { valid: boolean; error?: string; url?: string } {
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP and HTTPS URLs are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: "URL domain is not supported. Allowed platforms: YouTube, Facebook, Instagram, TikTok, Twitter/X, Vimeo, Pinterest, Reddit, Twitch.",
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: "Invalid URL string provided." };
  }
}

export function validateFormatId(formatId: string): boolean {
  if (!formatId || typeof formatId !== "string") return false;
  return /^[a-zA-Z0-9_\-\+\[\]<=/]+$/.test(formatId.trim());
}

export function getYtDlpCommand(): { command: string; argsPrefix: string[] } {
  const isWin = process.platform === "win32";

  // Read binary path from process.env.YTDLP_PATH or default to ./bin/yt-dlp
  let binPath = process.env.YTDLP_PATH;

  if (!binPath) {
    binPath = path.join(process.cwd(), "bin", isWin ? "yt-dlp.exe" : "yt-dlp");
  }

  // Check file existence
  if (!fs.existsSync(/*turbopackIgnore: true*/ binPath)) {
    throw new Error(`[yt-dlp] FATAL: YTDLP_PATH binary missing or undefined at: ${binPath}`);
  }

  // Enforce executable permissions on non-Windows OS
  if (!isWin) {
    try {
      fs.chmodSync(binPath, 0o755);
    } catch {
      // Ignore chmod warning
    }
  }

  // Verify executable access
  try {
    fs.accessSync(binPath, fs.constants.X_OK);
  } catch (accessErr) {
    throw new Error(`[yt-dlp] FATAL: Binary at ${binPath} is not executable: ${(accessErr as Error).message}`);
  }

  return { command: binPath, argsPrefix: [] };
}

export function getFfmpegPath(): string {
  const isWin = process.platform === "win32";

  // Read ffmpeg path from process.env.FFMPEG_PATH or default to local/system ffmpeg
  let ffmpegPath = process.env.FFMPEG_PATH;

  if (!ffmpegPath) {
    const localFfmpeg = path.join(process.cwd(), "bin", isWin ? "ffmpeg.exe" : "ffmpeg");
    if (fs.existsSync(/*turbopackIgnore: true*/ localFfmpeg)) {
      ffmpegPath = localFfmpeg;
    } else {
      ffmpegPath = "ffmpeg";
    }
  }

  if (ffmpegPath !== "ffmpeg") {
    if (!fs.existsSync(/*turbopackIgnore: true*/ ffmpegPath)) {
      console.warn(`[ffmpeg] Warning: FFMPEG_PATH target file does not exist at ${ffmpegPath}, falling back to system PATH 'ffmpeg'`);
      return "ffmpeg";
    }
    if (!isWin) {
      try {
        fs.chmodSync(ffmpegPath, 0o755);
      } catch {
        // Ignore chmod error
      }
    }
  }

  return ffmpegPath;
}

// Boot/startup health check
let healthCheckPassed = false;

export async function performBinaryHealthCheck(): Promise<boolean> {
  if (healthCheckPassed) return true;

  try {
    const { command } = getYtDlpCommand();

    return new Promise((resolve) => {
      const child = spawn(/*turbopackIgnore: true*/ command, ["--version"], { shell: false });

      let stdout = "";
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.on("error", (err) => {
        console.error(`[yt-dlp health check] FATAL: Failed to execute binary at ${command}: ${err.message}`);
        resolve(false);
      });

      child.on("close", (code) => {
        if (code === 0) {
          healthCheckPassed = true;
          console.log(`[yt-dlp health check] Ready: Standalone binary v${stdout.trim()} at ${command}`);
          resolve(true);
        } else {
          console.error(`[yt-dlp health check] FATAL: Binary at ${command} exited with code ${code}`);
          resolve(false);
        }
      });
    });
  } catch (err) {
    console.error((err as Error).message);
    return false;
  }
}

// Execute health check on module import
performBinaryHealthCheck().catch(() => {});

export interface NormalizedFormat {
  formatId: string;
  quality: string;
  format: string;
  size: string;
  type: "video" | "audio";
  resolution?: string;
}

export interface YtDlpVideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  webpageUrl: string;
  formats: NormalizedFormat[];
}

export async function fetchVideoInfoWithYtDlp(url: string): Promise<YtDlpVideoInfo> {
  const isHealthy = await performBinaryHealthCheck();
  if (!isHealthy) {
    throw new Error("Server yt-dlp binary health check failed. YTDLP_PATH binary is missing or non-executable.");
  }

  const { command, argsPrefix } = getYtDlpCommand();
  const args = [...argsPrefix, "-j", "--no-playlist", url];

  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ command, args, { shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn standalone yt-dlp binary: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        let cleanErr = stderr.split("\n").filter((line) => line.includes("ERROR:")).join(" ");
        if (!cleanErr) cleanErr = "Video is private, age-restricted, removed, or unavailable.";
        return reject(new Error(cleanErr));
      }

      try {
        const rawJson = JSON.parse(stdout);
        const title = rawJson.title || "Extracted Media Stream";
        const thumbnail =
          rawJson.thumbnail ||
          rawJson.thumbnails?.[0]?.url ||
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop";

        const durSec = typeof rawJson.duration === "number" ? rawJson.duration : 0;
        const minutes = Math.floor(durSec / 60);
        const seconds = Math.floor(durSec % 60);
        const duration = durSec > 0 ? `${minutes}:${seconds < 10 ? "0" : ""}${seconds}` : "N/A";

        const platform = rawJson.extractor_key || rawJson.extractor || "Media Platform";

        const normalizedFormats: NormalizedFormat[] = [
          {
            formatId: "bestvideo[height<=1080]",
            quality: "1080p Full HD (merged audio)",
            format: "MP4",
            size: "Best Available",
            type: "video",
            resolution: "1920x1080",
          },
          {
            formatId: "bestvideo[height<=720]",
            quality: "720p HD (merged audio)",
            format: "MP4",
            size: "HD Quality",
            type: "video",
            resolution: "1280x720",
          },
          {
            formatId: "bestvideo[height<=480]",
            quality: "480p SD (merged audio)",
            format: "MP4",
            size: "Standard Quality",
            type: "video",
            resolution: "854x480",
          },
          {
            formatId: "bestaudio/best",
            quality: "Original Audio Track",
            format: "MP3",
            size: "High Bitrate Audio",
            type: "audio",
            resolution: "Audio Only",
          },
        ];

        if (Array.isArray(rawJson.formats)) {
          const rawFormats = rawJson.formats;

          const filteredVideo = rawFormats.filter(
            (f: { vcodec?: string; height?: number }) =>
              f.vcodec && f.vcodec !== "none" && f.height && f.height >= 360
          );

          filteredVideo
            .slice(-2)
            .reverse()
            .forEach((f: { format_id: string; height?: number; ext?: string; filesize?: number }) => {
              const sizeMb = f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : "Merged Stream";
              const ext = (f.ext || "mp4").toUpperCase();
              normalizedFormats.push({
                formatId: f.format_id,
                quality: `${f.height}p Stream (merged audio)`,
                format: ext,
                size: sizeMb,
                type: "video",
                resolution: `${f.height}p`,
              });
            });
        }

        resolve({
          title,
          thumbnail,
          duration,
          platform,
          webpageUrl: rawJson.webpage_url || url,
          formats: normalizedFormats,
        });
      } catch (parseError) {
        reject(new Error(`Failed to parse media metadata: ${(parseError as Error).message}`));
      }
    });
  });
}
