const fs = require("fs");
const path = require("path");
const https = require("https");

const isWin = process.platform === "win32";
const rootDir = path.join(__dirname, "..");
const binDir = path.join(rootDir, "bin");
const envLocalPath = path.join(rootDir, ".env.local");

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`[setup-ytdlp] Downloading ${url} -> ${destPath}...`);
    const file = fs.createWriteStream(destPath);

    function get(fileUrl) {
      https.get(fileUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return get(response.headers.location);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to download ${fileUrl}: Status ${response.statusCode}`));
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            if (!isWin) {
              try {
                fs.chmodSync(destPath, 0o755);
              } catch (e) {
                console.warn("[setup-ytdlp] chmod warning:", e.message);
              }
            }
            console.log(`[setup-ytdlp] Downloaded successfully: ${destPath}`);
            resolve();
          });
        });
      }).on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    get(url);
  });
}

async function setupYtDlp() {
  const binaryFilename = isWin ? "yt-dlp.exe" : "yt-dlp";
  const binaryPath = path.join(binDir, binaryFilename);

  // Download platform-specific yt-dlp binary if missing
  if (!fs.existsSync(binaryPath)) {
    const downloadUrl = isWin
      ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
      : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

    try {
      await downloadFile(downloadUrl, binaryPath);
    } catch (err) {
      console.error("[setup-ytdlp] Download error:", err.message);
    }
  } else {
    console.log(`[setup-ytdlp] Binary present at ${binaryPath}`);
    if (!isWin) {
      try {
        fs.chmodSync(binaryPath, 0o755);
      } catch {
        // Ignore chmod error
      }
    }
  }

  // Also ensure Linux binary exists for Linux deployments
  const linuxBinaryPath = path.join(binDir, "yt-dlp");
  if (!fs.existsSync(linuxBinaryPath)) {
    try {
      await downloadFile("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp", linuxBinaryPath);
    } catch {
      // Ignore fallback download error
    }
  }

  // Resolve FFmpeg path
  const ffmpegFilename = isWin ? "ffmpeg.exe" : "ffmpeg";
  let ffmpegPath = path.join(binDir, ffmpegFilename);
  if (!fs.existsSync(ffmpegPath)) {
    ffmpegPath = "ffmpeg";
  }

  // Automatically write or update .env.local if missing or unconfigured
  let envContent = "";
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf-8");
  }

  let updated = false;

  if (!envContent.includes("YTDLP_PATH=")) {
    envContent += `\nYTDLP_PATH=${binaryPath}\n`;
    updated = true;
  }

  if (!envContent.includes("FFMPEG_PATH=")) {
    envContent += `FFMPEG_PATH=${ffmpegPath}\n`;
    updated = true;
  }

  if (updated || !fs.existsSync(envLocalPath)) {
    fs.writeFileSync(envLocalPath, envContent.trim() + "\n", "utf-8");
    console.log(`[setup-ytdlp] Updated .env.local with YTDLP_PATH and FFMPEG_PATH`);
  }
}

setupYtDlp();
