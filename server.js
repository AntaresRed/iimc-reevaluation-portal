/**
 * IIM Calcutta Re-Evaluation Portal — Local Server
 * Zero dependencies: uses only built-in Node.js modules.
 * All request data is saved to data/requests.json on disk.
 * An append-only archive is maintained at data/archive.json.
 *
 * Usage:  node server.js
 * Then open:  http://localhost:3000
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'requests.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archive.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

// Load KEY=VALUE pairs from .env (if present) without overriding real env vars
const ENV_FILE = path.join(ROOT, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.PORT || 3000;

// ===== RAZORPAY CONFIG (POC) =====
// Put RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (use rzp_test_ keys while testing).
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_ENABLED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
// Flat fee per re-evaluation request, in rupees (override with PAYMENT_AMOUNT_INR in .env)
const PAYMENT_AMOUNT_INR = Number(process.env.PAYMENT_AMOUNT_INR) || 10;

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ requests: [] }, null, 2));
if (!fs.existsSync(ARCHIVE_FILE)) fs.writeFileSync(ARCHIVE_FILE, JSON.stringify({ entries: [] }, null, 2));

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

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { requests: [] }; }
}

function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function readArchive() {
  try { return JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')); }
  catch { return { entries: [] }; }
}

/**
 * Append-only archive update.
 * For each request in the incoming payload:
 *  - If no archive entry exists for this ID yet → add it.
 *  - If it exists but the status or history has changed → add a new snapshot entry.
 * Existing archive entries are NEVER modified or deleted.
 */
function archiveRequests(newRequests) {
  const archive = readArchive();
  const existing = new Map(archive.entries.map(e => [e.id + '_' + e.archivedAt, true]));

  let changed = false;
  for (const req of newRequests) {
    // Check if we already have this exact version archived
    const lastEntry = archive.entries.filter(e => e.id === req.id).pop();
    const isNew = !lastEntry;
    const hasChanged = lastEntry && (lastEntry.status !== req.status ||
      JSON.stringify(lastEntry.history) !== JSON.stringify(req.history));

    if (isNew || hasChanged) {
      archive.entries.push({ ...req, archivedAt: Date.now() });
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2), 'utf8');
  }
}

// ===== RAZORPAY HELPERS =====
function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Minimal Razorpay REST client: https://razorpay.com/docs/api/orders/
function razorpayApi(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const apiReq = https.request({
      hostname: 'api.razorpay.com',
      path: apiPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Basic ${auth}`,
      },
    }, apiRes => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = {}; }
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) resolve(parsed);
        else reject(new Error((parsed.error && parsed.error.description) || `Razorpay returned ${apiRes.statusCode}`));
      });
    });
    apiReq.on('error', reject);
    apiReq.end(payload);
  });
}

// Signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
function isValidPaymentSignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function recordVerifiedPayment(entry) {
  let store = { payments: [] };
  try { store = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8')); } catch { }
  store.payments.push(entry);
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

// Pending orders created by this server process: order_id → { amount, currency }
const pendingOrders = new Map();

async function handlePaymentApi(req, res) {
  if (req.url === '/api/payment/config' && req.method === 'GET') {
    sendJson(res, 200, {
      enabled: RAZORPAY_ENABLED,
      keyId: RAZORPAY_ENABLED ? RAZORPAY_KEY_ID : null,
      amount: PAYMENT_AMOUNT_INR,
      currency: 'INR',
    });
    return true;
  }

  if (req.url === '/api/payment/order' && req.method === 'POST') {
    if (!RAZORPAY_ENABLED) { sendJson(res, 503, { error: 'Razorpay is not configured on the server.' }); return true; }
    try {
      const body = await readJsonBody(req);
      // Amount is always set server-side, in paise
      const amount = Math.round(PAYMENT_AMOUNT_INR * 100);
      const order = await razorpayApi('POST', '/v1/orders', {
        amount,
        currency: 'INR',
        receipt: `reval_${Date.now()}`,
        notes: {
          studentEmail: String(body.studentEmail || '').slice(0, 256),
          subject: String(body.subject || '').slice(0, 256),
          questions: String(body.questions || '').slice(0, 256),
        },
      });
      pendingOrders.set(order.id, { amount: order.amount, currency: order.currency });
      sendJson(res, 200, { orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (e) {
      sendJson(res, 502, { error: e.message });
    }
    return true;
  }

  if (req.url === '/api/payment/verify' && req.method === 'POST') {
    if (!RAZORPAY_ENABLED) { sendJson(res, 503, { error: 'Razorpay is not configured on the server.' }); return true; }
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await readJsonBody(req);
      if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        sendJson(res, 400, { verified: false, error: 'Invalid payment signature.' });
        return true;
      }
      // Fall back to Razorpay if this process didn't create the order (e.g. server restarted mid-payment)
      let order = pendingOrders.get(razorpay_order_id);
      if (!order) {
        const o = await razorpayApi('GET', '/v1/orders/' + encodeURIComponent(razorpay_order_id));
        order = { amount: o.amount, currency: o.currency };
      }
      pendingOrders.delete(razorpay_order_id);
      const entry = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: order.amount,
        currency: order.currency,
        verifiedAt: Date.now(),
      };
      recordVerifiedPayment(entry);
      sendJson(res, 200, { verified: true, ...entry });
    } catch (e) {
      sendJson(res, 400, { verified: false, error: e.message });
    }
    return true;
  }

  return false;
}

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }  // strip query string
  catch { res.writeHead(400); res.end('Bad Request'); return; }
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  // Never serve dotfiles such as .env (holds the Razorpay secret)
  if (path.relative(ROOT, filePath).split(path.sep).some(seg => seg.startsWith('.'))) {
    res.writeHead(404); res.end('Not Found'); return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); res.end('Not Found'); }
      else { res.writeHead(500); res.end('Server Error'); }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS headers (handy for development)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /api/requests ── return all live requests
  if (req.url === '/api/requests' && req.method === 'GET') {
    const data = readData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // ── POST /api/requests ── save live requests + update archive
  if (req.url === '/api/requests' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        writeData(payload);
        // Append any new/changed requests to the immutable archive
        if (Array.isArray(payload.requests)) {
          archiveRequests(payload.requests);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── GET /api/archive ── return immutable full archive (all snapshots ever)
  if (req.url === '/api/archive' && req.method === 'GET') {
    const archive = readArchive();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(archive));
    return;
  }

  // ── Razorpay payment endpoints ──
  if (req.url.startsWith('/api/payment/')) {
    handlePaymentApi(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    });
    return;
  }

  // ── Static file serving ──
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
  console.log('  🎓  IIM Calcutta Re-Evaluation Portal');
  console.log('  ─────────────────────────────────────');
  console.log(`  🌐  Open in browser: http://localhost:${PORT}`);
  console.log(`  💾  Live data:       ${DATA_FILE}`);
  console.log(`  🗄️   Archive:         ${ARCHIVE_FILE}`);
  console.log(`  💳  Razorpay:        ${RAZORPAY_ENABLED ? 'enabled (' + RAZORPAY_KEY_ID + ')' : 'disabled — set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env'}`);
  console.log('  ⏹   Press Ctrl+C to stop the server');
  console.log('');
});
