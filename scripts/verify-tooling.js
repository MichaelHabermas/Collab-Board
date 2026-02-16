const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pkgPath = path.join(__dirname, "..", "package.json");
if (!fs.existsSync(pkgPath)) process.exit(1);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
if (!pkg.scripts || typeof pkg.scripts !== "object") process.exit(1);

try {
  execSync("bun --version", { stdio: "pipe" });
} catch {
  process.exit(1);
}
process.exit(0);
