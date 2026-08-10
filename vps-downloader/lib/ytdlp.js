const { spawn } = require("child_process");

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

function validateAndSanitizeUrl(urlString) {
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

function validateFormatId(formatId) {
  if (!formatId || typeof formatId !== "string") return false;
  return /^[a-zA-Z0-9_\-\+\[\]<=/]+$/.test(formatId.trim());
}

function getYtDlpCommand() {
  const isWin = process.platform === "win32";
  const pythonExec = process.env.PYTHON_EXEC || (isWin ? "python" : "python3");
  return { command: pythonExec, argsPrefix: ["-m", "yt_dlp"] };
}

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function fetchVideoInfoWithYtDlp(url) {
  const { command, argsPrefix } = getYtDlpCommand();
  const args = [...argsPrefix, "-j", "--no-playlist", url];

  return new Promise((resolve, reject) => {
    // Never construct shell strings — use array-form spawn arguments only
    const child = spawn(command, args, { shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn yt-dlp on VPS: ${err.message}`));
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

        const normalizedFormats = [
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
            (f) => f.vcodec && f.vcodec !== "none" && f.height && f.height >= 360
          );

          filteredVideo
            .slice(-2)
            .reverse()
            .forEach((f) => {
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
        reject(new Error(`Failed to parse media metadata: ${parseError.message}`));
      }
    });
  });
}

module.exports = {
  validateAndSanitizeUrl,
  validateFormatId,
  getYtDlpCommand,
  getFfmpegPath,
  fetchVideoInfoWithYtDlp,
};
