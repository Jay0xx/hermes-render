const http = require('http');
const { spawn, execSync } = require('child_process');

const PORT = process.env.PORT || 10000;

// Health check server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Manual pairing approval via URL: /approve?code=XXXX
  if (url.pathname === '/approve' && url.searchParams.get('code')) {
    const code = url.searchParams.get('code');
    try {
      execSync(`hermes pairing approve telegram ${code}`, { stdio: 'pipe', timeout: 15000 });
      res.writeHead(200);
      res.end(`approved ${code}`);
      console.log(`[pairing] approved ${code} via web`);
    } catch (e) {
      res.writeHead(500);
      res.end(`failed: ${e.stderr || e.message}`);
      console.error(`[pairing] web-approve failed: ${e.stderr || e.message}`);
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[health] listening on :${PORT}`);
});

// Start Hermes gateway
console.log('[hermes] starting gateway...');
const gateway = spawn('hermes', ['gateway', 'run'], {
  stdio: 'inherit',
  env: { ...process.env, PATH: `${process.env.PATH}:/opt/render/.local/bin:/usr/local/bin` },
});

gateway.on('error', (err) => {
  console.error('[hermes] failed to start:', err.message);
  process.exit(1);
});

gateway.on('exit', (code) => {
  console.error(`[hermes] gateway exited (${code})`);
  process.exit(code || 1);
});

// Auto-approve codes from env var (retry up to 5 times, 10s apart)
const codes = (process.env.HERMES_PAIR_CODES || '').split(',').map(c => c.trim()).filter(Boolean);
codes.forEach(code => {
  let attempts = 0;
  const tryApprove = () => {
    attempts++;
    try {
      console.log(`[pairing] attempt ${attempts}: approving ${code}...`);
      execSync(`hermes pairing approve telegram ${code}`, {
        stdio: 'pipe',
        timeout: 15000,
        env: { ...process.env, PATH: `${process.env.PATH}:/opt/render/.local/bin:/usr/local/bin` },
      });
      console.log(`[pairing] ${code} approved!`);
    } catch (e) {
      const msg = (e.stderr || e.message || '').toString();
      console.error(`[pairing] attempt ${attempts} failed: ${msg.trim()}`);
      if (attempts < 5) setTimeout(tryApprove, 10000);
      else console.error(`[pairing] ${code} FAILED after 5 attempts`);
    }
  };
  setTimeout(tryApprove, 10000); // wait 10s for gateway to boot
});

process.on('SIGTERM', () => gateway.kill('SIGTERM'));
process.on('SIGINT', () => gateway.kill('SIGINT'));
