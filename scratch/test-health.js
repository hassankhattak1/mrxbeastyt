const fs = require("fs");
const path = require("path");

// Load .env.local manually for test script
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

// Register ts-node / typescript transpile if needed or test directly
const rawEnvPath = process.env.YTDLP_PATH;
console.log(`[RAW_YTDLP_PATH:${rawEnvPath}:END]`);

const isWin = process.platform === "win32";
let binPath;

if (rawEnvPath && rawEnvPath.trim().length > 0) {
  const cleanedPath = rawEnvPath.trim().replace(/^["']|["']$/g, "");
  binPath = path.resolve(cleanedPath);
} else {
  binPath = path.resolve(process.cwd(), "bin", isWin ? "yt-dlp.exe" : "yt-dlp");
}

console.log(`[RESOLVED_YTDLP_PATH:${binPath}:END]`);
console.log(`[EXISTS:${fs.existsSync(binPath)}:END]`);

const { spawn } = require("child_process");
const child = spawn(binPath, ["--version"], { shell: false });
let stdout = "";
child.stdout.on("data", (d) => (stdout += d.toString()));
child.on("close", (code) => {
  console.log(`[SPAWN_CODE:${code}:END]`);
  console.log(`[YTDLP_VERSION:${stdout.trim()}:END]`);
});
