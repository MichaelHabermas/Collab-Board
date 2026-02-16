const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
execSync("bun run build", { cwd: root, stdio: "pipe" });
const distDir = path.join(root, "dist");
if (!fs.existsSync(path.join(distDir, "index.html"))) {
  process.exit(1);
}
const jsFile = fs.readdirSync(path.join(distDir, "assets")).find((f) => f.endsWith(".js"));
if (!jsFile) {
  process.exit(1);
}
const jsContent = fs.readFileSync(path.join(distDir, "assets", jsFile), "utf8");
if (!jsContent.includes("data-slot") && !jsContent.includes("Click me")) {
  process.exit(1);
}
process.exit(0);
