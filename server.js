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

// Load KEY=VALUE pairs from .env (if present) without overriding real env vars
const ENV_FILE = path.join(ROOT, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'requests.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archive.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const WINDOWS_FILE = path.join(DATA_DIR, 'windows.json');

// ===== RAZORPAY CONFIG (POC) =====
// Put RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (use rzp_test_ keys while testing).
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_ENABLED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
// Optional: Dashboard → Webhooks, events refund.processed + refund.failed → <public URL>/api/razorpay/webhook
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
// Flat fee per re-evaluation request, in rupees (override with PAYMENT_AMOUNT_INR in .env)
const PAYMENT_AMOUNT_INR = Number(process.env.PAYMENT_AMOUNT_INR) || 10;

// ===== UPI CONFIG =====
// The college UPI ID students pay by QR. Plain UPI has no test mode and cannot tell this app
// that money arrived: the office matches UTRs against the bank statement and refunds by hand.
const UPI_VPA = process.env.UPI_VPA || '';
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'IIM Calcutta';

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

function readPayments() {
  try { return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8')); }
  catch { return { payments: [] }; }
}

function recordVerifiedPayment(entry) {
  const store = readPayments();
  if (store.payments.some(p => p.paymentId === entry.paymentId)) return;
  store.payments.push(entry);
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ===== FEE REFUND POLICY =====
// Digital version of the demand-draft process: the fee is collected at submission,
// refunded if the marks change (up or down), and retained if they don't.
const REFUND_STATUSES = ['Resolved - Marks Increased', 'Resolved - Marks Decreased'];
// Server-owned fields: the browser's bulk save can never overwrite these
const REVIEW_FIELDS = ['status', 'updatedMarks', 'professorRemarks', 'reviewedAt', 'history', 'refund', 'paymentVerified'];

function isRefundActive(refund) {
  return Boolean(refund && (refund.status === 'pending' || refund.status === 'processed'));
}

// Maps Razorpay's refund status onto ours: pending | processed | failed
function refundFromRazorpay(entity, previous = {}) {
  return {
    ...previous,
    id: entity.id,
    amount: entity.amount,
    status: entity.status === 'processed' ? 'processed' : entity.status === 'failed' ? 'failed' : 'pending',
    processedAt: entity.status === 'processed' ? (previous.processedAt || Date.now()) : previous.processedAt || null,
    error: null,
  };
}

const refundsInFlight = new Set();  // request IDs with a refund call in progress

// Issues the Razorpay refund for a request (idempotent). Mutates and returns request.refund.
async function issueRefund(request, actor) {
  if (isRefundActive(request.refund)) return request.refund;
  if (request.paymentMethod !== 'razorpay' || !request.razorpayPaymentId) {
    request.refund = {
      status: 'manual',
      note: request.paymentMethod === 'upi'
        ? `Paid by UPI (UTR ${request.upiUtr || '—'}) — the MBA office sends the refund back to ${request.upiPayerVpa || 'the student'}.`
        : 'Paid by receipt — the MBA office refunds this manually.',
    };
    return request.refund;
  }
  // Only refund payments this server verified, for the amount actually paid
  const payment = readPayments().payments.find(p => p.paymentId === request.razorpayPaymentId);
  if (!payment) {
    request.refund = { status: 'failed', error: 'Payment was not verified by this server.', attemptedAt: Date.now() };
    return request.refund;
  }
  if (!RAZORPAY_ENABLED) {
    request.refund = { status: 'failed', error: 'Razorpay is not configured on the server.', attemptedAt: Date.now() };
    return request.refund;
  }
  if (refundsInFlight.has(request.id)) throw new Error('A refund for this request is already in progress.');

  refundsInFlight.add(request.id);
  try {
    // Guard against double refunds if an earlier attempt succeeded but wasn't saved
    const existing = await razorpayApi('GET', `/v1/payments/${encodeURIComponent(payment.paymentId)}/refunds`);
    const prior = (existing.items || []).find(r => r.status !== 'failed');
    const entity = prior || await razorpayApi('POST', `/v1/payments/${encodeURIComponent(payment.paymentId)}/refund`, {
      amount: payment.amount,
      speed: 'normal',
      receipt: request.id.slice(0, 40),
      notes: { requestId: request.id, reason: request.status, initiatedBy: String(actor || '').slice(0, 256) },
    });
    request.refund = refundFromRazorpay(entity, { initiatedAt: Date.now(), initiatedBy: actor });
  } catch (e) {
    request.refund = { status: 'failed', error: e.message, attemptedAt: Date.now(), initiatedBy: actor };
  } finally {
    refundsInFlight.delete(request.id);
  }

  request.history = Array.isArray(request.history) ? request.history : [];
  request.history.push(request.refund.status === 'failed'
    ? { at: Date.now(), event: 'Refund failed', by: 'Razorpay', note: request.refund.error }
    : { at: Date.now(), event: request.refund.status === 'processed' ? 'Refund processed' : 'Refund initiated', by: 'Razorpay',
        note: `₹${request.refund.amount / 100} · ${request.refund.id}` });
  return request.refund;
}

// ===== RE-EVALUATION WINDOWS =====
// Admins open a window for a subject + exam + term + sections. Students can only apply while it's open.
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

function readWindows() {
  try { return JSON.parse(fs.readFileSync(WINDOWS_FILE, 'utf8')); }
  catch { return { windows: [] }; }
}

function writeWindows(obj) {
  fs.writeFileSync(WINDOWS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// scheduled → open → closed (closed early when an admin ends it)
function windowState(w, now = Date.now()) {
  if (w.closedAt && w.closedAt <= now) return 'closed';
  if (now < w.startsAt) return 'scheduled';
  if (now >= w.endsAt) return 'closed';
  return 'open';
}

function withState(w) {
  return { ...w, state: windowState(w) };
}

function cleanText(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Validate and normalise admin input for a new or edited window.
// Sections are optional: a window with none covers every student of the subject,
// and then names the professor who reviews the requests.
function windowFromInput(body) {
  const w = {
    subject: cleanText(body.subject, 120),
    courseCode: cleanText(body.courseCode, 40),
    examType: cleanText(body.examType, 40),
    sections: [...new Set((Array.isArray(body.sections) ? body.sections : []).map(String))].filter(s => SECTIONS.includes(s)).sort(),
    professor: cleanText(body.professor, 120),
    term: cleanText(body.term, 60),
    startsAt: Number(body.startsAt),
    endsAt: Number(body.endsAt),
  };
  if (w.sections.length) w.professor = '';   // per-section professors come from the course mapping

  const problems = [];
  if (!w.subject) problems.push('subject');
  if (!w.examType) problems.push('exam type');
  if (!w.term) problems.push('term');
  if (!w.sections.length && !w.professor) problems.push('the reviewing professor (needed when no section is selected)');
  if (!Number.isFinite(w.startsAt) || !Number.isFinite(w.endsAt)) problems.push('opening and closing times');
  if (problems.length) return { error: 'Missing ' + problems.join(', ') + '.' };
  if (w.endsAt <= w.startsAt) return { error: 'The window must close after it opens.' };
  if (w.endsAt <= Date.now()) return { error: 'The closing time is already in the past.' };
  return { window: w };
}

// Two live windows may not cover the same exam and section. No sections = the whole subject.
function findClash(candidate, windows, ignoreId) {
  return windows.find(o =>
    o.id !== ignoreId &&
    windowState(o) !== 'closed' &&
    o.subject.toLowerCase() === candidate.subject.toLowerCase() &&
    o.examType.toLowerCase() === candidate.examType.toLowerCase() &&
    o.term.toLowerCase() === candidate.term.toLowerCase() &&
    (!o.sections.length || !candidate.sections.length || o.sections.some(s => candidate.sections.includes(s))) &&
    o.startsAt < candidate.endsAt && candidate.startsAt < (o.closedAt || o.endsAt));
}

function clashMessage(clash, w) {
  const overlap = clash.sections.length && w.sections.length
    ? 'Section ' + clash.sections.filter(s => w.sections.includes(s)).join(', ')
    : 'This subject';
  return `${overlap} already has a window for ${clash.subject} · ${clash.examType} · ${clash.term}.`;
}

async function handleWindows(req, res) {
  if (req.url === '/api/windows' && req.method === 'GET') {
    sendJson(res, 200, { windows: readWindows().windows.map(withState), now: Date.now() });
    return true;
  }

  if (req.url === '/api/windows' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const parsed = windowFromInput(body);
      if (parsed.error) { sendJson(res, 400, { error: parsed.error }); return true; }
      const w = {
        id: 'WIN-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase(),
        ...parsed.window,
        closedAt: null,
        createdBy: cleanText(body.createdBy, 200),
        createdAt: Date.now(),
      };
      const store = readWindows();
      const clash = findClash(w, store.windows);
      if (clash) { sendJson(res, 409, { error: clashMessage(clash, w) }); return true; }

      store.windows.push(w);
      writeWindows(store);
      sendJson(res, 200, { window: withState(w) });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return true;
  }

  // PUT /api/windows/:id — edit an open or scheduled window
  const edit = req.url.match(/^\/api\/windows\/([^/]+)$/);
  if (edit && req.method === 'PUT') {
    try {
      const body = await readJsonBody(req);
      const store = readWindows();
      const w = store.windows.find(o => o.id === decodeURIComponent(edit[1]));
      if (!w) { sendJson(res, 404, { error: 'Window not found.' }); return true; }
      if (windowState(w) === 'closed') { sendJson(res, 409, { error: 'A closed window can no longer be edited.' }); return true; }

      const parsed = windowFromInput(body);
      if (parsed.error) { sendJson(res, 400, { error: parsed.error }); return true; }
      const next = parsed.window;

      // Once students have applied, the exam they applied for must stay the same
      const data = readData();
      const applied = (data.requests || []).filter(r => r.windowId === w.id);
      if (applied.length) {
        const locked = [];
        if (next.subject !== w.subject) locked.push('subject');
        if (next.examType !== w.examType) locked.push('exam type');
        if (next.term !== w.term) locked.push('term');
        if (next.startsAt !== w.startsAt) locked.push('opening time');
        if (!w.sections.length && (next.sections.length || next.professor !== w.professor)) locked.push('professor');
        if (w.sections.length && !next.sections.length) locked.push('sections');
        const usedSections = [...new Set(applied.map(r => r.section).filter(Boolean))];
        const dropped = w.sections.length ? usedSections.filter(s => !next.sections.includes(s)) : [];
        if (dropped.length) locked.push('section ' + dropped.join(', ') + ' (students have applied)');
        if (locked.length) {
          sendJson(res, 409, { error: `${applied.length} student${applied.length === 1 ? ' has' : 's have'} already applied, so these can't change: ${locked.join(', ')}.` });
          return true;
        }
      }

      const clash = findClash(next, store.windows, w.id);
      if (clash) { sendJson(res, 409, { error: clashMessage(clash, next) }); return true; }

      Object.assign(w, next, { updatedAt: Date.now(), updatedBy: cleanText(body.updatedBy, 200) });
      writeWindows(store);

      // Keep the course code on existing requests in step with the window
      if (applied.length) {
        for (const r of data.requests) if (r.windowId === w.id) r.courseCode = w.courseCode;
        saveAndArchive(data);
      }
      sendJson(res, 200, { window: withState(w) });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return true;
  }

  const m = req.url.match(/^\/api\/windows\/([^/]+)\/close$/);
  if (m && req.method === 'POST') {
    const store = readWindows();
    const w = store.windows.find(o => o.id === decodeURIComponent(m[1]));
    if (!w) { sendJson(res, 404, { error: 'Window not found.' }); return true; }
    if (windowState(w) === 'closed') { sendJson(res, 409, { error: 'This window is already closed.' }); return true; }
    w.closedAt = Date.now();
    writeWindows(store);
    sendJson(res, 200, { window: withState(w) });
    return true;
  }

  return false;
}

// POST /api/requests/submit — the only way a new request is created
async function handleSubmitRequest(req, res) {
  try {
    const body = await readJsonBody(req);
    const incoming = body.request || {};
    const w = readWindows().windows.find(o => o.id === incoming.windowId);
    if (!w) { sendJson(res, 400, { error: 'This re-evaluation window no longer exists.' }); return; }
    const state = windowState(w);
    if (state !== 'open') {
      sendJson(res, 409, { error: state === 'scheduled' ? 'This re-evaluation window has not opened yet.' : 'This re-evaluation window has closed.' });
      return;
    }
    if (w.sections.length && !w.sections.includes(incoming.section)) {
      sendJson(res, 400, { error: `Section ${incoming.section || '—'} is not part of this re-evaluation window.` });
      return;
    }
    const email = cleanText(incoming.studentEmail, 200).toLowerCase();
    if (!email) { sendJson(res, 400, { error: 'Missing student email.' }); return; }

    const data = readData();
    data.requests = data.requests || [];
    if (data.requests.some(r => r.windowId === w.id && (r.studentEmail || '').toLowerCase() === email)) {
      sendJson(res, 409, { error: 'You have already applied for re-evaluation in this window.' });
      return;
    }
    if (incoming.upiUtr && data.requests.some(r => r.upiUtr === incoming.upiUtr)) {
      sendJson(res, 409, { error: 'That UPI reference number is already used by another request.' });
      return;
    }

    // Exam details come from the window, never from the browser; review fields start empty
    const { refund, paymentVerified, reviewedAt, updatedMarks, professorRemarks, history, status, ...fresh } = incoming;
    const now = Date.now();
    const request = {
      ...fresh,
      id: cleanText(fresh.id, 60) || 'IIMC-' + now.toString(36).toUpperCase(),
      studentEmail: email,
      windowId: w.id,
      subject: w.subject,
      courseCode: w.courseCode,
      examType: w.examType,
      term: w.term,
      ...(w.sections.length ? {} : { professorName: w.professor }),
      status: 'Pending',
      createdAt: now,
      updatedMarks: null,
      professorRemarks: null,
      history: [{ at: now, event: 'Submitted', by: email, note: '' }],
    };
    if (request.paymentMethod === 'upi') request.paymentVerified = false;
    if (data.requests.some(r => r.id === request.id)) request.id += '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    data.requests.push(request);
    saveAndArchive(data);
    sendJson(res, 200, { request });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
}

function findRequest(data, id) {
  return (data.requests || []).find(r => r.id === id);
}

function saveAndArchive(data) {
  writeData(data);
  archiveRequests(data.requests);
}

// Routes: POST /api/requests/:id/review | /refund | /refund/refresh
async function handleRequestActions(req, res) {
  const m = req.url.match(/^\/api\/requests\/([^/]+)\/(review|refund|refund\/refresh)$/);
  if (!m || req.method !== 'POST') return false;
  const id = decodeURIComponent(m[1]);
  const action = m[2];

  try {
    const body = await readJsonBody(req);
    const data = readData();
    const request = findRequest(data, id);
    if (!request) { sendJson(res, 404, { error: 'Request not found.' }); return true; }

    if (action === 'review') {
      const status = String(body.status || '');
      const allowed = ['Under Review', 'Resolved - No Change', ...REFUND_STATUSES];
      if (!allowed.includes(status)) { sendJson(res, 400, { error: 'Invalid status.' }); return true; }
      if (!String(body.professorRemarks || '').trim()) { sendJson(res, 400, { error: 'Remarks are required.' }); return true; }
      // A refund can't be taken back, so the decision must stay "marks changed"
      if (isRefundActive(request.refund) && !REFUND_STATUSES.includes(status)) {
        sendJson(res, 409, { error: 'The fee has already been refunded, so the result must stay "Marks Increased" or "Marks Decreased".' });
        return true;
      }

      const oldStatus = request.status;
      request.updatedMarks = String(body.updatedMarks || '').trim() || null;
      request.professorRemarks = String(body.professorRemarks).trim();
      request.status = status;
      request.reviewedAt = Date.now();
      request.history = Array.isArray(request.history) ? request.history : [];
      request.history.push({
        at: Date.now(),
        event: oldStatus === status ? 'Remarks updated' : 'Status changed',
        by: body.by || '—',
        from: oldStatus,
        to: status,
        note: request.professorRemarks,
      });
      // Save the decision first so it isn't lost if the refund call is slow or fails
      saveAndArchive(data);
      if (REFUND_STATUSES.includes(status)) await issueRefund(request, body.by);
    }

    if (action === 'refund') {
      if (!REFUND_STATUSES.includes(request.status)) { sendJson(res, 409, { error: 'Marks did not change, so no refund is due.' }); return true; }
      await issueRefund(request, body.by);
    }

    if (action === 'refund/refresh') {
      if (request.refund && request.refund.id && request.refund.status === 'pending' && RAZORPAY_ENABLED) {
        const entity = await razorpayApi('GET', `/v1/refunds/${encodeURIComponent(request.refund.id)}`);
        const before = request.refund.status;
        request.refund = refundFromRazorpay(entity, request.refund);
        if (before !== request.refund.status) {
          request.history.push({ at: Date.now(), event: request.refund.status === 'processed' ? 'Refund processed' : 'Refund failed', by: 'Razorpay', note: request.refund.id });
        }
      }
    }

    // Re-read so concurrent saves made during the Razorpay call aren't clobbered
    const latest = readData();
    const idx = latest.requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      for (const f of REVIEW_FIELDS) latest.requests[idx][f] = request[f];
      saveAndArchive(latest);
    }
    sendJson(res, 200, { request: idx !== -1 ? latest.requests[idx] : request });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
  return true;
}

// POST /api/razorpay/webhook — refund.processed / refund.failed (needs RAZORPAY_WEBHOOK_SECRET and a public URL)
async function handleWebhook(req, res) {
  if (!RAZORPAY_WEBHOOK_SECRET) { sendJson(res, 503, { error: 'Webhook secret is not configured.' }); return; }
  const raw = await readRawBody(req);
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  const given = Buffer.from(String(req.headers['x-razorpay-signature'] || ''));
  if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), given)) {
    sendJson(res, 400, { error: 'Invalid webhook signature.' });
    return;
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { sendJson(res, 400, { error: 'Bad JSON' }); return; }
  const entity = event.payload && event.payload.refund && event.payload.refund.entity;
  if (entity && /^refund\./.test(event.event)) {
    const data = readData();
    const request = data.requests.find(r => r.refund && r.refund.id === entity.id);
    if (request) {
      const before = request.refund.status;
      request.refund = refundFromRazorpay(entity, request.refund);
      if (before !== request.refund.status && request.refund.status !== 'pending') {
        request.history.push({ at: Date.now(), event: request.refund.status === 'processed' ? 'Refund processed' : 'Refund failed', by: 'Razorpay webhook', note: entity.id });
      }
      saveAndArchive(data);
    }
  }
  sendJson(res, 200, { ok: true });
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
      upi: UPI_VPA ? { vpa: UPI_VPA, payeeName: UPI_PAYEE_NAME } : null,
    });
    return true;
  }

  if (req.url.startsWith('/api/payment/upi/check') && req.method === 'GET') {
    const utr = new URL(req.url, 'http://localhost').searchParams.get('utr') || '';
    const used = (readData().requests || []).some(r => r.upiUtr && r.upiUtr === utr);
    sendJson(res, 200, { used });
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

      let payment = await razorpayApi('GET', '/v1/payments/' + encodeURIComponent(razorpay_payment_id));
      if (payment.order_id !== razorpay_order_id || payment.amount !== order.amount) {
        sendJson(res, 400, { verified: false, error: 'Payment does not match the order.' });
        return true;
      }
      if (payment.status === 'authorized') {
        payment = await razorpayApi('POST', '/v1/payments/' + encodeURIComponent(razorpay_payment_id) + '/capture',
          { amount: payment.amount, currency: payment.currency });
      }
      if (payment.status !== 'captured') {
        sendJson(res, 400, { verified: false, error: 'Payment is ' + payment.status + ', not captured.' });
        return true;
      }

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
        if (!Array.isArray(payload.requests)) throw new Error('requests must be an array');
        // Merge by ID so a browser with a stale copy can't drop other people's requests,
        // and keep server-owned review/refund fields for requests the server already has.
        const current = readData();
        const byId = new Map((current.requests || []).map(r => [r.id, r]));
        for (const incoming of payload.requests) {
          const existing = byId.get(incoming.id);
          if (!existing) {
            // New requests must go through /api/requests/submit (window checks); ignore them here
            continue;
          } else {
            const merged = { ...existing, ...incoming };
            // Review fields change only through /api/requests/:id/review (except when the server has none yet)
            const serverReviewed = existing.reviewedAt || existing.refund;
            for (const f of REVIEW_FIELDS) {
              if (serverReviewed || f === 'refund') merged[f] = existing[f];
            }
            byId.set(incoming.id, merged);
          }
        }
        const merged = { requests: [...byId.values()] };
        writeData(merged);
        archiveRequests(merged.requests);
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

  // ── Re-evaluation windows ──
  if (req.url.startsWith('/api/windows')) {
    handleWindows(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    });
    return;
  }

  // ── New request (window-checked) ──
  if (req.url === '/api/requests/submit' && req.method === 'POST') {
    handleSubmitRequest(req, res);
    return;
  }

  // ── Review decisions and fee refunds ──
  if (req.url.startsWith('/api/requests/')) {
    handleRequestActions(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    });
    return;
  }

  // ── Razorpay webhook ──
  if (req.url === '/api/razorpay/webhook' && req.method === 'POST') {
    handleWebhook(req, res).catch(e => sendJson(res, 500, { error: e.message }));
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
  console.log(`  📱  UPI QR:          ${UPI_VPA ? UPI_VPA + ' — REAL money, no test mode' : 'off (set UPI_VPA in .env)'}`);
  console.log(`  🔔  Webhook:         ${RAZORPAY_WEBHOOK_SECRET ? 'enabled at /api/razorpay/webhook' : 'off (refund status is refreshed on demand)'}`);
  console.log('  ⏹   Press Ctrl+C to stop the server');
  console.log('');
});
