/**
 * IIM Calcutta Re-Evaluation Portal — local runner
 * Zero dependencies: uses only built-in Node.js modules.
 *
 * Serves the page and runs the same serverless functions in api/ that Vercel runs, so the
 * portal behaves locally exactly as it does live. All data lives in the Supabase database —
 * the same one the live site uses — so anything done here is real. Photos go to the portal's
 * Google Drive through api/photo-upload.js, with the settings in .env.
 *
 * Usage:  node server.js
 * Then open:  http://localhost:3000   (or the PORT set in .env)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Load KEY=VALUE pairs from .env (if present) without overriding real env vars
const ENV_FILE = path.join(ROOT, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.PORT || 3000;
const drive = require('./drive.js');   // reads its settings from .env, loaded above

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// Only what the live site publishes: the pages and the css/js/assets folders.
// Never .env, the database scripts, or the functions' source.
function isPublic(urlPath) {
  return /^\/[a-z-]+\.html$/.test(urlPath) || /^\/(css|js|assets)\/[A-Za-z0-9._\/-]+$/.test(urlPath);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.join(ROOT, urlPath);
  if (!isPublic(urlPath) || !file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

// The few helpers Vercel adds to the response, so api/*.js runs unchanged
function vercelResponse(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = body => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    return res;
  };
  res.send = body => { res.end(body); return res; };
  return res;
}

// /api/photo-upload → api/photo-upload.js, as on Vercel. Files starting with _ are not routes.
async function runFunction(req, res) {
  const name = new URL(req.url, 'http://localhost').pathname.slice('/api/'.length);
  const file = path.join(ROOT, 'api', name + '.js');
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No such function.' }));
    return;
  }
  try {
    await require(file)(req, vercelResponse(res));
  } catch (e) {
    console.error(`/api/${name} failed:`, e);
    if (!res.headersSent) vercelResponse(res).status(500).json({ error: e.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    runFunction(req, res);
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }
  serveStatic(req, res);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error(`  ❌  Port ${PORT} is already in use by another program.`);
    console.error('      Close that program, or set PORT=3001 in .env and start again.');
    console.error('');
  } else {
    console.error('  ❌  Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🎓  IIM Calcutta Re-Evaluation Portal (local)');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  🌐  Open in browser: http://localhost:${PORT}`);
  console.log('  🗄️   Data:            the live Supabase database — changes here are real');
  console.log(`  📷  Photos:          ${drive.driveStatus()}`);
  console.log('  ⏹   Press Ctrl+C to stop the server');
  console.log('');
});
