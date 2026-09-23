/**
 * IIM Calcutta Re-Evaluation Portal — Local Server
 * Zero dependencies: uses only built-in Node.js modules.
 * Requests are saved to data/requests.json; question photos to data/uploads/.
 * An append-only archive is maintained at data/archive.json.
 *
 * Usage:  node server.js
 * Then open:  http://localhost:3000
 */

const http = require('http');
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
const WINDOWS_FILE = path.join(DATA_DIR, 'windows.json');
const FACULTY_FILE = path.join(DATA_DIR, 'faculty.json');
const BLOCKS_FILE = path.join(DATA_DIR, 'blocks.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const drive = require('./drive.js');   // reads its settings from .env, loaded above

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

// ===== JSON FILE STORAGE =====
// Writes go to a temp file that is then renamed over the real one, so a crash mid-write can't
// leave half a file behind. A file that exists but can't be parsed is set aside (never silently
// replaced by an empty one, which would wipe every request on the next save).
function readJsonFile(file, fallback) {
  if (!fs.existsSync(file)) return fallback();
  const text = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    const saved = `${file}.corrupt-${Date.now()}`;
    fs.copyFileSync(file, saved);
    console.error(`  ⚠️  ${path.basename(file)} could not be read (${e.message}). A copy was kept at ${saved}.`);
    throw new Error(`${path.basename(file)} is damaged; a copy was kept at ${path.basename(saved)}. Fix or remove it before saving.`);
  }
}

function writeJsonFile(file, obj) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function readData() {
  return readJsonFile(DATA_FILE, () => ({ requests: [] }));
}

function writeData(obj) {
  writeJsonFile(DATA_FILE, obj);
}

function readArchive() {
  return readJsonFile(ARCHIVE_FILE, () => ({ entries: [] }));
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
  // Latest snapshot per request, found in one pass
  const latest = new Map();
  for (const e of archive.entries) latest.set(e.id, e);

  let changed = false;
  for (const req of newRequests) {
    // Check if we already have this exact version archived
    const lastEntry = latest.get(req.id);
    const isNew = !lastEntry;
    const hasChanged = lastEntry && (lastEntry.status !== req.status ||
      JSON.stringify(lastEntry.history) !== JSON.stringify(req.history));

    if (isNew || hasChanged) {
      const snapshot = { ...req, archivedAt: Date.now() };
      archive.entries.push(snapshot);
      latest.set(req.id, snapshot);
      changed = true;
    }
  }

  if (changed) writeJsonFile(ARCHIVE_FILE, archive);
}

// ===== HTTP HELPERS =====
function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// Request bodies are capped so one oversized upload can't exhaust the server's memory
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_SUBMIT_BYTES = 25 * 1024 * 1024;   // a request with photos

function readRawBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size <= maxBytes) chunks.push(chunk);   // keep draining, but stop storing
    });
    req.on('end', () => {
      if (size > maxBytes) reject(new Error('Request is too large. Try fewer or smaller photos.'));
      else resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

async function readJsonBody(req, maxBytes) {
  const raw = await readRawBody(req, maxBytes);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); }
  catch { throw new Error('The request body is not valid JSON.'); }
}

// ===== RE-EVALUATION WINDOWS =====
// Admins open a window for a subject + exam + term + sections. Students can only apply while it's open.
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

function readWindows() {
  return readJsonFile(WINDOWS_FILE, () => ({ windows: [] }));
}

function writeWindows(obj) {
  writeJsonFile(WINDOWS_FILE, obj);
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

// ===== FACULTY ADDED BY THE OFFICE =====
// The built-in professor list lives in the page; professors the office adds are stored here,
// so they can sign in with their IIMC email and review requests.
const IIMC_EMAIL = /^[a-z0-9._%+-]+@email\.iimcal\.ac\.in$/;

function readFaculty() {
  return readJsonFile(FACULTY_FILE, () => ({ faculty: [] }));
}

async function handleFaculty(req, res) {
  if (req.url === '/api/faculty' && req.method === 'GET') {
    sendJson(res, 200, readFaculty());
    return true;
  }
  if (req.url === '/api/faculty' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const name = cleanText(body.name, 120);
      const email = cleanText(body.email, 200).toLowerCase();
      if (!name) { sendJson(res, 400, { error: 'Please enter the professor\'s name.' }); return true; }
      if (!IIMC_EMAIL.test(email)) { sendJson(res, 400, { error: 'Please enter an @email.iimcal.ac.in address.' }); return true; }
      const store = readFaculty();
      if (store.faculty.some(f => f.email === email)) { sendJson(res, 409, { error: 'A professor with this email has already been added.' }); return true; }
      if (store.faculty.some(f => f.name.toLowerCase() === name.toLowerCase())) { sendJson(res, 409, { error: 'A professor with this name has already been added.' }); return true; }
      const entry = { name, email, addedBy: cleanText(body.addedBy, 200), addedAt: Date.now() };
      store.faculty.push(entry);
      writeJsonFile(FACULTY_FILE, store);
      sendJson(res, 200, { faculty: entry });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return true;
  }
  return false;
}

// ===== DEACTIVATED STUDENTS =====
// The office can switch off re-evaluation for a student. A block matches on email AND registration
// number (either one is enough to refuse a request), picks up every other email / reg. no. the
// student has used on past requests, and is never deleted — lifting it only stamps who and when,
// so there's a full record. Submissions are checked here on the server, not just hidden in the page.
function readBlocks() {
  return readJsonFile(BLOCKS_FILE, () => ({ blocks: [] }));
}

function normEmail(value) {
  return cleanText(value, 200).toLowerCase();
}

// "MBA/0042/62", " mba / 42 / 62 " and "MBA/042/62" all become "MBA/42/62"
function normRegNo(value) {
  return String(value == null ? '' : value).toUpperCase().replace(/\s+/g, '').replace(/\/0+(\d)/g, '/$1').slice(0, 40);
}

function activeBlockFor(email, regNo) {
  const e = normEmail(email);
  const r = normRegNo(regNo);
  return readBlocks().blocks.find(b => !b.liftedAt &&
    ((e && b.emails.includes(e)) || (r && b.regNos.includes(r))));
}

async function handleBlocks(req, res) {
  // Everything, including lifted blocks (the admin's record)
  if (req.url === '/api/blocks' && req.method === 'GET') {
    sendJson(res, 200, readBlocks());
    return true;
  }

  // A student's own status — only whether they're blocked, not the office's reason
  if (req.url.startsWith('/api/blocks/status') && req.method === 'GET') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    sendJson(res, 200, { blocked: Boolean(activeBlockFor(q.get('email'), q.get('regNo'))) });
    return true;
  }

  if (req.url === '/api/blocks' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const email = normEmail(body.email);
    const regNo = normRegNo(body.regNo);
    const reason = cleanText(body.reason, 500);
    if (!email && !regNo) { sendJson(res, 400, { error: 'Enter the student\'s email or registration number.' }); return true; }
    if (email && !IIMC_EMAIL.test(email)) { sendJson(res, 400, { error: 'The email must be an @email.iimcal.ac.in address.' }); return true; }
    if (regNo && !/^[A-Z0-9][A-Z0-9/-]{2,39}$/.test(regNo)) { sendJson(res, 400, { error: 'That registration number doesn\'t look right (e.g. MBA/0042/62).' }); return true; }
    if (reason.length < 5) { sendJson(res, 400, { error: 'Please give a reason (at least 5 characters). It is kept in the record.' }); return true; }

    // Link every email / reg. no. this student has used, so switching one doesn't get around the block
    const emails = new Set(email ? [email] : []);
    const regNos = new Set(regNo ? [regNo] : []);
    for (const r of readData().requests || []) {
      const re = normEmail(r.studentEmail), rr = normRegNo(r.regNo);
      if ((re && emails.has(re)) || (rr && regNos.has(rr))) {
        if (re) emails.add(re);
        if (rr) regNos.add(rr);
      }
    }

    const store = readBlocks();
    const existing = store.blocks.find(b => !b.liftedAt &&
      ([...emails].some(e => b.emails.includes(e)) || [...regNos].some(r => b.regNos.includes(r))));
    if (existing) { sendJson(res, 409, { error: 'This student is already deactivated.', block: existing }); return true; }

    const block = {
      id: 'BLK-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase(),
      emails: [...emails],
      regNos: [...regNos],
      name: cleanText(body.name, 120),
      reason,
      blockedBy: cleanText(body.by, 200) || '—',
      blockedAt: Date.now(),
      liftedAt: null,
      liftedBy: null,
      liftNote: null,
    };
    store.blocks.push(block);
    writeJsonFile(BLOCKS_FILE, store);
    sendJson(res, 200, { block });
    return true;
  }

  const lift = req.url.match(/^\/api\/blocks\/([A-Za-z0-9-]+)\/lift$/);
  if (lift && req.method === 'POST') {
    const body = await readJsonBody(req);
    const store = readBlocks();
    const block = store.blocks.find(b => b.id === lift[1]);
    if (!block) { sendJson(res, 404, { error: 'Record not found.' }); return true; }
    if (block.liftedAt) { sendJson(res, 409, { error: 'Re-evaluation is already active again for this student.' }); return true; }
    block.liftedAt = Date.now();
    block.liftedBy = cleanText(body.by, 200) || '—';
    block.liftNote = cleanText(body.note, 500) || null;
    writeJsonFile(BLOCKS_FILE, store);
    sendJson(res, 200, { block });
    return true;
  }

  return false;
}

// ===== QUESTION PHOTOS =====
// Stored under data/uploads/<request id>/ and served only through /api/photos (never as static files).
const PHOTO_TYPES = {
  'image/jpeg': { ext: 'jpg', magic: b => b[0] === 0xFF && b[1] === 0xD8 },
  'image/png': { ext: 'png', magic: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  'image/webp': { ext: 'webp', magic: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_QUESTIONS = 10;
const MAX_PHOTOS_PER_QUESTION = 3;

// "data:image/jpeg;base64,..." → { buffer, ext }, checking the bytes really are that image type
function decodePhoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw new Error('Photos must be JPG, PNG or WebP images.');
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > MAX_PHOTO_BYTES) throw new Error('Each photo must be under 3 MB.');
  const type = PHOTO_TYPES[m[1]];
  if (buffer.length < 12 || !type.magic(buffer)) throw new Error('One of the photos is not a valid image.');
  return { buffer, ext: type.ext };
}

// The student's question number, trimmed to characters that are safe in a file name
function photoLabel(question, index) {
  const safe = String(question).replace(/[^A-Za-z0-9()._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  return safe || `Question ${index + 1}`;
}

// A photo is either a Drive file id or a file on this machine — the request record says which
function findPhoto(requestId, name) {
  const request = findRequest(readData(), requestId);
  if (!request) return null;
  for (const item of request.questionItems || []) {
    for (const photo of item.photos || []) {
      if (typeof photo === 'string' ? photo === name : photo && photo.name === name) return photo;
    }
  }
  return null;
}

async function servePhoto(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch { sendJson(res, 404, { error: 'Not Found' }); return; }
  const m = urlPath.match(/^\/api\/photos\/([A-Za-z0-9-]{1,80})\/([A-Za-z0-9()._ -]{1,60}\.(jpg|png|webp))$/);
  if (!m || m[2].includes('..')) { sendJson(res, 404, { error: 'Not Found' }); return; }

  const photo = findPhoto(m[1], m[2]);
  if (!photo) { sendJson(res, 404, { error: 'Not Found' }); return; }
  const type = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[m[3]];
  const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600' };

  if (photo.driveId) {
    try {
      const buffer = await drive.downloadPhoto(photo.driveId);
      res.writeHead(200, headers);
      res.end(buffer);
    } catch (e) {
      sendJson(res, 502, { error: 'Could not fetch that photo from Google Drive: ' + e.message });
    }
    return;
  }

  fs.readFile(path.join(UPLOADS_DIR, m[1], m[2]), (err, data) => {
    if (err) { sendJson(res, 404, { error: 'Not Found' }); return; }
    res.writeHead(200, headers);
    res.end(data);
  });
}

// POST /api/requests/submit — the only way a new request is created
async function handleSubmitRequest(req, res) {
  try {
    const body = await readJsonBody(req, MAX_SUBMIT_BYTES);
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
    const email = normEmail(incoming.studentEmail);
    if (!email) { sendJson(res, 400, { error: 'Missing student email.' }); return; }
    const regNo = cleanText(incoming.regNo, 40);

    // Deactivated students can't apply, whichever email or reg. no. they use
    if (activeBlockFor(email, regNo)) {
      sendJson(res, 403, { error: 'Re-evaluation has been deactivated for your account. Please contact the MBA office.' });
      return;
    }

    const data = readData();
    data.requests = data.requests || [];
    if (data.requests.some(r => r.windowId === w.id && normEmail(r.studentEmail) === email)) {
      sendJson(res, 409, { error: 'You have already applied for re-evaluation in this window.' });
      return;
    }

    // One entry per question: its number, the reason, and up to 3 photos
    const items = Array.isArray(incoming.questionItems) ? incoming.questionItems : [];
    if (!items.length) { sendJson(res, 400, { error: 'Add at least one question.' }); return; }
    if (items.length > MAX_QUESTIONS) { sendJson(res, 400, { error: `You can list at most ${MAX_QUESTIONS} questions.` }); return; }
    const questionItems = [];
    const photos = [];   // [{ buffer, ext, name }]
    const usedNames = new Set();
    for (const [qi, item] of items.entries()) {
      const question = cleanText(item && item.question, 40);
      const reason = String((item && item.reason) || '').trim().slice(0, 3000);
      if (!question || !reason) { sendJson(res, 400, { error: `Question ${qi + 1} needs both the question number and a reason.` }); return; }
      const itemPhotos = Array.isArray(item.photos) ? item.photos : [];
      if (itemPhotos.length > MAX_PHOTOS_PER_QUESTION) { sendJson(res, 400, { error: `Question ${qi + 1} has more than ${MAX_PHOTOS_PER_QUESTION} photos.` }); return; }
      // Named after the question the student typed: "Q2(b) - 1.jpg", "Q2(b) - 2.jpg", …
      const label = photoLabel(question, qi);
      const names = [];
      for (const [pi, dataUrl] of itemPhotos.entries()) {
        let decoded;
        try { decoded = decodePhoto(dataUrl); } catch (e) { sendJson(res, 400, { error: `Question ${qi + 1}: ${e.message}` }); return; }
        let name = `${label} - ${pi + 1}.${decoded.ext}`;
        // Two cards can carry the same question number; keep the later one distinct
        while (usedNames.has(name)) name = `${label} (${qi + 1}) - ${pi + 1}.${decoded.ext}`;
        usedNames.add(name);
        photos.push({ ...decoded, name });
        names.push(name);
      }
      questionItems.push({ question, reason, photos: names });
    }

    const now = Date.now();
    const request = {
      id: /^[A-Za-z0-9-]{1,60}$/.test(String(incoming.id || '')) ? incoming.id : 'IIMC-' + now.toString(36).toUpperCase(),
      windowId: w.id,
      studentEmail: email,
      studentName: cleanText(incoming.studentName, 120),
      regNo,
      professorName: w.sections.length ? cleanText(incoming.professorName, 120) : w.professor,
      subject: w.subject,
      courseCode: w.courseCode,
      section: SECTIONS.includes(incoming.section) ? incoming.section : '',
      examType: w.examType,
      term: w.term,
      questions: questionItems.map(q => q.question).join(', '),
      questionItems,
      status: 'Pending',
      createdAt: now,
      updatedMarks: null,
      professorRemarks: null,
      history: [{ at: now, event: 'Submitted', by: email, note: '' }],
    };
    if (!request.studentName) { sendJson(res, 400, { error: 'Please enter your name.' }); return; }
    if (!request.professorName) { sendJson(res, 400, { error: 'No professor is assigned to this section.' }); return; }
    if (data.requests.some(r => r.id === request.id)) request.id += '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    // Photos first, so a saved request never points at missing files.
    // Google Drive when it's connected, this machine otherwise (or if Drive is unreachable).
    const dir = path.join(UPLOADS_DIR, request.id);
    let storedInDrive = false;
    if (photos.length && drive.driveEnabled()) {
      try {
        const uploaded = await drive.uploadRequestPhotos(request, w, photos);
        const byName = new Map(uploaded.photos.map(p => [p.name, p.driveId]));
        for (const item of request.questionItems) {
          item.photos = item.photos.map(name => ({ name, driveId: byName.get(name) }));
        }
        request.driveFolderId = uploaded.folderId;   // so the photos can be cleaned up later without guessing
        storedInDrive = true;
      } catch (e) {
        console.error(`  ⚠️  Drive upload failed (${e.message}) — keeping the photos on this machine instead.`);
      }
    }
    if (photos.length && !storedInDrive) {
      fs.mkdirSync(dir, { recursive: true });
      for (const p of photos) fs.writeFileSync(path.join(dir, p.name), p.buffer);
    }
    try {
      data.requests.push(request);
      saveAndArchive(data);
    } catch (e) {
      if (photos.length && !storedInDrive) fs.rmSync(dir, { recursive: true, force: true });
      throw e;
    }
    sendJson(res, 200, { request });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
}

// ===== PHOTO RETENTION =====
// Answer scripts are evidence for the professor's decision, not a permanent archive. Thirty days
// after a request is closed the photos are deleted — from Drive if that is where they went, from
// this machine otherwise. Everything else about the request is kept: questions, reasons, the
// decision and the timeline all survive, so the record stays complete without the storage.
const PHOTO_RETENTION_DAYS = Number(process.env.PHOTO_RETENTION_DAYS || 30);
const RETENTION_MS = PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const SWEEP_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

function photoCountOf(request) {
  return (request.questionItems || []).reduce((n, q) => n + ((q.photos || []).length), 0);
}

// Closed long enough, still holding photos, not already swept
function isPhotoExpired(request, now = Date.now()) {
  if (request.photosDeletedAt) return false;
  if (!String(request.status || '').startsWith('Resolved')) return false;
  const closedAt = request.resolvedAt || request.reviewedAt;
  if (!closedAt || now - closedAt < RETENTION_MS) return false;
  return photoCountOf(request) > 0;
}

// Delete one request's photos. Returns how many went. Throws without touching the request if
// Drive is unreachable, so the next sweep tries again rather than orphaning the files.
async function deletePhotosOf(request) {
  const items = request.questionItems || [];
  const driveIds = [];
  for (const item of items) {
    for (const photo of item.photos || []) {
      if (photo && typeof photo === 'object' && photo.driveId) driveIds.push(photo.driveId);
    }
  }

  if (driveIds.length) {
    if (!drive.driveEnabled()) throw new Error('Drive is not connected, so its photos cannot be deleted yet.');
    for (const id of driveIds) await drive.deletePhoto(id);
    if (request.driveFolderId) {
      try { await drive.deleteFolderIfEmpty(request.driveFolderId); }
      catch (e) { console.error(`  ⚠️  Could not remove the Drive folder for ${request.id}: ${e.message}`); }
    }
  }
  fs.rmSync(path.join(UPLOADS_DIR, request.id), { recursive: true, force: true });

  const count = photoCountOf(request);
  for (const item of items) {
    item.photoCount = (item.photos || []).length;   // what was there, for the record
    item.photos = [];
  }
  request.photosDeletedAt = Date.now();
  request.photoCountBeforeDeletion = count;
  request.history = Array.isArray(request.history) ? request.history : [];
  request.history.push({
    at: Date.now(),
    event: 'Photos deleted',
    by: 'Portal',
    from: `${count} photo${count === 1 ? '' : 's'}`,
    to: 'deleted',
    note: `Removed automatically ${PHOTO_RETENTION_DAYS} days after the request was closed.`,
  });
  return count;
}

let _sweeping = false;

async function sweepExpiredPhotos() {
  if (_sweeping) return { skipped: true, requests: 0, photos: 0, failed: 0 };
  _sweeping = true;
  const result = { requests: 0, photos: 0, failed: 0 };
  try {
    const data = readData();
    const due = (data.requests || []).filter(r => isPhotoExpired(r));
    if (!due.length) return result;

    for (const request of due) {
      try {
        result.photos += await deletePhotosOf(request);
        result.requests++;
      } catch (e) {
        result.failed++;
        console.error(`  ⚠️  Could not delete the photos for ${request.id}: ${e.message}`);
      }
    }
    if (result.requests) {
      saveAndArchive(data);
      console.log(`  🧹  Deleted ${result.photos} photo(s) from ${result.requests} request(s) closed over ${PHOTO_RETENTION_DAYS} days ago.`);
    }
  } catch (e) {
    console.error('  ⚠️  Photo sweep failed:', e.message);
  } finally {
    _sweeping = false;
  }
  return result;
}

// POST /api/maintenance/sweep-photos — run the sweep now.
// Only from this machine, or with the key from MAINTENANCE_KEY (for a hosted cron later).
async function handleMaintenance(req, res) {
  if (req.url !== '/api/maintenance/sweep-photos' || req.method !== 'POST') return false;
  const key = process.env.MAINTENANCE_KEY || '';
  const given = String(req.headers['x-maintenance-key'] || '');
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const allowed = key
    ? given.length === key.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key))
    : local;
  if (!allowed) { sendJson(res, 403, { error: 'Not allowed.' }); return true; }

  const result = await sweepExpiredPhotos();
  sendJson(res, 200, { retentionDays: PHOTO_RETENTION_DAYS, ...result });
  return true;
}

function findRequest(data, id) {
  return (data.requests || []).find(r => r.id === id);
}

function saveAndArchive(data) {
  writeData(data);
  archiveRequests(data.requests);
}

// POST /api/requests/:id/review — the professor's decision
const REVIEW_STATUSES = ['Under Review', 'Resolved - Marks Increased', 'Resolved - Marks Decreased', 'Resolved - No Change'];

async function handleRequestActions(req, res) {
  const m = req.url.match(/^\/api\/requests\/([^/]+)\/review$/);
  if (!m || req.method !== 'POST') return false;
  const id = decodeURIComponent(m[1]);

  try {
    const body = await readJsonBody(req);
    const data = readData();
    const request = findRequest(data, id);
    if (!request) { sendJson(res, 404, { error: 'Request not found.' }); return true; }

    const status = String(body.status || '');
    if (!REVIEW_STATUSES.includes(status)) { sendJson(res, 400, { error: 'Invalid status.' }); return true; }
    const remarks = String(body.professorRemarks || '').trim().slice(0, 5000);
    if (!remarks) { sendJson(res, 400, { error: 'Remarks are required.' }); return true; }

    const oldStatus = request.status;
    const by = cleanText(body.by, 200) || '—';
    request.updatedMarks = cleanText(body.updatedMarks, 500) || null;
    request.professorRemarks = remarks;
    request.status = status;
    request.reviewedAt = Date.now();
    // The retention clock starts when the professor closes the request, not when they first open it.
    // Reopening a request clears it, so a later decision starts the 30 days again.
    if (status.startsWith('Resolved')) { if (!request.resolvedAt) request.resolvedAt = Date.now(); }
    else request.resolvedAt = null;
    request.history = Array.isArray(request.history) ? request.history : [];
    request.history.push({
      at: Date.now(),
      event: oldStatus === status ? 'Remarks updated' : 'Status changed',
      by,
      from: oldStatus,
      to: status,
      note: remarks,
    });
    saveAndArchive(data);
    sendJson(res, 200, { request });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
  return true;
}

// Only the website itself is public. Data files, the server code and config are never served.
const PUBLIC_DIRS = ['css', 'js', 'assets'];

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }  // strip query string
  catch { res.writeHead(400); res.end('Bad Request'); return; }
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Stay inside the project folder (a plain prefix check would let "../Revaluation-other" through)
  const rel = path.relative(ROOT, filePath);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const parts = rel.split(path.sep);
  const allowed = (parts.length === 1 && parts[0] === 'index.html') ||
    (parts.length > 1 && PUBLIC_DIRS.includes(parts[0]) && !parts.some(seg => seg.startsWith('.')));
  if (!allowed) { res.writeHead(404); res.end('Not Found'); return; }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') { res.writeHead(404); res.end('Not Found'); }
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /api/requests ── return all live requests
  if (req.url === '/api/requests' && req.method === 'GET') {
    try { sendJson(res, 200, readData()); }
    catch (e) { sendJson(res, 500, { error: e.message }); }
    return;
  }

  // ── POST /api/requests ── legacy bulk save, now read-only.
  // Requests are created through /api/requests/submit and changed through /api/requests/:id/review,
  // which check windows, sections and who may change what. A bulk save could bypass all of that
  // (e.g. rewrite another student's request), so it's accepted but changes nothing.
  if (req.url === '/api/requests' && req.method === 'POST') {
    readJsonBody(req).then(payload => {
      if (!Array.isArray(payload.requests)) throw new Error('requests must be an array');
      sendJson(res, 200, { ok: true, ignored: payload.requests.length });
    }).catch(e => sendJson(res, 400, { error: e.message }));
    return;
  }

  // ── GET /api/archive ── return immutable full archive (all snapshots ever)
  if (req.url === '/api/archive' && req.method === 'GET') {
    try { sendJson(res, 200, readArchive()); }
    catch (e) { sendJson(res, 500, { error: e.message }); }
    return;
  }

  // ── Faculty added by the office ──
  if (req.url.startsWith('/api/faculty')) {
    handleFaculty(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    }).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
    return;
  }

  // ── Re-evaluation windows ──
  if (req.url.startsWith('/api/windows')) {
    handleWindows(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    }).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
    return;
  }

  // ── New request (window-checked) ──
  if (req.url === '/api/requests/submit' && req.method === 'POST') {
    handleSubmitRequest(req, res).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
    return;
  }

  // ── Professor decisions ──
  if (req.url.startsWith('/api/requests/')) {
    handleRequestActions(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    }).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
    return;
  }

  // ── Deactivated students ──
  if (req.url.startsWith('/api/blocks')) {
    handleBlocks(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    }).catch(e => { if (!res.headersSent) sendJson(res, 400, { error: e.message }); });
    return;
  }

  // ── Housekeeping ──
  if (req.url.startsWith('/api/maintenance/')) {
    handleMaintenance(req, res).then(handled => {
      if (!handled) sendJson(res, 404, { error: 'Not Found' });
    }).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
    return;
  }

  // ── Question photos ──
  if (req.url.startsWith('/api/photos/') && req.method === 'GET') {
    servePhoto(req, res).catch(e => { if (!res.headersSent) sendJson(res, 500, { error: e.message }); });
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
  console.log(`  📷  Photos:          ${drive.driveEnabled() ? drive.driveStatus() : drive.driveStatus() + ' → ' + UPLOADS_DIR}`);
  console.log(`  🧹  Photo retention: deleted ${PHOTO_RETENTION_DAYS} days after a request is closed`);
  console.log('  ⏹   Press Ctrl+C to stop the server');
  console.log('');

  // Sweep on start-up and once a week. unref() so the timer never holds the process open.
  sweepExpiredPhotos();
  setInterval(sweepExpiredPhotos, SWEEP_EVERY_MS).unref();
});
