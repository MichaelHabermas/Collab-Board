const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
execSync("bun run build", { cwd: root, stdio: "pipe" });
const distIndex = path.join(root, "dist", "index.html");
const distHtml = fs.readFileSync(distIndex, "utf8");
if (!distHtml.includes("root") || !fs.existsSync(distIndex)) {
  process.exit(1);
}
process.exit(0);
