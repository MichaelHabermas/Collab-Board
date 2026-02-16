const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
try {
  execSync("bun run typecheck", { cwd: root, stdio: "pipe" });
} catch {
  process.exit(1);
}
process.exit(0);
