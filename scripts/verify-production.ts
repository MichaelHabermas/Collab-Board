/**
 * Verifies production deployment: health check + Playwright E2E against PRODUCTION_URL.
 * Requires: PRODUCTION_URL or BASE_URL set to the Render (or other) app URL.
 *
 * Usage:
 *   PRODUCTION_URL=https://your-app.onrender.com bun run scripts/verify-production.ts
 *   BASE_URL=https://your-app.onrender.com bun run scripts/verify-production.ts
 */

const baseURL = process.env['PRODUCTION_URL'] ?? process.env['BASE_URL'];
if (!baseURL || typeof baseURL !== 'string') {
  process.stderr.write(
    'Set PRODUCTION_URL or BASE_URL to your live app URL, e.g.\n  PRODUCTION_URL=https://your-app.onrender.com bun run scripts/verify-production.ts\n'
  );
  process.exit(1);
}

const healthURL = `${baseURL.replace(/\/$/, '')}/api/health`;

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(healthURL);
    if (res.status !== 200) {
      process.stderr.write(`Health check failed: ${healthURL} returned ${res.status}\n`);
      return false;
    }
    const body = (await res.json()) as { status?: string };
    if (body?.status !== 'ok') {
      process.stderr.write(`Health check failed: expected { status: "ok" }, got ${JSON.stringify(body)}\n`);
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Health check failed: ${message}\n`);
    return false;
  }
  return true;
}

const clientDir = `${import.meta.dir}/../apps/client`;

async function installPlaywrightBrowsers(): Promise<boolean> {
  process.stdout.write('Playwright: installing Chromium if needed…\n');
  const proc = Bun.spawn(['bunx', 'playwright', 'install', 'chromium'], {
    cwd: clientDir,
    env: process.env,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exit = await proc.exited;
  return exit === 0;
}

async function runE2e(): Promise<boolean> {
  const ok = await installPlaywrightBrowsers();
  if (!ok) {
    process.stderr.write('Playwright Chromium install failed; E2E may fail.\n');
  }
  const proc = Bun.spawn(
    ['bun', 'run', 'test:e2e'],
    {
      cwd: clientDir,
      env: { ...process.env, BASE_URL: baseURL },
      stdout: 'inherit',
      stderr: 'inherit',
    }
  );
  const exit = await proc.exited;
  return exit === 0;
}

async function main(): Promise<void> {
  process.stdout.write(`Health: ${healthURL}\n`);
  if (!(await checkHealth())) {
    process.exit(1);
  }
  process.stdout.write('Health OK.\n');
  process.stdout.write(`E2E: baseURL=${baseURL}\n`);
  if (!(await runE2e())) {
    process.exit(1);
  }
  process.stdout.write('E2E OK.\n');
}

void main();
