import fs from "node:fs";
import { execFileSync } from "node:child_process";

if (process.platform !== "win32")
  throw Error("Package on Windows to verify native integrations.");
fs.rmSync("release", { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    "node_modules/electron-builder/out/cli/cli.js",
    "--win",
    "nsis",
    "--x64",
    "--publish",
    "never",
  ],
  { stdio: "inherit" },
);
