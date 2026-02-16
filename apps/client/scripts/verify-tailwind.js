const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
execSync("bun run build", { cwd: root, stdio: "pipe" });
const distDir = path.join(root, "dist", "assets");
const files = fs.readdirSync(distDir);
const hasCss = files.some((f) => f.endsWith(".css"));
if (!hasCss) {
  process.exit(1);
}
process.exit(0);
