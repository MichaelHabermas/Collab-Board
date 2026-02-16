const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
execSync("bun run build", { cwd: root, stdio: "pipe" });
const distPath = path.join(root, "dist", "index.html");
if (!fs.existsSync(distPath)) {
  process.exit(1);
}
process.exit(0);
