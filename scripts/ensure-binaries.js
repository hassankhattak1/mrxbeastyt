const fs = require("fs");
const path = require("path");
const https = require("https");

const binDir = path.join(__dirname, "..", "bin");

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

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
            if (process.platform !== "win32") {
              try {
                fs.chmodSync(destPath, 0o755);
              } catch (e) {
                console.warn("[ensure-binaries] chmod warning:", e.message);
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
  const linuxYtDlp = path.join(binDir, "yt-dlp");
  const winYtDlp = path.join(binDir, "yt-dlp.exe");

  // Ensure Linux binary
  if (!fs.existsSync(linuxYtDlp)) {
    try {
      await downloadFile("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp", linuxYtDlp);
    } catch (err) {
      console.error("[ensure-binaries] Error downloading Linux yt-dlp:", err.message);
    }
  } else {
    console.log(`[ensure-binaries] Linux yt-dlp binary present at ${linuxYtDlp}`);
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(linuxYtDlp, 0o755);
      } catch {
        // Ignore chmod error
      }
    }
  }

  // Ensure Windows binary
  if (!fs.existsSync(winYtDlp)) {
    try {
      await downloadFile("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe", winYtDlp);
    } catch (err) {
      console.error("[ensure-binaries] Error downloading Windows yt-dlp:", err.message);
    }
  } else {
    console.log(`[ensure-binaries] Windows yt-dlp binary present at ${winYtDlp}`);
  }

  // Check ffmpeg binary
  const isWin = process.platform === "win32";
  const ffmpegFilename = isWin ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegPath = path.join(binDir, ffmpegFilename);

  if (!fs.existsSync(ffmpegPath)) {
    try {
      const installerPath = path.join(
        __dirname,
        "..",
        "node_modules",
        "@ffmpeg-installer",
        isWin
          ? "win32-x64"
          : process.platform === "darwin"
          ? process.arch === "arm64"
            ? "darwin-arm64"
            : "darwin-x64"
          : "linux-x64",
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
    console.log(`[ensure-binaries] ffmpeg binary present at ${ffmpegPath}`);
    if (!isWin) {
      try {
        fs.chmodSync(ffmpegPath, 0o755);
      } catch {
        // Ignore chmod error
      }
    }
  }
}

ensureBinaries();
