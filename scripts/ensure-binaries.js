const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const isWin = process.platform === "win32";
const binDir = path.join(__dirname, "..", "bin");

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const ytDlpFilename = isWin ? "yt-dlp.exe" : "yt-dlp";
const ytDlpPath = path.join(binDir, ytDlpFilename);

const ytDlpUrl = isWin
  ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
  : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`[ensure-binaries] Downloading ${url} -> ${destPath}...`);
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
                console.warn("[ensure-binaries] chmod failed:", e.message);
              }
            }
            console.log(`[ensure-binaries] Downloaded successfully: ${destPath}`);
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

async function ensureBinaries() {
  if (!fs.existsSync(ytDlpPath)) {
    try {
      await downloadFile(ytDlpUrl, ytDlpPath);
    } catch (err) {
      console.error("[ensure-binaries] Error downloading yt-dlp:", err.message);
    }
  } else {
    console.log(`[ensure-binaries] yt-dlp binary already present at ${ytDlpPath}`);
    if (!isWin) {
      try {
        fs.chmodSync(ytDlpPath, 0o755);
      } catch (e) {
        // Ignore chmod error
      }
    }
  }

  // Check ffmpeg binary
  const ffmpegFilename = isWin ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegPath = path.join(binDir, ffmpegFilename);

  if (!fs.existsSync(ffmpegPath)) {
    try {
      // Try copying from @ffmpeg-installer if present
      const installerPath = path.join(
        __dirname,
        "..",
        "node_modules",
        "@ffmpeg-installer",
        isWin ? "win32-x64" : process.platform === "darwin" ? (process.arch === "arm64" ? "darwin-arm64" : "darwin-x64") : "linux-x64",
        ffmpegFilename
      );

      if (fs.existsSync(installerPath)) {
        fs.copyFileSync(installerPath, ffmpegPath);
        if (!isWin) fs.chmodSync(ffmpegPath, 0o755);
        console.log(`[ensure-binaries] Copied ffmpeg from installer to ${ffmpegPath}`);
      }
    } catch (err) {
      console.warn("[ensure-binaries] Warning checking ffmpeg installer:", err.message);
    }
  } else {
    console.log(`[ensure-binaries] ffmpeg binary already present at ${ffmpegPath}`);
    if (!isWin) {
      try {
        fs.chmodSync(ffmpegPath, 0o755);
      } catch (e) {
        // Ignore chmod error
      }
    }
  }
}

ensureBinaries();
