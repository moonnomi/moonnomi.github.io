import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startStudio } from "./studio.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const studioServer = await startStudio();
const isWindows = process.platform === "win32";
const npmExecutable = isWindows ? (process.env.ComSpec || "cmd.exe") : "npm";
const npmArguments = isWindows
  ? ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 3000"]
  : ["run", "dev", "--", "--host", "127.0.0.1", "--port", "3000"];
const siteProcess = spawn(
  npmExecutable,
  npmArguments,
  {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  },
);

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  siteProcess.kill("SIGINT");
  studioServer.close(() => {
    process.exitCode = exitCode;
  });
}

siteProcess.on("error", (error) => {
  console.error("Could not start the portfolio preview: " + error.message);
  shutdown(1);
});

siteProcess.on("exit", (code) => {
  if (!shuttingDown) shutdown(code ?? 0);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
