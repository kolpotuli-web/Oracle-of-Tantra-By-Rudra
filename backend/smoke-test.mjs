import { spawn } from 'node:child_process';
import process from 'node:process';

const port = 4317;
const env = {
  ...process.env,
  PORT: String(port),
  FRONTEND_ORIGIN: `http://localhost:${port}`,
  OPENAI_API_KEY: '',
};
const child = spawn(process.execPath, ['server.js'], {
  cwd: new URL('.', import.meta.url).pathname,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const stop = () => {
  if (!child.killed) child.kill('SIGTERM');
};
process.on('exit', stop);

function waitForStart() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for backend startup.')),
      10000,
    );
    const onData = (chunk) => {
      const text = String(chunk);
      if (text.includes('Oracle backend listening')) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        child.stderr.off('data', onErr);
        resolve();
      }
    };
    const onErr = (chunk) => {
      if (String(chunk).includes('EADDRINUSE')) {
        clearTimeout(timer);
        reject(new Error('Smoke-test port is already in use.'));
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onErr);
  });
}

async function main() {
  await waitForStart();
  const health = await fetch(`http://localhost:${port}/api/health`);
  if (!health.ok) throw new Error(`/api/health returned ${health.status}`);
  const healthJson = await health.json();
  if (healthJson.ok !== true) throw new Error('Health endpoint did not return ok=true.');

  const invalid = await fetch(`http://localhost:${port}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'xx', messages: [] }),
  });
  if (invalid.status !== 400)
    throw new Error(`/api/chat validation returned ${invalid.status}, expected 400.`);

  const page = await fetch(`http://localhost:${port}/`);
  if (!page.ok) throw new Error(`Frontend returned ${page.status}.`);
  const html = await page.text();
  if (!html.includes('<title>The Oracle of Tantra</title>'))
    throw new Error('Frontend smoke check failed.');

  console.log('Oracle smoke tests passed.');
  stop();
}

main().catch((error) => {
  console.error(error.message || error);
  stop();
  process.exitCode = 1;
});
