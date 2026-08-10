const fs = require("fs");
const path = require("path");

if (fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

const { spawn } = require("child_process");
const isWin = process.platform === "win32";
const rawEnvPath = process.env.YTDLP_PATH;
const binPath = rawEnvPath ? path.resolve(rawEnvPath.trim().replace(/^["']|["']$/g, "")) : path.resolve(process.cwd(), "bin", isWin ? "yt-dlp.exe" : "yt-dlp");

const testUrl = "https://www.youtube.com/watch?v=5TayI9A8fp0";
console.log(`[TESTING_FETCH_MEDIA_METADATA:${testUrl}:END]`);

const child = spawn(binPath, ["-j", "--no-playlist", testUrl], { shell: false });
let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

child.on("close", (code) => {
  console.log(`[EXIT_CODE:${code}:END]`);
  if (code === 0) {
    try {
      const json = JSON.parse(stdout);
      console.log(`[SUCCESS_TITLE:${json.title}:END]`);
      console.log(`[SUCCESS_EXTRACTOR:${json.extractor}:END]`);
    } catch (e) {
      console.error("JSON parse error:", e.message);
    }
  } else {
    console.error("stderr:", stderr);
  }
});
