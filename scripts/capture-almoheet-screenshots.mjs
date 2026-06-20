import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "sync-almoheet-screenshots.mjs"
);

const result = spawnSync(process.execPath, [scriptPath], { stdio: "inherit" });
process.exit(result.status ?? 1);
