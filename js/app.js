// ===== GOOGLE OAUTH — paste your Client ID here =====
// Get one at: https://console.cloud.google.com/ → APIs & Services → Credentials
// Add https://iimc-reevaluation-antares.netlify.app AND http://localhost:3000
// to Authorized JavaScript Origins.
const GOOGLE_CLIENT_ID = '536511739218-e3p6u17bji326mjktugahdquk9m4i0hr.apps.googleusercontent.com';

// ===== CLOUDINARY CONFIG =====
// Sign up free at https://cloudinary.com → Dashboard → copy Cloud Name
// Then: Settings → Upload → Add upload preset → set to "Unsigned" → copy preset name
const CLOUDINARY_CLOUD_NAME = 'doabil2m1';   // e.g. 'dxyz1234abc'
const CLOUDINARY_UPLOAD_PRESET = 'iimc_reeval_portal'; // e.g. 'iimc_reval_unsigned'
const CLOUDINARY_ENABLED = CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME';

// ===== PROFESSOR EMAIL DIRECTORY =====
// Each professor has one canonical @email.iimcal.ac.in email regardless of how many subjects they teach
const PROF_EMAILS = {
  'Prof. Anirvan Pant': 'anirvan.pant@email.iimcal.ac.in',
  'Prof. Arnab Bhattacharya': 'arnab.bhattacharya@email.iimcal.ac.in',
  'Prof. Avijit Bansal': 'avijit.bansal@email.iimcal.ac.in',
  'Prof. Ayesha Arora': 'ayesha.arora@email.iimcal.ac.in',
  'Prof. Balram Avittathur': 'balram.avittathur@email.iimcal.ac.in',
  'Prof. Biswatosh Saha': 'biswatosh.saha@email.iimcal.ac.in',
  'Prof. Kaushik Roy': 'kaushik.roy@email.iimcal.ac.in',
  'Prof. Latasri Hazarika': 'latasri.hazarika@email.iimcal.ac.in',
  'Prof. Partha Priya Datta': 'partha.datta@email.iimcal.ac.in',
  'Prof. Peeyush Mehta': 'peeyush.mehta@email.iimcal.ac.in',
  'Prof. Ramya T Venkateswaran': 'ramya.venkateswaran@email.iimcal.ac.in',
  'Prof. Saptarshi Purkayastha': 'saptarshi.purkayastha@email.iimcal.ac.in',
  'Prof. Sudarshan Kumar': 'sudarshan.kumar@email.iimcal.ac.in',
  'Prof. Sudhakar Reddy S': 'sudhakar.reddy@email.iimcal.ac.in',
  'Prof. Manish Kr. Thakur': 'manish.thakur@email.iimcal.ac.in',
  'Prof. Saikat Maitra': 'saikat.maitra@email.iimcal.ac.in',
  'Prof. Somdeep Chatterjee': 'somdeep.chatterjee@email.iimcal.ac.in',
  'Prof. Samarth Gupta': 'samarth.gupta@email.iimcal.ac.in',
  'Prof. S Sikdar': 's.sikdar@email.iimcal.ac.in',
  'Prof. Peeyush Mehta (Anupama)': 'anupama.mehta@email.iimcal.ac.in',
  'Prof. Dharma Raju Bathini': 'dharmaraju.bathini@email.iimcal.ac.in',
  'Prof. Madhuparna Karmokar': 'madhuparna.karmokar@email.iimcal.ac.in',
};

// Reverse lookup: email → canonical professor name
const EMAIL_TO_PROF = Object.fromEntries(
  Object.entries(PROF_EMAILS).map(([name, email]) => [email, name])
);

// ===== PROFESSOR-SUBJECT MAPPING =====
const PROF_MAP = [
  { professor: 'Prof. Anirvan Pant', subject: 'Strategic Management', sections: ['A'], termCoverage: 'Both' },
  { professor: 'Prof. Arnab Bhattacharya', subject: 'Corporate Finance', sections: ['E', 'F'], termCoverage: 'Both' },
  { professor: 'Prof. Avijit Bansal', subject: 'Corporate Finance', sections: ['D'], termCoverage: 'Both' },
  { professor: 'Prof. Ayesha Arora', subject: 'Operations Management', sections: ['E'], termCoverage: 'Both' },
  { professor: 'Prof. Balram Avittathur', subject: 'Operations Management', sections: ['A', 'D'], termCoverage: 'Both' },
  { professor: 'Prof. Biswatosh Saha', subject: 'Strategic Management', sections: ['B'], termCoverage: 'Both' },
  { professor: 'Prof. Kaushik Roy', subject: 'Strategic Management', sections: ['F'], termCoverage: 'Both' },
  { professor: 'Prof. Latasri Hazarika', subject: 'Strategic Management', sections: ['D'], termCoverage: 'Both' },
  { professor: 'Prof. Partha Priya Datta', subject: 'Operations Management', sections: ['B', 'C'], termCoverage: 'Both' },
  { professor: 'Prof. Peeyush Mehta', subject: 'Operations Management', sections: ['F'], termCoverage: 'Both' },
  { professor: 'Prof. Ramya T Venkateswaran', subject: 'Strategic Management', sections: ['E'], termCoverage: 'Both' },
  { professor: 'Prof. Saptarshi Purkayastha', subject: 'Strategic Management', sections: ['C'], termCoverage: 'Both' },
  { professor: 'Prof. Sudarshan Kumar', subject: 'Corporate Finance', sections: ['A'], termCoverage: 'Both' },
  { professor: 'Prof. Sudhakar Reddy S', subject: 'Corporate Finance', sections: ['B', 'C'], termCoverage: 'Both' },
  { professor: 'Prof. Manish Kr. Thakur', subject: 'Morphologies of the Social', sections: ['A', 'B', 'C', 'D', 'E', 'F'], termCoverage: 'PostMid' },
  { professor: 'Prof. Saikat Maitra', subject: 'Morphologies of the Social', sections: ['A', 'B', 'C', 'D', 'E', 'F'], termCoverage: 'PostMid' },
  { professor: 'Prof. Somdeep Chatterjee', subject: 'India and the World Economy', sections: ['A', 'B'], termCoverage: 'PostMid' },
  { professor: 'Prof. Samarth Gupta', subject: 'India and the World Economy', sections: ['C', 'D'], termCoverage: 'PostMid' },
  { professor: 'Prof. S Sikdar', subject: 'India and the World Economy', sections: ['E', 'F'], termCoverage: 'PostMid' },
  { professor: 'Prof. Kaushik Roy', subject: 'Management Game', sections: ['A'], termCoverage: 'PostMid' },
  { professor: 'Prof. Peeyush Mehta (Anupama)', subject: 'Management Game', sections: ['B'], termCoverage: 'PostMid' },
  { professor: 'Prof. Dharma Raju Bathini', subject: 'Management Game', sections: ['C'], termCoverage: 'PostMid' },
  { professor: 'Prof. Madhuparna Karmokar', subject: 'Management Game', sections: ['D'], termCoverage: 'PostMid' },
  { professor: 'Prof. Saptarshi Purkayastha', subject: 'Management Game', sections: ['E'], termCoverage: 'PostMid' },
  { professor: 'Prof. Sudarshan Kumar', subject: 'Management Game', sections: ['F'], termCoverage: 'PostMid' },
];

// Get unique subjects (preserving order)
function getUniqueSubjects() {
  return [...new Set(PROF_MAP.map(e => e.subject))];
}

// Get all entries for a given subject
function getEntriesForSubject(subject) {
  return PROF_MAP.filter(e => e.subject === subject);
}

// Get entries for a given professor (by exact name across subjects)
function getEntriesForProfessor(profName) {
  return PROF_MAP.filter(e => e.professor === profName);
}

// Get term coverage for a subject (all entries should have same coverage per subject)
function getTermCoverageForSubject(subject) {
  const entries = getEntriesForSubject(subject);
  return entries.length ? entries[0].termCoverage : 'Both';
}

// ===== STATE =====
let currentUser = null;
let currentProfRequestId = null;
let currentStudentTab = 'pending';
let currentProfTab = 'pending';

// ===== STORAGE — server-sync with localStorage fallback =====
// All reads use the in-memory cache so nothing else needs to be async.
const SERVER_API = '/api/requests';
let _cache = [];          // in-memory request cache
let _serverMode = false;  // true when server is reachable

// Sync getter — always use the cache
function getRequests() { return _cache; }

// Save: update cache + localStorage + (background) POST to server
function saveRequests(requests) {
  _cache = requests;
  localStorage.setItem('reval_requests', JSON.stringify(requests));
  if (_serverMode) {
    fetch(SERVER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }).catch(() => { _serverMode = false; });
  }
}

// Create a new request. The server checks the window is open, the section belongs to it,
// and the student hasn't already applied; offline, it's just stored locally.
async function submitNewRequest(request) {
  if (_serverMode) {
    const res = await fetch('/api/requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Submission failed');
    _cache.push(data.request);
    localStorage.setItem('reval_requests', JSON.stringify(_cache));
    return data.request;
  }
  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);
  return request;
}

// Called once on page load — try server first, fall back to localStorage
async function loadInitialData() {
  try {
    const res = await fetch(SERVER_API, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    _cache = data.requests || [];
    _serverMode = true;
    // Keep localStorage in sync
    localStorage.setItem('reval_requests', JSON.stringify(_cache));
    console.log(`[Storage] Server mode — ${_cache.length} requests loaded from data/requests.json`);
  } catch {
    // Server not running — use localStorage
    _cache = JSON.parse(localStorage.getItem('reval_requests') || '[]');
    _serverMode = false;
    console.log(`[Storage] Offline mode — ${_cache.length} requests loaded from localStorage`);
  }
}

function generateId() {
  return 'IIMC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== CLOUDINARY UPLOAD =====
async function uploadToCloudinary(file) {
  if (!CLOUDINARY_ENABLED) return null;  // not configured — skip
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('folder', 'iimc-reval');
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
  const data = await res.json();
  return data.secure_url;  // permanent HTTPS URL
}

// ===== PAYMENT — UPI QR (POC) =====
// The student scans the college UPI QR and pays the flat fee (PAYMENT_AMOUNT_INR, default ₹10).
// UPI cannot tell this app that money arrived, so a request is recorded as "payment unconfirmed"
// until the MBA office matches it against the bank statement. Refunds are sent back by hand.
let _payConfig = null;    // { amount, currency, upi } from /api/payment/config

function paymentAmount() {
  return _payConfig && _payConfig.amount ? _payConfig.amount : 10;
}

function isUpiEnabled() {
  return Boolean(_payConfig && _payConfig.upi && _payConfig.upi.vpa);
}

async function loadPaymentConfig() {
  if (!_serverMode) return;
  try {
    const res = await fetch('/api/payment/config', { signal: AbortSignal.timeout(1500) });
    if (res.ok) _payConfig = await res.json();
  } catch { _payConfig = null; }
}

function resetPaymentSection() {
  setUpiStatus('', '');
  updateUpiBox();
}

// Plain UPI collect link: payee address + payee name, the format UPI apps expect
function upiPayLink() {
  const upi = (_payConfig && _payConfig.upi) || {};
  const params = new URLSearchParams({ pa: upi.vpa || '', pn: upi.payeeName || 'IIM Calcutta' });
  return 'upi://pay?' + params.toString();
}

function updateUpiBox() {
  const amountEl = document.getElementById('upi-amount');
  const vpaEl = document.getElementById('upi-vpa');
  const qrEl = document.getElementById('upi-qr');
  const linkEl = document.getElementById('upi-open-link');
  if (!qrEl) return;

  amountEl.textContent = '₹' + paymentAmount().toLocaleString('en-IN');

  if (!isUpiEnabled()) {
    vpaEl.textContent = '—';
    qrEl.innerHTML = '<div class="upi-qr-missing">QR unavailable</div>';
    linkEl.style.display = 'none';
    setUpiStatus(_serverMode
      ? 'No college UPI ID is configured. Set UPI_VPA in .env and restart the server.'
      : 'The QR needs the portal server. Start it with start.bat and open the address it prints.', 'err');
    return;
  }

  const link = upiPayLink();
  vpaEl.textContent = _payConfig.upi.vpa;
  linkEl.href = link;
  linkEl.style.display = '';

  // Redraw only when the link changes (the library replaces the element's contents)
  if (qrEl.dataset.link !== link) {
    qrEl.innerHTML = '';
    qrEl.dataset.link = link;
    if (typeof QRCode === 'undefined') {
      qrEl.innerHTML = '<div class="upi-qr-missing">QR code library did not load.<br/>Pay ' +
        escapeHtml(_payConfig.upi.vpa) + ' manually.</div>';
      return;
    }
    try {
      new QRCode(qrEl, { text: link, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
    } catch (err) {
      qrEl.innerHTML = '<div class="upi-qr-missing">Could not draw the QR code.<br/>Pay ' +
        escapeHtml(_payConfig.upi.vpa) + ' manually.</div>';
    }
  }
}

function setUpiStatus(msg, kind) {
  const el = document.getElementById('upi-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'upi-status' + (kind ? ' ' + kind : '');
}

function copyUpiId() {
  if (!isUpiEnabled()) return;
  navigator.clipboard.writeText(_payConfig.upi.vpa)
    .then(() => showToast('UPI ID copied.', 'success'))
    .catch(() => showToast('Could not copy. The UPI ID is ' + _payConfig.upi.vpa, 'info'));
}

// ===== SUBMISSION =====
// Returns { ok, fields } for the request record. The office confirms the payment later.
async function getPaymentForSubmission() {
  return {
    ok: true,
    fields: {
      paymentMethod: 'upi',
      amountPaid: paymentAmount(),
      paymentVerified: false,   // the MBA office confirms this against the bank statement
    },
  };
}

// ===== FEE REFUNDS =====
// Like the demand draft: the fee is kept if marks don't change, refunded if they go up or down.
// The server issues refunds when the professor saves a "marks changed" decision.
const REFUND_STATUSES = ['Resolved - Marks Increased', 'Resolved - Marks Decreased'];

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// { tone, label, detail } describing what happened to this request's fee
function getFeeState(r) {
  const paidOnline = r.paymentMethod === 'razorpay' && r.razorpayPaymentId;
  const amount = r.refund && r.refund.amount ? r.refund.amount / 100 : r.amountPaid;
  const refund = r.refund;

  if (refund && refund.status === 'processed') {
    return { tone: 'ok', label: `Fee refunded · ₹${amount}`, detail: `Refund ${refund.id} processed${refund.processedAt ? ' on ' + formatDate(refund.processedAt) : ''}. It can take 5–7 working days to show in the bank account.` };
  }
  if (refund && refund.status === 'pending') {
    return { tone: 'info', label: `Refund initiated · ₹${amount}`, detail: `Refund ${refund.id} is being processed by Razorpay. Usually 5–7 working days (UPI is often faster).` };
  }
  if (refund && refund.status === 'failed') {
    return { tone: 'err', label: 'Refund failed', detail: `The refund could not be issued: ${refund.error || 'unknown error'}. The professor or MBA office can retry it.` };
  }
  if (refund && refund.status === 'manual') {
    return { tone: 'warn', label: 'Refund due (manual)', detail: refund.note };
  }
  if (r.status === 'Resolved - No Change') {
    return { tone: 'muted', label: 'Fee retained', detail: 'Marks did not change, so the re-evaluation fee is kept.' };
  }
  if (r.paymentMethod === 'upi') {
    return {
      tone: r.paymentVerified ? 'muted' : 'warn',
      label: `Fee paid by UPI · ₹${r.amountPaid}`,
      detail: `${r.upiUtr ? 'UTR ' + r.upiUtr + '. ' : ''}${r.paymentVerified ? 'Confirmed by the MBA office.' : 'The MBA office still has to match this against the bank statement.'} If your marks change, the office refunds the fee to ${r.upiPayerVpa || 'the account you paid from'}.`,
    };
  }
  if (REFUND_STATUSES.includes(r.status) && !paidOnline) {
    return { tone: 'warn', label: 'Refund due (manual)', detail: 'Paid by receipt — the MBA office refunds this manually.' };
  }
  if (paidOnline) {
    return { tone: 'muted', label: `Fee paid · ₹${r.amountPaid}`, detail: 'Refunded automatically if your marks change; kept if they don\'t.' };
  }
  return null;
}

function feeChip(r) {
  const s = getFeeState(r);
  return s ? `<span class="fee-chip fee-${s.tone}">💳 ${escapeHtml(s.label)}</span>` : '';
}

function feeDetailHtml(r) {
  const s = getFeeState(r);
  if (!s) return '';
  return `
    <div class="fee-box fee-${s.tone}">
      <div class="fee-box-label">💳 ${escapeHtml(s.label)}</div>
      <div class="fee-box-detail">${escapeHtml(s.detail)}</div>
      ${r.razorpayPaymentId ? `<div class="fee-box-ids">Payment ${escapeHtml(r.razorpayPaymentId)}${r.refund && r.refund.id ? ' · Refund ' + escapeHtml(r.refund.id) : ''}</div>`
        : r.upiUtr ? `<div class="fee-box-ids">UPI UTR ${escapeHtml(r.upiUtr)} · from ${escapeHtml(r.upiPayerVpa || '—')}</div>` : ''}
    </div>`;
}

// Replace one request in the cache with the server's copy
function replaceCachedRequest(updated) {
  const idx = _cache.findIndex(x => x.id === updated.id);
  if (idx !== -1) _cache[idx] = updated; else _cache.push(updated);
  localStorage.setItem('reval_requests', JSON.stringify(_cache));
}

async function postRequestAction(id, action, body) {
  const res = await fetch(`/api/requests/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  replaceCachedRequest(data.request);
  return data.request;
}

// Pull the latest refund status from Razorpay (used when no webhook is configured)
async function refreshRefundStatus(id) {
  const r = getRequests().find(x => x.id === id);
  if (!_serverMode || !r || !r.refund || r.refund.status !== 'pending') return false;
  try {
    const updated = await postRequestAction(id, 'refund/refresh');
    return updated.refund.status !== 'pending';
  } catch { return false; }
}

// ===== HISTORY TIMELINE RENDERER =====
function renderHistoryTimeline(r) {
  const forProfessor = currentUser && currentUser.role === 'professor';
  // Build history from the stored array; fall back to synthesised entries for legacy requests
  let entries = Array.isArray(r.history) && r.history.length > 0 ? r.history : [];
  // Fees and refunds are handled by the MBA office — faculty don't see them
  if (forProfessor) entries = entries.filter(e => !/^Refund /.test(e.event || ''));

  if (entries.length === 0) {
    // Legacy request — synthesise from timestamps
    entries = [{ at: r.createdAt, event: 'Submitted', by: r.studentEmail || '—', note: '' }];
    if (r.reviewedAt) {
      entries.push({ at: r.reviewedAt, event: 'Status changed', by: '—', from: 'Pending', to: r.status, note: r.professorRemarks || '' });
    }
  }

  const icons = { 'Submitted': '📨', 'Status changed': '🔄', 'Remarks updated': '✏️', 'Refund initiated': '💸', 'Refund processed': '✅', 'Refund failed': '⚠️' };
  const dots = { 'Submitted': 'dot-submit', 'Status changed': 'dot-change', 'Remarks updated': 'dot-remark', 'Refund initiated': 'dot-change', 'Refund processed': 'dot-submit', 'Refund failed': 'dot-remark' };

  const rows = entries.map((e, i) => {
    const isLast = i === entries.length - 1;
    const icon = icons[e.event] || '📌';
    const dotClass = dots[e.event] || 'dot-change';
    const statusChange = (e.from && e.to && e.from !== e.to)
      ? `<span class="ht-status-change">${e.from} → ${e.to}</span>`
      : '';
    const note = e.note ? `<div class="ht-note">${e.note}</div>` : '';
    const actor = e.by ? `<span class="ht-actor">${e.by}</span>` : '';
    return `
      <div class="ht-entry${isLast ? ' ht-last' : ''}">
        <div class="ht-left">
          <div class="ht-dot ${dotClass}">${icon}</div>
          ${!isLast ? '<div class="ht-line"></div>' : ''}
        </div>
        <div class="ht-content">
          <div class="ht-header">
            <span class="ht-event">${e.event}</span>
            <span class="ht-time">${formatDateTime(e.at)}</span>
          </div>
          ${statusChange}
          ${actor}
          ${note}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="history-timeline-wrap detail-section">
      <h4>Activity History</h4>
      <div class="history-timeline">${rows}</div>
    </div>`;
}

// ===== REQUEST FORM (tied to an open window) =====
// Subject, exam type and term come from the window; the student only picks their section,
// and the professor follows from the subject + section mapping.
let _formWindow = null;

function professorFor(subject, section) {
  const entry = PROF_MAP.find(e => e.subject === subject && e.sections.includes(section));
  return entry ? entry.professor : '';
}

function onSectionChange() {
  const section = document.getElementById('f-section').value;
  document.getElementById('f-prof').value = _formWindow && section ? professorFor(_formWindow.subject, section) : '';
}

// ===== REGISTRATION NUMBER AUTO-FILL =====
// Format: MBA/0XXX/62  (e.g. MBA/0042/62, MBA/0250/62)
// 480 students across 6 sections of 80:
//   A: 001–080 | B: 081–160 | C: 161–240 | D: 241–320 | E: 321–400 | F: 401–480
function getSectionFromRegNo(regNo) {
  if (!regNo) return null;
  // Accept formats: MBA/0042/62  or  MBA/042/62  or just the number
  const match = regNo.match(/MBA\/0*(\d{1,3})\/\d+/i) || regNo.match(/^0*(\d{1,3})$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 1 || num > 480) return null;
  if (num <= 80) return 'A';
  if (num <= 160) return 'B';
  if (num <= 240) return 'C';
  if (num <= 320) return 'D';
  if (num <= 400) return 'E';
  return 'F';
}

function onRegNoChange() {
  const regNo = document.getElementById('f-regno').value.trim();
  const section = getSectionFromRegNo(regNo);

  const existing = document.getElementById('regno-hint');
  if (existing) existing.remove();
  if (!section) return;

  // Pick the section automatically when it's part of this window; warn when it isn't
  const allowed = !_formWindow || !_formWindow.sections.length || _formWindow.sections.includes(section);
  const hintEl = document.createElement('div');
  hintEl.id = 'regno-hint';
  hintEl.style.cssText = 'font-size:12px; margin-top:4px; color:' + (allowed ? '#C9A84C' : '#b83232') + ';';
  hintEl.textContent = allowed
    ? `🏷️ Detected: Section ${section}`
    : `⚠️ Section ${section} is not part of this re-evaluation window.`;
  document.getElementById('f-regno').parentNode.appendChild(hintEl);

  if (allowed && _formWindow && _formWindow.sections.length) {
    document.getElementById('f-section').value = section;
    onSectionChange();
  }
}

// ===== GOOGLE SIGN-IN =====
const IIMC_DOMAIN = 'email.iimcal.ac.in';

function initGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
  // Prefer the IIMC Google account in the chooser, and pre-select whoever last signed in on this browser
  let lastEmail = '';
  try { lastEmail = localStorage.getItem('reval_last_email') || ''; } catch { }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    hd: IIMC_DOMAIN,
    ...(lastEmail ? { login_hint: lastEmail } : {}),
  });
  const btnEl = document.getElementById('google-signin-btn');
  if (btnEl) {
    google.accounts.id.renderButton(btnEl, {
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 320,
    });
  }
}

function handleGoogleCredential(response) {
  const errorEl = document.getElementById('google-auth-error');
  if (errorEl) errorEl.textContent = '';
  try {
    // Decode JWT payload (base64url → JSON, no library needed)
    const base64 = response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const email = (payload.email || '').toLowerCase();
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || '';

    // ── Domain enforcement ──
    if (!email.endsWith('@email.iimcal.ac.in')) {
      if (errorEl) errorEl.textContent = 'Access restricted to @email.iimcal.ac.in accounts only. Please sign in with your IIMC Google account.';
      google.accounts.id.disableAutoSelect();
      return;
    }

    // ── Auto-detect role ──
    const role = ADMIN_EMAILS.includes(email) ? 'admin' : EMAIL_TO_PROF[email] ? 'professor' : 'student';

    currentUser = { email, name, role, picture };
    localStorage.setItem('reval_session', JSON.stringify(currentUser));
    localStorage.setItem('reval_last_email', email);

    applyUserTheme();
    openDashboardForRole();
  } catch (err) {
    if (errorEl) errorEl.textContent = 'Sign-in failed. Please try again.';
    console.error('[Google Auth] Error:', err);
  }
}

// Resolve canonical professor name from email (exact match)
function resolveProfessorName(email) {
  return EMAIL_TO_PROF[(email || '').toLowerCase()] || null;
}

// Get all PROF_MAP entries for the logged-in professor
function getProfMapEntriesForUser() {
  const profName = resolveProfessorName(currentUser.email);
  if (!profName) return [];
  return PROF_MAP.filter(e => e.professor === profName);
}

function signOut() {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  currentUser = null;
  document.body.classList.remove('theme-sage');
  localStorage.removeItem('reval_session');
  showPage('page-login');
  showToast('Signed out successfully.', 'success');
}

// ===== PAGE ROUTING =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== STUDENT DASHBOARD =====
const CAT_EMAILS = ['avanthekac2027@email.iimcal.ac.in'];
const SAGE_EMAILS = ['avanthekac2027@email.iimcal.ac.in'];
const MASTER_EMAILS = ['anuja2027@email.iimcal.ac.in'];

// Returns the display label for the nav-user chip
function navDisplayLabel() {
  const email = (currentUser.email || '').toLowerCase();
  if (CAT_EMAILS.includes(email)) return 'Welcome, my little cat.';
  if (MASTER_EMAILS.includes(email)) return 'Welcome, AntaresRed.';
  const firstName = (currentUser.name || email).split(' ')[0];
  return 'Welcome, ' + firstName;
}

// Applies / removes the sage green theme based on the logged-in user
function applyUserTheme() {
  if (SAGE_EMAILS.includes((currentUser && currentUser.email || '').toLowerCase())) {
    document.body.classList.add('theme-sage');
  } else {
    document.body.classList.remove('theme-sage');
  }
}

function initStudentDashboard() {
  const navUser = document.getElementById('student-nav-user');
  const label = navDisplayLabel();
  navUser.innerHTML = currentUser.picture
    ? `<img src="${currentUser.picture}" alt="" class="nav-user-photo"><span>${label}</span>`
    : label;
  document.getElementById('student-welcome').textContent =
    'Welcome back, ' + currentUser.name + '! Manage your re-evaluation requests below.';
  renderStudentOpenWindows();
  renderStudentStats();
  renderStudentRequests(currentStudentTab);
}

function formatName(n) {
  return n.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function renderStudentStats() {
  const all = getRequests().filter(r => r.studentEmail === currentUser.email);
  const stats = [
    { label: 'Total Requests', val: all.length },
    { label: 'Pending', val: all.filter(r => r.status === 'Pending').length },
    { label: 'Under Review', val: all.filter(r => r.status === 'Under Review').length },
    { label: 'Resolved', val: all.filter(r => r.status.startsWith('Resolved')).length },
  ];
  document.getElementById('student-stats').innerHTML = stats.map(s =>
    `<div class="stat-card"><div class="stat-number">${s.val}</div><div class="stat-label">${s.label}</div></div>`
  ).join('');
}

function switchStudentTab(tab, el) {
  currentStudentTab = tab;
  document.querySelectorAll('#page-student .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderStudentRequests(tab);
}

function renderStudentRequests(tab) {
  let all = getRequests().filter(r => r.studentEmail === currentUser.email);
  if (tab === 'pending') all = all.filter(r => r.status === 'Pending');
  else if (tab === 'review') all = all.filter(r => r.status === 'Under Review');
  else if (tab === 'resolved') all = all.filter(r => r.status.startsWith('Resolved'));

  const grid = document.getElementById('student-requests-grid');
  if (all.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No requests in this category.</p>
    </div>`;
    return;
  }
  all.sort((a, b) => b.createdAt - a.createdAt);
  grid.innerHTML = all.map(r => studentCard(r)).join('');
}

function studentCard(r) {
  const hasResult = r.status.startsWith('Resolved');
  const resultAlert = hasResult
    ? `<div class="card-result-alert ${getResultClass(r.status)}" style="margin-bottom:8px;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;">${r.status}</div>`
    : '';
  return `
  <div class="request-card" onclick="openStudentDetail('${r.id}')">
    <div class="card-top">
      <div class="card-subject">${r.subject}</div>
      ${getBadge(r.status)}
    </div>
    ${resultAlert}
    <div class="card-meta">
      <span class="meta-item">📅 ${r.examType}</span>
      <span class="meta-item">👨‍🏫 ${r.professorName}</span>
      <span class="meta-item">🏷️ Sec ${r.section}</span>
    </div>
    <div class="card-questions">Questions: ${r.questions}</div>
    ${feeChip(r)}
    <div class="card-footer">
      <span>ID: ${r.id}</span>
      <span>${formatDate(r.createdAt)}</span>
    </div>
  </div>`;
}

function getResultClass(status) {
  if (status.includes('Increased')) return 'result-increased-alert';
  if (status.includes('Decreased')) return 'result-decreased-alert';
  return 'result-nochange-alert';
}

function getBadge(status) {
  if (status === 'Pending') return `<span class="badge badge-pending">Pending</span>`;
  if (status === 'Under Review') return `<span class="badge badge-review">Under Review</span>`;
  if (status.includes('Increased')) return `<span class="badge badge-increased">Marks Up ↑</span>`;
  if (status.includes('Decreased')) return `<span class="badge badge-decreased">Marks Down ↓</span>`;
  return `<span class="badge badge-nochange">No Change</span>`;
}

function openStudentDetail(id) {
  const r = getRequests().find(x => x.id === id);
  if (!r) return;
  // If a refund is still pending, ask Razorpay for the latest status and re-render once it changes
  refreshRefundStatus(id).then(changed => {
    if (changed && document.getElementById('student-detail-modal').classList.contains('open')) {
      openStudentDetail(id);
      renderStudentRequests(currentStudentTab);
    }
  });

  let resultHtml = '';
  if (r.updatedMarks || r.professorRemarks) {
    const boxClass = r.status.includes('Increased') ? '' : r.status.includes('Decreased') ? ' result-decreased' : ' result-nochange';
    resultHtml = `
    <div class="result-box${boxClass}">
      <h5>Professor's Decision</h5>
      ${r.updatedMarks ? `<span class="result-marks">${r.updatedMarks}</span>` : ''}
      ${r.professorRemarks ? `<div class="result-remarks">${r.professorRemarks}</div>` : ''}
    </div>`;
  }

  document.getElementById('student-detail-body').innerHTML = `
    <div class="detail-section">
      <h4>Request Information</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>Full Name</label><span>${r.studentName}</span></div>
        <div class="detail-item"><label>Registration No.</label><span>${r.regNo}</span></div>
        <div class="detail-item"><label>Subject</label><span>${r.subject}</span></div>
        <div class="detail-item"><label>Section</label><span>${r.section}</span></div>
        <div class="detail-item"><label>Exam Type</label><span>${r.examType}</span></div>
        <div class="detail-item"><label>Professor</label><span>${r.professorName}</span></div>
        <div class="detail-item"><label>Term</label><span>${r.term}</span></div>
        <div class="detail-item"><label>Status</label><span>${getBadge(r.status)}</span></div>
        <div class="detail-item detail-full"><label>Questions</label><span>${r.questions}</span></div>
        <div class="detail-item detail-full"><label>Reason for Re-Evaluation</label><span style="white-space:pre-wrap">${r.reason}</span></div>
        <div class="detail-item"><label>Submitted On</label><span>${formatDate(r.createdAt)}</span></div>
        <div class="detail-item"><label>Request ID</label><span style="font-family:monospace;font-size:12px">${r.id}</span></div>
        ${r.upiUtr ? `
        <div class="detail-item"><label>Paid by UPI</label><span style="font-family:monospace;font-size:12px">UTR ${escapeHtml(r.upiUtr)}</span></div>
        <div class="detail-item"><label>Refund goes to</label><span style="font-family:monospace;font-size:12px">${escapeHtml(r.upiPayerVpa || '—')}</span></div>` : ''}
        ${!r.paymentFileName && !r.paymentUrl ? '' : `<div class="detail-item"><label>Payment Proof</label><span>${r.paymentUrl
      ? `<a href="${r.paymentUrl}" target="_blank" style="color:var(--iim-brown);text-decoration:underline">View receipt ↗</a>`
      : '<span style="color:#3fb950">✓ Uploaded (local)</span>'
    }</span></div>`}
        ${r.supportingDocs && r.supportingDocs.length ? `
        <div class="detail-item detail-full"><label>Supporting Docs</label><span style="display:flex;flex-wrap:wrap;gap:8px">${r.supportingDocUrls && r.supportingDocUrls.length
        ? r.supportingDocUrls.map((url, i) => `<a href="${url}" target="_blank" style="color:var(--iim-brown);text-decoration:underline">${r.supportingDocs[i] || 'File ' + (i + 1)} ↗</a>`).join('')
        : r.supportingDocs.map(n => `<span style="color:#3fb950">✓ ${n}</span>`).join(', ')
      }</span></div>` : ''}
      </div>
    </div>
    ${feeDetailHtml(r)}
    ${resultHtml}
    ${renderHistoryTimeline(r)}`;
  openModal('student-detail-modal');
}

// ===== STUDENT FORM =====
// Opens the request form for one open window. Returns false if the student can't apply.
function showStudentForm(windowId) {
  const w = getWindows().find(x => x.id === windowId);
  if (!w || windowStateOf(w) !== 'open') { showToast('This re-evaluation window is not open.', 'error'); return false; }
  if (hasAppliedInWindow(w.id)) { showToast('You have already applied in this window.', 'info'); return false; }
  _formWindow = w;

  document.getElementById('reval-form').reset();
  document.getElementById('form-window-summary').innerHTML = windowSummaryHtml(w);
  const sectioned = w.sections.length > 0;
  document.getElementById('f-section-group').style.display = sectioned ? '' : 'none';
  const secSel = document.getElementById('f-section');
  secSel.required = sectioned;
  secSel.innerHTML = '<option value="">Select section</option>' +
    w.sections.map(sec => `<option value="${sec}">Section ${sec}</option>`).join('');
  document.getElementById('f-prof').value = sectioned ? '' : (w.professor || '');
  const hint = document.getElementById('regno-hint');
  if (hint) hint.remove();
  document.getElementById('docs-upload-content').innerHTML = `
    <span class="file-upload-icon">🗂️</span>
    <p>Upload answer scripts, screenshots or any supporting evidence</p>
    <span class="file-upload-hint">JPG, PNG, PDF or Word • Multiple files • Max 5MB each</span>`;
  document.getElementById('docs-upload-area').classList.remove('has-file');
  resetPaymentSection();
  openModal('student-form-modal');
  return true;
}

function handleDocsUpload(input) {
  if (input.files && input.files.length > 0) {
    const oversized = Array.from(input.files).find(f => f.size > 5 * 1024 * 1024);
    if (oversized) { showToast(`"${oversized.name}" exceeds 5MB limit.`, 'error'); return; }
    const names = Array.from(input.files).map(f => f.name).join(', ');
    const totalKb = Array.from(input.files).reduce((s, f) => s + f.size, 0) / 1024;
    document.getElementById('docs-upload-content').innerHTML = `
      <span class="file-upload-icon">✅</span>
      <p style="color:#3fb950;font-weight:600">${input.files.length} file${input.files.length > 1 ? 's' : ''} selected</p>
      <span class="file-upload-hint">${names} • ${totalKb.toFixed(1)} KB total • Click to change</span>`;
    document.getElementById('docs-upload-area').classList.add('has-file');
  }
}

async function submitRevalForm(e) {
  e.preventDefault();
  const w = _formWindow;
  if (!w || windowStateOf(w) !== 'open') { showToast('This re-evaluation window has closed.', 'error'); return; }

  // Windows without sections cover every student of the subject and name their professor
  const sectioned = w.sections.length > 0;
  const regSection = getSectionFromRegNo(document.getElementById('f-regno').value.trim());
  const section = sectioned ? document.getElementById('f-section').value : (regSection || '');
  if (sectioned && (!section || !w.sections.includes(section))) { showToast('Please select one of the sections in this window.', 'error'); return; }
  if (sectioned && regSection && regSection !== section) {
    showToast(`Your registration number is in Section ${regSection}, not Section ${section}.`, 'error');
    return;
  }
  const professorName = sectioned ? professorFor(w.subject, section) : w.professor;
  if (!professorName) {
    showToast(sectioned ? `No professor is mapped to ${w.subject} for Section ${section}.` : 'This window has no reviewing professor.', 'error');
    return;
  }

  const payment = await getPaymentForSubmission();
  if (!payment.ok) return;

  const submitBtn = document.querySelector('#reval-form button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const now = Date.now();
  const request = {
    id: generateId(),
    windowId: w.id,
    studentEmail: currentUser.email,
    studentName: document.getElementById('f-name').value.trim(),
    regNo: document.getElementById('f-regno').value.trim(),
    professorName,
    subject: w.subject,
    courseCode: w.courseCode || '',
    section,
    examType: w.examType,
    term: w.term,
    questions: document.getElementById('f-questions').value.trim(),
    reason: document.getElementById('f-reason').value.trim(),
    supportingDocs: Array.from(document.getElementById('f-docs').files || []).map(f => f.name),
    ...payment.fields,
    status: 'Pending',
    createdAt: now,
    updatedMarks: null,
    professorRemarks: null,
    history: [{ at: now, event: 'Submitted', by: currentUser.email, note: '' }],
  };

  try {
    await submitNewRequest(request);
  } catch (err) {
    showToast('Could not submit: ' + err.message, 'error');
    return;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }

  stopFormCountdown();
  closeModal('student-form-modal');
  renderStudentStats();
  renderStudentOpenWindows();
  switchStudentTab('pending', document.querySelector('#page-student .tab'));
  jokaToast('submit', section);
}

// ===== PROFESSOR DASHBOARD =====
function initProfDashboard() {
  const navUser = document.getElementById('prof-nav-user');
  const label = navDisplayLabel();
  navUser.innerHTML = currentUser.picture
    ? `<img src="${currentUser.picture}" alt="" class="nav-user-photo"><span>${label}</span>`
    : label;

  // Show this professor's known subjects and sections
  const entries = getProfMapEntriesForUser();
  let subtitleExtra = '';
  if (entries.length) {
    const subjects = [...new Set(entries.map(e => e.subject))].join(', ');
    const sections = [...new Set(entries.flatMap(e => e.sections))].sort().join(', ');
    subtitleExtra = ` · Subjects: ${subjects} · Sections: ${sections}`;
  }

  document.getElementById('prof-welcome').textContent =
    `Welcome, ${currentUser.name}. Review re-evaluation requests assigned to you.${subtitleExtra}`;

  renderProfOpenWindows();
  renderProfStats();
  renderProfRequests(currentProfTab);
}

// Get all requests that belong to this professor
// Matching is done by exact professor name from the mapping
function getProfRequests() {
  const all = getRequests();
  const myEntries = getProfMapEntriesForUser();
  const myNames = new Set(myEntries.map(e => e.professor));

  if (myNames.size === 0) {
    // Fallback: fuzzy match by email prefix
    const profKeyword = currentUser.name.toLowerCase().replace(/[._-]/g, ' ');
    return all.filter(r => r.professorName.toLowerCase().includes(profKeyword.split(' ')[0]));
  }
  return all.filter(r => myNames.has(r.professorName));
}

function renderProfStats() {
  const all = getProfRequests();
  const stats = [
    { label: 'Total Requests', val: all.length },
    { label: 'Pending', val: all.filter(r => r.status === 'Pending').length },
    { label: 'Under Review', val: all.filter(r => r.status === 'Under Review').length },
    { label: 'Resolved', val: all.filter(r => r.status.startsWith('Resolved')).length },
  ];
  document.getElementById('prof-stats').innerHTML = stats.map(s =>
    `<div class="stat-card"><div class="stat-number">${s.val}</div><div class="stat-label">${s.label}</div></div>`
  ).join('');
}

function switchProfTab(tab, el) {
  currentProfTab = tab;
  document.querySelectorAll('#page-professor .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderProfRequests(tab);
}

function renderProfRequests(tab) {
  let all = getProfRequests();
  if (tab === 'pending') all = all.filter(r => r.status === 'Pending');
  else if (tab === 'review') all = all.filter(r => r.status === 'Under Review');
  else if (tab === 'resolved') all = all.filter(r => r.status.startsWith('Resolved'));

  const grid = document.getElementById('prof-requests-grid');
  if (all.length === 0) {
    grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No requests in this category.</p>
      <button class="btn-primary-sm" onclick="loadDemoData()">Load demo requests</button>
    </div>`;
    return;
  }
  all.sort((a, b) => b.createdAt - a.createdAt);
  grid.innerHTML = all.map(r => profCard(r)).join('');
}

function profCard(r) {
  return `
  <div class="request-card" onclick="openProfReview('${r.id}')">
    <div class="card-top">
      <div class="card-subject">${r.subject}</div>
      ${getBadge(r.status)}
    </div>
    <div class="card-meta">
      <span class="meta-item">🎓 ${r.studentName}</span>
      <span class="meta-item">📋 ${r.regNo}</span>
      <span class="meta-item">🏷️ Sec ${r.section || '—'}</span>
      <span class="meta-item">📅 ${r.examType}</span>
    </div>
    <div class="card-questions">Questions: ${r.questions}</div>
    <div class="card-footer">
      <span>ID: ${r.id}</span>
      <span>${formatDate(r.createdAt)}</span>
    </div>
  </div>`;
}

function openProfReview(id) {
  currentProfRequestId = id;
  const r = getRequests().find(x => x.id === id);
  if (!r) return;

  document.getElementById('prof-modal-sub').textContent =
    `${r.studentName} · ${r.regNo} · Sec ${r.section || '—'} · ${r.subject} · Submitted ${formatDate(r.createdAt)}`;

  document.getElementById('prof-request-detail').innerHTML = `
    <div class="detail-section">
      <h4>Student's Request</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>Student Name</label><span>${r.studentName}</span></div>
        <div class="detail-item"><label>Registration No.</label><span>${r.regNo}</span></div>
        <div class="detail-item"><label>Subject / Course</label><span>${r.subject}</span></div>
        <div class="detail-item"><label>Section</label><span>${r.section || '—'}</span></div>
        <div class="detail-item"><label>Exam Type</label><span>${r.examType}</span></div>
        <div class="detail-item"><label>Academic Term</label><span>${r.term || '—'}</span></div>
        <div class="detail-item"><label>Current Status</label><span>${getBadge(r.status)}</span></div>
        <div class="detail-item detail-full"><label>Questions to Re-Evaluate</label><span>${r.questions}</span></div>
        <div class="detail-item detail-full"><label>Student's Reason</label><span style="white-space:pre-wrap">${r.reason}</span></div>
      </div>
    </div>`;

  // A refund can't be undone, so once issued the result must stay "marks changed"
  const refundLocked = r.refund && (r.refund.status === 'pending' || r.refund.status === 'processed');
  Array.from(document.getElementById('p-status').options).forEach(o => {
    o.disabled = refundLocked && !REFUND_STATUSES.includes(o.value);
  });

  document.getElementById('p-marks').value = r.updatedMarks || '';
  document.getElementById('p-remarks').value = r.professorRemarks || '';
  document.getElementById('p-status').value = r.status !== 'Pending' ? r.status : 'Under Review';

  // Append read-only history timeline for faculty reference
  const existingTimeline = document.getElementById('prof-request-detail').querySelector('.history-timeline-wrap');
  if (existingTimeline) existingTimeline.remove();
  const timelineEl = document.createElement('div');
  timelineEl.innerHTML = renderHistoryTimeline(r);
  document.getElementById('prof-request-detail').appendChild(timelineEl);

  openModal('prof-review-modal');
}

async function submitProfReview() {
  const marks = document.getElementById('p-marks').value.trim();
  const remarks = document.getElementById('p-remarks').value.trim();
  const status = document.getElementById('p-status').value;
  if (!remarks) { showToast('Please enter remarks/explanation.', 'error'); return; }

  // Server mode: the server records the decision and issues any refund
  if (_serverMode) {
    const btn = document.querySelector('#prof-review-modal .form-actions .btn-primary');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = REFUND_STATUSES.includes(status) ? 'Saving & refunding...' : 'Saving...';
    try {
      const r = await postRequestAction(currentProfRequestId, 'review', {
        status, updatedMarks: marks, professorRemarks: remarks, by: currentUser.email,
      });
      closeModal('prof-review-modal');
      renderProfStats();
      renderProfRequests(currentProfTab);
      showToast('Decision saved and student notified.', 'success');
    } catch (err) {
      showToast('Could not save decision: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
    return;
  }

  const requests = getRequests();
  const idx = requests.findIndex(r => r.id === currentProfRequestId);
  if (idx === -1) return;

  const oldStatus = requests[idx].status;
  requests[idx].updatedMarks = marks || null;
  requests[idx].professorRemarks = remarks;
  requests[idx].status = status;
  requests[idx].reviewedAt = Date.now();
  if (!Array.isArray(requests[idx].history)) requests[idx].history = [];
  requests[idx].history.push({
    at: Date.now(),
    event: oldStatus === status ? 'Remarks updated' : 'Status changed',
    by: currentUser.email,
    from: oldStatus,
    to: status,
    note: remarks,
  });
  saveRequests(requests);

  closeModal('prof-review-modal');
  renderProfStats();
  renderProfRequests(currentProfTab);
  showToast('Decision saved and student notified.', 'success');
}

// ===== DEMO DATA =====
function loadDemoData() {
  // Use actual mapping entries for demo
  const demos = [
    {
      id: generateId(),
      studentEmail: 'student1@email.iimcal.ac.in',
      studentName: 'Ananya Bose',
      regNo: 'MBA24-0042',
      professorName: getProfRequests().length ? getProfRequests()[0]?.professorName : PROF_MAP[0].professor,
      subject: PROF_MAP[0].subject,
      section: PROF_MAP[0].sections[0],
      examType: 'End Term',
      term: 'Term 3, 2024-25',
      questions: 'Q2(b), Q4',
      reason: 'I believe Q2(b) was marked incorrectly — the formula I used yields the right answer by an alternate approach. For Q4, partial credit was not awarded for the correct methodology.',
      paymentFileName: 'payment_receipt.pdf',
      status: 'Pending',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      updatedMarks: null, professorRemarks: null,
    },
    {
      id: generateId(),
      studentEmail: 'student2@email.iimcal.ac.in',
      studentName: 'Rohan Mehta',
      regNo: 'MBA24-0089',
      professorName: PROF_MAP[8].professor,
      subject: PROF_MAP[8].subject,
      section: PROF_MAP[8].sections[0],
      examType: 'Mid Term',
      term: 'Term 2, 2024-25',
      questions: 'Q7(a), Q7(c), Q9',
      reason: 'The demand-supply analysis in Q7 was based on the correct model discussed in class. Q9 graphical answer was accurate.',
      paymentFileName: 'payment_proof.jpg',
      status: 'Pending',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      updatedMarks: null, professorRemarks: null,
    },
    {
      id: generateId(),
      studentEmail: 'student3@email.iimcal.ac.in',
      studentName: 'Priya Sharma',
      regNo: 'MBA24-0011',
      professorName: PROF_MAP[11].professor,
      subject: PROF_MAP[11].subject,
      section: PROF_MAP[11].sections[0],
      examType: 'End Term',
      term: 'Term 3, 2024-25',
      questions: 'Q1, Q3',
      reason: 'My interpretation of Q1 aligns with the framework covered in Week 6 slides. I am requesting a re-check of Q3 as well.',
      paymentFileName: 'receipt_scan.png',
      status: 'Under Review',
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      updatedMarks: null, professorRemarks: null,
    }
  ];

  const requests = getRequests();
  demos.forEach(d => requests.push(d));
  saveRequests(requests);
  renderProfStats();
  renderProfRequests(currentProfTab);
  showToast('Demo requests loaded!', 'success');
}

// ===== MODAL HELPERS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== SESSION RESTORE =====
window.addEventListener('DOMContentLoaded', async () => {
  // Load data from server (or localStorage fallback) before rendering anything
  await loadInitialData();
  await loadWindows();
  await loadPaymentConfig();

  const session = localStorage.getItem('reval_session');
  if (session) {
    try {
      currentUser = JSON.parse(session);
      openDashboardForRole();
    } catch { showPage('page-login'); }
  } else {
    showPage('page-login');
  }

  // Initialize Google Sign-In (GIS may still be loading due to async — use callback too)
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    initGoogleSignIn();
  }

  // Populate dev login panels
  populateCreds();
  populateAdminCreds();
});

// Called by GIS library once it finishes loading (handles the async defer case)
window.onGoogleLibraryLoad = initGoogleSignIn;

// ===== RE-EVALUATION WINDOWS =====
// Admins open a window for a subject + exam + term, optionally limited to sections, with opening and
// closing times (24 hours by default). Students can only raise requests while a window is open.
// A window with no sections covers every student of the subject and names its reviewing professor.
const ADMIN_ACCOUNTS = [
  { name: 'MBA Office', email: 'mbaoffice@email.iimcal.ac.in' },
  { name: 'Exam Cell', email: 'examcell@email.iimcal.ac.in' },
];
const ADMIN_EMAILS = ADMIN_ACCOUNTS.map(a => a.email);
const DEFAULT_EXAM_TYPES = ['Quiz', 'Mid Term', 'End Term'];
const ALL_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const WINDOW_LENGTH_MS = 24 * 60 * 60 * 1000;
const OTHER_OPTION = '__other';

let _windows = [];
let currentAdminTab = 'open';
let _editingWindowId = null;   // set while the window form edits an existing window

function getWindows() { return _windows; }

// Server first, localStorage when offline (same pattern as requests)
async function loadWindows() {
  if (_serverMode) {
    try {
      const res = await fetch('/api/windows', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        _windows = (await res.json()).windows || [];
        localStorage.setItem('reval_windows', JSON.stringify(_windows));
        return;
      }
    } catch { /* fall through to the local copy */ }
  }
  try { _windows = JSON.parse(localStorage.getItem('reval_windows') || '[]'); } catch { _windows = []; }
}

function saveWindowsLocally() {
  localStorage.setItem('reval_windows', JSON.stringify(_windows));
}

function windowEnd(w) {
  return w.closedAt ? Math.min(w.closedAt, w.endsAt) : w.endsAt;
}

// scheduled → open → closed (closed early when an admin ends it)
function windowStateOf(w, now = Date.now()) {
  if (w.closedAt && w.closedAt <= now) return 'closed';
  if (now < w.startsAt) return 'scheduled';
  if (now >= w.endsAt) return 'closed';
  return 'open';
}

function formatTimeLeft(ms) {
  if (ms <= 0) return '0m';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

function windowTitle(w) {
  return escapeHtml(w.subject) + (w.courseCode ? ` <span class="win-code">${escapeHtml(w.courseCode)}</span>` : '');
}

function sectionsLabel(w) {
  return w.sections && w.sections.length ? 'Sections ' + w.sections.join(', ') : 'All students (no sections)';
}

// Who reviews requests in this window: one professor per section, or the professor the admin named
function windowProfessors(w) {
  if (!w.sections || !w.sections.length) return [{ section: '', professor: w.professor || 'Not assigned' }];
  return w.sections.map(sec => ({ section: sec, professor: professorFor(w.subject, sec) || 'Not assigned' }));
}

function windowSummaryHtml(w) {
  return `<div class="win-summary-title">${windowTitle(w)}</div>
    <div class="win-meta">
      <span>📝 ${escapeHtml(w.examType)}</span>
      <span>📅 ${escapeHtml(w.term)}</span>
      <span>🏷️ ${sectionsLabel(w)}</span>
      <span>⏳ Closes ${formatDateTime(windowEnd(w))}</span>
    </div>`;
}

function requestsInWindow(id) {
  return getRequests().filter(r => r.windowId === id);
}

function hasAppliedInWindow(id) {
  return getRequests().some(r => r.windowId === id && r.studentEmail === currentUser.email);
}

// ----- Window details: opened by clicking any window card, for every role -----
function openWindowDetail(id) {
  const w = getWindows().find(x => x.id === id);
  if (!w) return;
  const now = Date.now();
  const state = windowStateOf(w, now);
  const role = currentUser && currentUser.role;
  const endedEarly = w.closedAt && w.closedAt < w.endsAt;
  const badge = { open: '● Open', scheduled: 'Scheduled', closed: endedEarly ? 'Ended early' : 'Closed' }[state];
  const timing = state === 'open' ? `closes in ${formatTimeLeft(windowEnd(w) - now)}`
    : state === 'scheduled' ? `opens in ${formatTimeLeft(w.startsAt - now)}`
    : `closed ${formatDateTime(windowEnd(w))}`;

  // "Prof. X — Sections B, C": group sections under each professor
  const byProf = new Map();
  windowProfessors(w).forEach(({ section, professor }) => {
    if (!byProf.has(professor)) byProf.set(professor, []);
    if (section) byProf.get(professor).push(section);
  });
  const profRows = [...byProf].map(([prof, secs]) => `
    <div class="wd-prof-row">
      <span class="wd-prof-name">👨‍🏫 ${escapeHtml(prof)}</span>
      <span class="wd-prof-secs">${secs.length ? (secs.length > 1 ? 'Sections ' : 'Section ') + secs.join(', ') : 'All students'}</span>
    </div>`).join('');

  const rows = [
    ['Course Code', w.courseCode ? escapeHtml(w.courseCode) : '—'],
    ['Type of Exam', escapeHtml(w.examType)],
    ['Term', escapeHtml(w.term)],
    ['Sections', w.sections.length ? w.sections.join(', ') : 'None — open to every student of the subject'],
    ['Opens', formatDateTime(w.startsAt)],
    ['Closes', formatDateTime(windowEnd(w))],
  ];
  if (role === 'admin') {
    rows.push(['Requests Received', String(requestsInWindow(w.id).length)]);
    rows.push(['Opened By', escapeHtml(w.createdBy || '—')]);
  } else if (role === 'professor') {
    const mine = requestsInWindow(w.id).filter(r => r.professorName === resolveProfessorName(currentUser.email)).length;
    rows.push(['Your Requests', String(mine)]);
  }

  let actions = '';
  if (role === 'student' && state === 'open') {
    actions = hasAppliedInWindow(w.id)
      ? '<button class="btn-secondary" disabled>✓ Applied</button>'
      : `<button class="btn-primary" onclick="closeModal('window-detail-modal'); showStudentForm('${w.id}')">Apply for Re-evaluation</button>`;
  } else if (role === 'admin' && state !== 'closed') {
    actions = `
      <button class="btn-secondary" onclick="closeModal('window-detail-modal'); endWindow('${w.id}')">${state === 'open' ? 'End now' : 'Cancel window'}</button>
      <button class="btn-primary" onclick="closeModal('window-detail-modal'); showWindowForm('${w.id}')">Edit Window</button>`;
  }

  document.getElementById('wd-title').innerHTML = windowTitle(w);
  document.getElementById('wd-sub').innerHTML = `<span class="win-badge win-badge-${state}">${badge}</span> ${timing}`;
  document.getElementById('wd-body').innerHTML = `
    <div class="detail-section">
      <h4>Window Details</h4>
      <div class="detail-grid">
        ${rows.map(([label, value]) => `<div class="detail-item"><label>${label}</label><span>${value}</span></div>`).join('')}
      </div>
    </div>
    <div class="detail-section">
      <h4>Professor${byProf.size > 1 ? 's' : ''}</h4>
      <div class="wd-profs">${profRows}</div>
    </div>
    ${actions ? `<div class="form-actions">${actions}</div>` : ''}`;
  openModal('window-detail-modal');
}

// ----- Student: "Open re-evaluation" section -----
function renderStudentOpenWindows() {
  const el = document.getElementById('student-open-windows');
  if (!el || !currentUser) return;
  const now = Date.now();
  const open = getWindows().filter(w => windowStateOf(w, now) === 'open').sort((a, b) => windowEnd(a) - windowEnd(b));
  const upcoming = getWindows().filter(w => windowStateOf(w, now) === 'scheduled').sort((a, b) => a.startsAt - b.startsAt);

  const cards = open.map(w => {
    const applied = hasAppliedInWindow(w.id);
    return `<div class="win-card" onclick="openWindowDetail('${w.id}')" title="View details">
      <div class="win-card-top">
        <div class="win-card-title">${windowTitle(w)}</div>
        <span class="win-badge win-badge-open">● Open</span>
      </div>
      <div class="win-meta">
        <span>📝 ${escapeHtml(w.examType)}</span>
        <span>📅 ${escapeHtml(w.term)}</span>
        <span>🏷️ ${sectionsLabel(w)}</span>
      </div>
      <div class="win-card-foot">
        <span class="win-countdown">⏳ Closes in ${formatTimeLeft(windowEnd(w) - now)}</span>
        ${applied
          ? '<button class="btn-secondary" disabled>✓ Applied</button>'
          : `<button class="btn-primary" onclick="event.stopPropagation(); showStudentForm('${w.id}')">Apply</button>`}
      </div>
    </div>`;
  }).join('');

  const upcomingHtml = upcoming.length
    ? `<div class="win-upcoming"><strong>Coming up:</strong> ${upcoming.map(w =>
        `<span class="win-upcoming-item" onclick="openWindowDetail('${w.id}')">${escapeHtml(w.subject)} · ${escapeHtml(w.examType)} — opens ${formatDateTime(w.startsAt)}</span>`).join('')}</div>`
    : '';

  el.innerHTML = `
    <div class="open-windows-head">
      <h3>Open re-evaluation</h3>
      <span>You can apply only while a window is open for your exam. Click a window for details.</span>
    </div>
    ${open.length ? `<div class="win-grid">${cards}</div>` : '<div class="win-empty">No re-evaluation windows are open right now.</div>'}
    ${upcomingHtml}`;
}

// ----- Professor: small "Re-evaluation Open" strip -----
function renderProfOpenWindows() {
  const el = document.getElementById('prof-open-windows');
  if (!el || !currentUser) return;
  const mine = getProfMapEntriesForUser();
  const profName = resolveProfessorName(currentUser.email);
  const now = Date.now();

  const rows = getWindows().filter(w => windowStateOf(w, now) === 'open').map(w => {
    let who;
    if (w.sections.length) {
      const sections = [...new Set(mine.filter(e => e.subject === w.subject).flatMap(e => e.sections))]
        .filter(sec => w.sections.includes(sec)).sort();
      if (!sections.length) return '';
      who = (sections.length > 1 ? 'Sections ' : 'Section ') + sections.join(', ');
    } else {
      if (w.professor !== profName) return '';
      who = 'All students';
    }
    const count = requestsInWindow(w.id).filter(r => r.professorName === profName).length;
    return `<div class="prof-win-row" onclick="openWindowDetail('${w.id}')" title="View details">
      <span class="win-badge win-badge-open">● Re-evaluation Open</span>
      <span class="prof-win-title">${windowTitle(w)} · ${escapeHtml(w.examType)} · ${escapeHtml(w.term)}</span>
      <span class="prof-win-meta">${who} · closes in ${formatTimeLeft(windowEnd(w) - now)} · ${count} request${count === 1 ? '' : 's'} so far</span>
    </div>`;
  }).filter(Boolean);

  el.innerHTML = rows.join('');
  el.style.display = rows.length ? '' : 'none';
}

// ----- Admin dashboard -----
function initAdminDashboard() {
  document.getElementById('admin-nav-user').textContent = 'Welcome, ' + currentUser.name;
  renderAdminDashboard();
}

function renderAdminDashboard() {
  renderAdminStats();
  renderAdminWindows(currentAdminTab);
}

function renderAdminStats() {
  const now = Date.now();
  const ws = getWindows();
  const stats = [
    { label: 'Open Now', val: ws.filter(w => windowStateOf(w, now) === 'open').length },
    { label: 'Scheduled', val: ws.filter(w => windowStateOf(w, now) === 'scheduled').length },
    { label: 'Closed', val: ws.filter(w => windowStateOf(w, now) === 'closed').length },
    { label: 'Requests Received', val: getRequests().filter(r => r.windowId).length },
  ];
  document.getElementById('admin-stats').innerHTML = stats.map(st =>
    `<div class="stat-card"><div class="stat-number">${st.val}</div><div class="stat-label">${st.label}</div></div>`
  ).join('');
}

function switchAdminTab(tab, el) {
  currentAdminTab = tab;
  document.querySelectorAll('#page-admin .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderAdminWindows(tab);
}

function renderAdminWindows(tab) {
  const now = Date.now();
  let ws = getWindows().slice();
  if (tab !== 'all') ws = ws.filter(w => windowStateOf(w, now) === tab);
  const order = { open: 0, scheduled: 1, closed: 2 };
  ws.sort((a, b) => (order[windowStateOf(a, now)] - order[windowStateOf(b, now)]) ||
    (windowStateOf(a, now) === 'closed' ? windowEnd(b) - windowEnd(a) : windowEnd(a) - windowEnd(b)));

  const grid = document.getElementById('admin-windows-grid');
  if (!ws.length) {
    const empty = { open: 'No windows are open right now.', scheduled: 'No windows are scheduled.', closed: 'No windows have closed yet.', all: 'No re-evaluation windows yet.' }[tab];
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🗓️</div><p>${empty}</p></div>`;
    return;
  }
  grid.innerHTML = ws.map(adminWindowCard).join('');
}

function adminWindowCard(w) {
  const now = Date.now();
  const state = windowStateOf(w, now);
  const count = requestsInWindow(w.id).length;
  const endedEarly = w.closedAt && w.closedAt < w.endsAt;
  const badge = { open: '● Open', scheduled: 'Scheduled', closed: endedEarly ? 'Ended early' : 'Closed' }[state];
  const timing = state === 'open' ? `Closes in ${formatTimeLeft(windowEnd(w) - now)}`
    : state === 'scheduled' ? `Opens in ${formatTimeLeft(w.startsAt - now)}`
    : `Closed ${formatDateTime(windowEnd(w))}`;
  const actions = state === 'closed' ? '' : `
    <span class="win-admin-actions">
      <button class="btn-secondary btn-end" onclick="event.stopPropagation(); showWindowForm('${w.id}')">Edit</button>
      <button class="btn-secondary btn-end" onclick="event.stopPropagation(); endWindow('${w.id}')">${state === 'open' ? 'End now' : 'Cancel'}</button>
    </span>`;

  return `<div class="request-card win-admin-card" onclick="openWindowDetail('${w.id}')" title="View details">
    <div class="card-top">
      <div class="card-subject">${windowTitle(w)}</div>
      <span class="win-badge win-badge-${state}">${badge}</span>
    </div>
    <div class="card-meta">
      <span class="meta-item">📝 ${escapeHtml(w.examType)}</span>
      <span class="meta-item">📅 ${escapeHtml(w.term)}</span>
      <span class="meta-item">🏷️ ${sectionsLabel(w)}</span>
    </div>
    <div class="win-times">
      <div><label>Opens</label><span>${formatDateTime(w.startsAt)}</span></div>
      <div><label>Closes</label><span>${formatDateTime(windowEnd(w))}</span></div>
    </div>
    <div class="win-admin-foot">
      <span>${timing} · ${count} request${count === 1 ? '' : 's'}</span>
      ${actions}
    </div>
  </div>`;
}

// ----- Admin: open / edit window form -----
function toLocalInput(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value) {
  return value ? new Date(value).getTime() : NaN;
}

// Built-in exam types plus any custom ones admins have used before
function examTypeOptions() {
  const custom = getWindows().map(w => w.examType)
    .filter(t => t && !DEFAULT_EXAM_TYPES.some(d => d.toLowerCase() === t.toLowerCase()));
  return [...DEFAULT_EXAM_TYPES, ...new Set(custom)];
}

function selectedWindowSubject() {
  const choice = document.getElementById('w-subject').value;
  return choice === OTHER_OPTION ? document.getElementById('w-subject-custom').value.trim() : choice;
}

function tickedSections() {
  return Array.from(document.querySelectorAll('#w-sections input:checked')).map(b => b.value);
}

const optionHtml = v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`;

// Opens the form empty (new window) or filled in from an existing one (edit)
function showWindowForm(editId) {
  const w = editId ? getWindows().find(x => x.id === editId) : null;
  if (editId && (!w || windowStateOf(w) === 'closed')) { showToast('A closed window can no longer be edited.', 'error'); return; }
  _editingWindowId = w ? w.id : null;
  document.getElementById('window-form').reset();

  // Subjects from the course mapping, plus any typed in for earlier windows, plus "other"
  const subjects = [...new Set([...getUniqueSubjects(), ...getWindows().map(x => x.subject)])];
  document.getElementById('w-subject').innerHTML = '<option value="">Select subject</option>' +
    subjects.map(optionHtml).join('') + `<option value="${OTHER_OPTION}">+ Other subject…</option>`;
  document.getElementById('w-examtype').innerHTML = '<option value="">Select type</option>' +
    examTypeOptions().map(optionHtml).join('') + `<option value="${OTHER_OPTION}">+ Add another type…</option>`;

  if (w) {
    document.getElementById('w-subject').value = w.subject;
    document.getElementById('w-code').value = w.courseCode || '';
    document.getElementById('w-examtype').value = w.examType;
    document.getElementById('w-term').value = w.term;
  }
  onWindowSubjectChange(w ? w.sections : []);
  onWindowExamTypeChange(false);
  if (w && !w.sections.length) document.getElementById('w-prof').value = w.professor || '';

  // Times: new windows open now for 24 hours; edits keep their own times
  const start = w ? w.startsAt : Math.floor(Date.now() / 60000) * 60000;
  const end = w ? w.endsAt : start + WINDOW_LENGTH_MS;
  document.getElementById('w-start').value = toLocalInput(start);
  document.getElementById('w-end').value = toLocalInput(end);
  document.getElementById('w-24h').checked = end - start === WINDOW_LENGTH_MS;
  onWindow24hChange();

  // After students apply, the exam they applied for is fixed (the server enforces the same rules)
  const applied = w ? requestsInWindow(w.id) : [];
  const locked = applied.length > 0;
  ['w-subject', 'w-subject-custom', 'w-examtype', 'w-examtype-custom', 'w-term', 'w-start', 'w-prof']
    .forEach(id => { document.getElementById(id).disabled = locked; });
  if (locked) {
    const usedSections = new Set(applied.map(r => r.section).filter(Boolean));
    document.querySelectorAll('#w-sections input').forEach(b => {
      if (!w.sections.length || usedSections.has(b.value)) b.disabled = true;
    });
  }
  const note = document.getElementById('w-lock-note');
  note.style.display = locked ? '' : 'none';
  note.textContent = locked
    ? `🔒 ${applied.length} student${applied.length === 1 ? ' has' : 's have'} already applied, so the subject, exam type, term, opening time and existing sections can't change. You can still edit the course code, add sections and move the closing time.`
    : '';

  document.getElementById('window-form-title').textContent = w ? 'Edit Re-evaluation Window' : 'Open Re-evaluation Window';
  document.getElementById('window-form-submit').textContent = w ? 'Save Changes' : 'Open Window';
  openModal('window-form-modal');
}

// Sections come from the course mapping; they're optional, and none means the whole subject
function onWindowSubjectChange(preselect) {
  const choice = document.getElementById('w-subject').value;
  const custom = choice === OTHER_OPTION;
  const customInput = document.getElementById('w-subject-custom');
  customInput.style.display = custom ? '' : 'none';
  customInput.required = custom;
  if (custom && preselect === undefined) customInput.focus();

  const subject = custom ? '' : choice;
  const available = new Set(getEntriesForSubject(subject).flatMap(e => e.sections));
  const ticked = new Set(Array.isArray(preselect) ? preselect : tickedSections());
  const picker = document.getElementById('w-sections');
  const hint = document.getElementById('w-sections-hint');

  if (!choice) {
    picker.innerHTML = '';
    hint.textContent = 'Select a subject to see its sections.';
  } else if (!available.size) {
    picker.innerHTML = '';
    hint.textContent = 'This subject has no sections, so every student taking it can apply. Choose the reviewing professor below.';
  } else {
    picker.innerHTML = ALL_SECTIONS.map(sec => `
      <label class="section-chip${available.has(sec) ? '' : ' disabled'}">
        <input type="checkbox" value="${sec}"${available.has(sec) ? '' : ' disabled'}${available.has(sec) && ticked.has(sec) ? ' checked' : ''} /> ${sec}
      </label>`).join('') +
      '<button type="button" class="btn-secondary btn-select-all" onclick="toggleAllSections()">Select all</button>';
    hint.textContent = 'Optional — leave all unticked if this exam isn\'t split by section; every student of the subject can then apply.' +
      (available.size < ALL_SECTIONS.length ? ' Greyed-out sections have no professor for this subject.' : '');
  }
  updateWindowProfessorField();
}

function onWindowSectionsChange() {
  updateWindowProfessorField();
}

function toggleAllSections() {
  const boxes = Array.from(document.querySelectorAll('#w-sections input:not(:disabled)'));
  const allOn = boxes.every(b => b.checked);
  boxes.forEach(b => { b.checked = !allOn; });
  updateWindowProfessorField();
}

// With no section ticked, the admin names the professor who reviews every request
function updateWindowProfessorField() {
  const group = document.getElementById('w-prof-group');
  const sel = document.getElementById('w-prof');
  const needed = !!document.getElementById('w-subject').value && tickedSections().length === 0;
  group.style.display = needed ? '' : 'none';
  sel.required = needed;
  if (!needed) return;

  const teaching = [...new Set(getEntriesForSubject(selectedWindowSubject()).map(e => e.professor))];
  const others = Object.keys(PROF_EMAILS).filter(p => !teaching.includes(p));
  const keep = sel.value;
  sel.innerHTML = '<option value="">Select professor</option>' +
    (teaching.length ? `<optgroup label="Teaches this subject">${teaching.map(optionHtml).join('')}</optgroup>` : '') +
    `<optgroup label="${teaching.length ? 'Other faculty' : 'Faculty'}">${others.map(optionHtml).join('')}</optgroup>`;
  if (keep) sel.value = keep;
}

function onWindowExamTypeChange(focus = true) {
  const custom = document.getElementById('w-examtype').value === OTHER_OPTION;
  const input = document.getElementById('w-examtype-custom');
  input.style.display = custom ? '' : 'none';
  input.required = custom;
  if (custom && focus) input.focus();
}

// With "24-hour window" ticked, the closing time follows the opening time
function onWindowStartChange() {
  if (document.getElementById('w-24h').checked) setWindowEndFromStart();
  updateWindowLength();
}

function onWindow24hChange() {
  const on = document.getElementById('w-24h').checked;
  document.getElementById('w-end').disabled = on;
  if (on) setWindowEndFromStart();
  updateWindowLength();
}

function setWindowEndFromStart() {
  const start = fromLocalInput(document.getElementById('w-start').value);
  if (Number.isFinite(start)) document.getElementById('w-end').value = toLocalInput(start + WINDOW_LENGTH_MS);
}

function updateWindowLength() {
  const start = fromLocalInput(document.getElementById('w-start').value);
  const end = fromLocalInput(document.getElementById('w-end').value);
  const el = document.getElementById('w-length');
  if (!Number.isFinite(start) || !Number.isFinite(end)) { el.textContent = ''; return; }
  if (end <= start) {
    el.textContent = '⚠️ The window must close after it opens.';
    el.style.color = 'var(--danger)';
    return;
  }
  const hours = Math.round((end - start) / 360000) / 10;
  el.textContent = `Window length: ${hours} hour${hours === 1 ? '' : 's'}` +
    (start > Date.now() + 60000 ? ' · opens in ' + formatTimeLeft(start - Date.now()) : '');
  el.style.color = '';
}

async function submitWindowForm(e) {
  e.preventDefault();
  const typeChoice = document.getElementById('w-examtype').value;
  const examType = typeChoice === OTHER_OPTION ? document.getElementById('w-examtype-custom').value.trim() : typeChoice;
  const sections = tickedSections();
  const editing = _editingWindowId;
  const payload = {
    subject: selectedWindowSubject(),
    courseCode: document.getElementById('w-code').value.trim(),
    examType,
    sections,
    professor: sections.length ? '' : document.getElementById('w-prof').value,
    term: document.getElementById('w-term').value.trim(),
    startsAt: fromLocalInput(document.getElementById('w-start').value),
    endsAt: fromLocalInput(document.getElementById('w-end').value),
    [editing ? 'updatedBy' : 'createdBy']: currentUser.email,
  };
  if (!payload.subject) { showToast('Please choose or enter the subject.', 'error'); return; }
  if (!examType) { showToast('Please choose or enter the type of exam.', 'error'); return; }
  if (!payload.term) { showToast('Please enter the term.', 'error'); return; }
  if (!sections.length && !payload.professor) { showToast('No section is selected, so please choose the reviewing professor.', 'error'); return; }
  if (!(payload.endsAt > payload.startsAt)) { showToast('The window must close after it opens.', 'error'); return; }
  if (payload.endsAt <= Date.now()) { showToast('The closing time is already in the past.', 'error'); return; }

  let saved;
  if (_serverMode) {
    try {
      const res = await fetch(editing ? `/api/windows/${encodeURIComponent(editing)}` : '/api/windows', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the window');
      saved = data.window;
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
  } else if (editing) {
    saved = { ...getWindows().find(x => x.id === editing), ...payload };
  } else {
    saved = { id: 'WIN-' + Date.now().toString(36).toUpperCase(), ...payload, closedAt: null, createdAt: Date.now() };
  }

  const idx = _windows.findIndex(x => x.id === saved.id);
  if (idx === -1) _windows.push(saved); else _windows[idx] = saved;
  saveWindowsLocally();
  _editingWindowId = null;

  closeModal('window-form-modal');
  const state = windowStateOf(saved);
  const tabIndex = { open: 0, scheduled: 1, closed: 2 }[state];
  switchAdminTab(state, document.querySelectorAll('#page-admin .tab')[tabIndex]);
  renderAdminStats();
  showToast(editing ? 'Changes saved.'
    : state === 'open' ? `Re-evaluation window opened for ${saved.subject} · ${saved.examType}.`
    : `Window scheduled — opens ${formatDateTime(saved.startsAt)}.`, 'success');
}

async function endWindow(id) {
  const w = getWindows().find(x => x.id === id);
  if (!w) return;
  const verb = windowStateOf(w) === 'open' ? 'End' : 'Cancel';
  if (!confirm(`${verb} the re-evaluation window for ${w.subject} · ${w.examType} now? Students will no longer be able to apply.`)) return;

  if (_serverMode) {
    try {
      const res = await fetch(`/api/windows/${encodeURIComponent(id)}/close`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not end the window');
      Object.assign(w, data.window);
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
  } else {
    w.closedAt = Date.now();
  }
  saveWindowsLocally();
  renderAdminDashboard();
  showToast('Window closed.', 'success');
}

// ----- Routing and refresh -----
function openDashboardForRole() {
  if (currentUser.role === 'admin') {
    showPage('page-admin');
    initAdminDashboard();
  } else if (currentUser.role === 'professor') {
    showPage('page-professor');
    initProfDashboard();
  } else {
    showPage('page-student');
    initStudentDashboard();
  }
}

// Every 30s: pick up windows opened elsewhere and keep countdowns current
setInterval(async () => {
  if (!currentUser) return;
  await loadWindows();
  if (currentUser.role === 'admin') {
    if (_serverMode) await loadInitialData();
    renderAdminDashboard();
  } else if (currentUser.role === 'professor') {
    renderProfOpenWindows();
  } else {
    renderStudentOpenWindows();
  }
}, 30000);

// ===== FACULTY TEST CREDENTIALS PANEL (DEV MODE) =====
function populateCreds() {
  const container = document.getElementById('creds-entries');
  if (!container) return;
  container.innerHTML = Object.entries(PROF_EMAILS).map(([name, email]) => `
    <div class="cred-row">
      <span class="cred-name">${name.replace('Prof. ', '')}</span>
      <span class="cred-email" title="Click to log in as ${name}" onclick="testLoginAsFaculty('${email}', '${name}')">${email}</span>
    </div>`).join('');
}

// DEV: dummy admin accounts
function populateAdminCreds() {
  const container = document.getElementById('admin-creds-entries');
  if (!container) return;
  container.innerHTML = ADMIN_ACCOUNTS.map(a => `
    <div class="cred-row">
      <span class="cred-name">${a.name}</span>
      <span class="cred-email" title="Click to log in as ${a.name}" onclick="testLoginAsAdmin('${a.email}', '${a.name}')">${a.email}</span>
    </div>`).join('');
}

function testLoginAsAdmin(email, name) {
  currentUser = { email: email.toLowerCase(), name, role: 'admin', picture: '' };
  localStorage.setItem('reval_session', JSON.stringify(currentUser));
  openDashboardForRole();
  showToast('DEV login: ' + name, 'info');
}

function testLoginAsFaculty(email, name) {
  currentUser = { email: email.toLowerCase(), name: name, role: 'professor', picture: '' };
  localStorage.setItem('reval_session', JSON.stringify(currentUser));
  showPage('page-professor');
  initProfDashboard();
  showToast('DEV login: ' + name, 'info');
}

function fillEmail() { }

function toggleCreds(btn) {
  const list = btn.parentElement.querySelector('.creds-list');
  const arrow = btn.querySelector('.creds-arrow');
  const isOpen = list.style.display !== 'none';
  list.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '▼' : '▲';
}


// ============================================================
//  ✨  IIMC QUIRKY FEATURES
// ============================================================

// ===== 1. JOKA WISDOM — rotating quotes =====
const JOKA_QUOTES = [
  "In Joka, even the night before end-term is a strategy session.",
  "The McKinsey dream starts at 4 AM in Joka.",
  "Sleep is a pre-term luxury. Post-term, you rediscover it.",
  "Joka teaches you to present a half-baked idea with full conviction.",
  "Section rivalry: the only thing sharper than the case competition.",
  "Your GPA is confidential. Your stress levels are not.",
  "In Joka, peaceful is a strategy, not a personality.",
  "Day 0 placement? Already on the slide deck at orientation.",
  "The case method: learn to have opinions before reading the case.",
  "IIMC — where 8 AM classes feel like a punishment from the industry.",
  "Feedback session: where every professor becomes a mirror.",
  "Joka fog is just the campus hiding your semester GPA.",
  "Networking event = free dinner + 47 LinkedIn requests.",
  "The best course correction happens at the viva voce.",
];

let _quoteIndex = 0;
let _quoteInterval = null;

function startQuoteRotation() {
  const el = document.getElementById('joka-quote');
  if (!el) return;
  _quoteIndex = Math.floor(Math.random() * JOKA_QUOTES.length);
  el.textContent = JOKA_QUOTES[_quoteIndex];
  el.style.opacity = '1';
  _quoteInterval = setInterval(() => {
    el.style.opacity = '0';
    setTimeout(() => {
      _quoteIndex = (_quoteIndex + 1) % JOKA_QUOTES.length;
      el.textContent = JOKA_QUOTES[_quoteIndex];
      el.style.opacity = '1';
    }, 500);
  }, 5000);
}

// ===== 2 & 3. SECTION RIVALRY + IIMC LINGO TOASTS =====
const SECTION_LINES = {
  A: "Section A strikes again — naturally.",
  B: "Section B represent! Bold move.",
  C: "Section C in the building. They mean business.",
  D: "Section D rising. Underdogs no more.",
  E: "Section E — the dark horse gallops.",
  F: "Section F — saving the best for last.",
};
const LINGO_SUCCESS = [
  "Request in the funnel!",
  "Submitted! The ball is in the prof's court.",
  "Done deal. Now we wait... peacefully.",
  "Your case is on the table. Time to network.",
];

function jokaToast(type, section) {
  let msg = '';
  if (type === 'submit') {
    msg = LINGO_SUCCESS[Math.floor(Math.random() * LINGO_SUCCESS.length)];
    if (section && SECTION_LINES[section]) msg += ' ' + SECTION_LINES[section];
  }
  if (msg) showToast(msg, 'success');
}

// ===== 4. DEADLINE COUNTDOWN TIMER =====
let _countdownInterval = null;

function startFormCountdown() {
  const el = document.getElementById('form-countdown');
  if (!el) return;
  if (_countdownInterval) clearInterval(_countdownInterval);
  function tick() {
    const rem = _formWindow ? windowEnd(_formWindow) - Date.now() : 0;
    if (rem <= 0) {
      el.textContent = 'WINDOW CLOSED';
      el.style.color = '#b83232';
      clearInterval(_countdownInterval);
      return;
    }
    const hrs = Math.floor(rem / 3600000);
    const mins = Math.floor((rem % 3600000) / 60000);
    const secs = Math.floor((rem % 60000) / 1000);
    el.textContent = hrs + 'h ' + mins + 'm ' + secs + 's';
    el.style.color = hrs < 2 ? '#b83232' : '#C9A84C';
  }
  tick();
  _countdownInterval = setInterval(tick, 1000);
}

function stopFormCountdown() {
  if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
}

// ===== 5. TERM-AWARE GREETING =====
function getTermGreeting() {
  const m = new Date().getMonth();
  if (m <= 1) return "Surviving Term 4 already? You are tougher than the case.";
  if (m <= 3) return "Term 3 closing in... every mark counts now.";
  if (m <= 5) return "Summer internship szn — but grades wait for no one.";
  if (m <= 7) return "Term 1 warriors — Joka fog greets you.";
  if (m <= 9) return "Term 2 grind is real. Stay peaceful.";
  return "End-term season: where legends are made (or re-evaluated).";
}

// ===== 6. PEACEFUL MODE TOGGLE =====
let _peacefulMode = false;
const PEACEFUL_LABELS = ['Total Battles', 'Awaiting Verdict', 'In The Funnel', 'Case Closed'];
const NORMAL_LABELS = ['Total Requests', 'Pending', 'Under Review', 'Resolved'];

function togglePeaceful() {
  _peacefulMode = !_peacefulMode;
  ['peaceful-toggle-student', 'peaceful-toggle-prof'].forEach(function (id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = _peacefulMode ? 'Intense' : 'Peaceful';
    btn.classList.toggle('peaceful-active', _peacefulMode);
  });
  if (currentUser && currentUser.role === 'student') {
    renderStudentStats();
    showToast(_peacefulMode ? 'Peaceful mode. Breathe.' : 'Intense mode. Grind on.', 'info');
  } else if (currentUser && currentUser.role === 'professor') {
    renderProfStats();
    showToast(_peacefulMode ? 'Peaceful mode activated.' : 'Back to decision mode.', 'info');
  }
}

const _baseRenderStudentStats = renderStudentStats;
renderStudentStats = function () {
  const all = getRequests().filter(function (r) { return r.studentEmail === (currentUser && currentUser.email); });
  const labels = _peacefulMode ? PEACEFUL_LABELS : NORMAL_LABELS;
  const stats = [
    { label: labels[0], val: all.length },
    { label: labels[1], val: all.filter(function (r) { return r.status === 'Pending'; }).length },
    { label: labels[2], val: all.filter(function (r) { return r.status === 'Under Review'; }).length },
    { label: labels[3], val: all.filter(function (r) { return r.status.startsWith('Resolved'); }).length },
  ];
  document.getElementById('student-stats').innerHTML = stats.map(function (s) {
    return '<div class="stat-card"><div class="stat-number">' + s.val + '</div><div class="stat-label">' + s.label + '</div></div>';
  }).join('');
};

const _baseRenderProfStats = renderProfStats;
renderProfStats = function () {
  const all = getProfRequests();
  const labels = _peacefulMode ? PEACEFUL_LABELS : NORMAL_LABELS;
  const stats = [
    { label: labels[0], val: all.length },
    { label: labels[1], val: all.filter(function (r) { return r.status === 'Pending'; }).length },
    { label: labels[2], val: all.filter(function (r) { return r.status === 'Under Review'; }).length },
    { label: labels[3], val: all.filter(function (r) { return r.status.startsWith('Resolved'); }).length },
  ];
  document.getElementById('prof-stats').innerHTML = stats.map(function (s) {
    return '<div class="stat-card"><div class="stat-number">' + s.val + '</div><div class="stat-label">' + s.label + '</div></div>';
  }).join('');
};

// ===== 7. PGP BATCH PRIDE =====
function getBatchFromEmail(email) {
  const prefix = (email || '').split('@')[0];
  const pMatch = prefix.match(/^p(\d{2})/i);
  if (pMatch) return "PGP '" + pMatch[1];
  const yMatch = prefix.match(/^(20\d{2})/);
  if (yMatch) return 'Batch of ' + yMatch[1];
  return null;
}

// ===== 8. DESPERATION INDEX =====
const DESP_LEVELS = [
  { max: 0, label: '—', pct: 0, color: '#b09070' },
  { max: 1, label: 'Hopeful', pct: 20, color: '#2a7a3b' },
  { max: 2, label: 'Determined', pct: 40, color: '#C9A84C' },
  { max: 3, label: 'Concerned', pct: 60, color: '#9a6c10' },
  { max: 4, label: 'Full Joka Mode', pct: 80, color: '#b83232' },
  { max: 99, label: 'SEND HELP', pct: 100, color: '#5D2E0C' },
];

function updateDesperationIndex() {
  const val = (document.getElementById('f-questions') ? document.getElementById('f-questions').value : '').trim();
  const wrap = document.getElementById('desperation-wrap');
  const text = document.getElementById('desperation-text');
  const fill = document.getElementById('desperation-fill');
  if (!wrap || !text || !fill) return;
  if (!val) { wrap.style.display = 'none'; return; }
  const count = val.split(',').filter(function (s) { return s.trim(); }).length;
  wrap.style.display = 'block';
  const lvl = DESP_LEVELS.find(function (l) { return count <= l.max; }) || DESP_LEVELS[DESP_LEVELS.length - 1];
  text.textContent = lvl.label;
  fill.style.width = lvl.pct + '%';
  fill.style.background = lvl.color;
}

// ===== WRAP EXISTING FUNCTIONS =====
const _baseShowStudentForm = showStudentForm;
showStudentForm = function (windowId) {
  if (!_baseShowStudentForm(windowId)) return;
  startFormCountdown();
  const wrap = document.getElementById('desperation-wrap');
  if (wrap) wrap.style.display = 'none';
};

const _baseCloseModal = closeModal;
closeModal = function (id) {
  _baseCloseModal(id);
  if (id === 'student-form-modal') stopFormCountdown();
};

const _baseInitStudentDashboard = initStudentDashboard;
initStudentDashboard = function () {
  _baseInitStudentDashboard();
  const batch = getBatchFromEmail(currentUser && currentUser.email);
  const termMsg = getTermGreeting();
  const sep = batch ? ' | ' : '';
  document.getElementById('student-welcome').textContent = termMsg + sep + (batch || '');
  const badge = document.getElementById('student-batch-badge');
  if (badge) { badge.textContent = batch || ''; badge.style.display = batch ? 'inline' : 'none'; }
};

document.addEventListener('DOMContentLoaded', startQuoteRotation);
