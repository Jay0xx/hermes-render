const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 10000;

// Health check server — UptimeRobot pings this to prevent Render sleep
const server = http.createServer((req, res) => {
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
  env: { ...process.env },
});

gateway.on('error', (err) => {
  console.error('[hermes] failed to start:', err.message);
  process.exit(1);
});

gateway.on('exit', (code) => {
  console.error(`[hermes] gateway exited (${code})`);
  process.exit(code || 1);
});

// Forward signals
process.on('SIGTERM', () => gateway.kill('SIGTERM'));
process.on('SIGINT', () => gateway.kill('SIGINT'));
