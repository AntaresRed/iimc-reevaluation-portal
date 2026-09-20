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

// ===== CASCADING FORM DROPDOWN LOGIC =====
function populateSubjectDropdown() {
  const sel = document.getElementById('f-subject');
  sel.innerHTML = '<option value="">Select subject</option>';
  getUniqueSubjects().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
}

function onSubjectChange() {
  const subject = document.getElementById('f-subject').value;
  const profSel = document.getElementById('f-prof');
  const examSel = document.getElementById('f-examtype');
  const secSel = document.getElementById('f-section');

  // Reset downstream
  profSel.innerHTML = '<option value="">Select professor</option>';
  secSel.innerHTML = '<option value="">Select professor first</option>';
  examSel.innerHTML = '<option value="">Select subject first</option>';

  if (!subject) return;

  // Populate professors for this subject
  const entries = getEntriesForSubject(subject);
  const seenProfs = new Set();
  entries.forEach(e => {
    if (!seenProfs.has(e.professor)) {
      seenProfs.add(e.professor);
      const opt = document.createElement('option');
      opt.value = e.professor; opt.textContent = e.professor;
      profSel.appendChild(opt);
    }
  });

  // Populate exam types based on term coverage
  const coverage = getTermCoverageForSubject(subject);
  if (coverage === 'PostMid') {
    examSel.innerHTML = '<option value="End Term">End Term</option>';
  } else {
    examSel.innerHTML = '<option value="">Select exam type</option><option value="Mid Term">Mid Term</option><option value="End Term">End Term</option>';
  }

  // If reg number is already filled, auto-fill professor + section
  const regNo = document.getElementById('f-regno').value.trim();
  const section = getSectionFromRegNo(regNo);
  if (section) autoFillFromSectionAndSubject(section, subject);
}

function onProfChange() {
  const subject = document.getElementById('f-subject').value;
  const prof = document.getElementById('f-prof').value;
  const secSel = document.getElementById('f-section');

  secSel.innerHTML = '<option value="">Select section</option>';
  if (!prof || !subject) return;

  // Find the specific entry for this prof + subject combination
  const entry = PROF_MAP.find(e => e.professor === prof && e.subject === subject);
  if (!entry) return;

  entry.sections.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = 'Section ' + s;
    secSel.appendChild(opt);
  });

  // Auto-select if only one section
  if (entry.sections.length === 1) {
    secSel.value = entry.sections[0];
  }
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
  const subject = document.getElementById('f-subject').value;

  // Remove any previous hint
  const existing = document.getElementById('regno-hint');
  if (existing) existing.remove();

  if (!section) return;

  // Show a subtle inline hint
  const hintEl = document.createElement('div');
  hintEl.id = 'regno-hint';
  hintEl.style.cssText = 'font-size:12px; color:#C9A84C; margin-top:4px;';
  hintEl.textContent = `🏷️ Detected: Section ${section}`;
  document.getElementById('f-regno').parentNode.appendChild(hintEl);

  // If subject is already selected, auto-fill professor and section
  if (subject) {
    autoFillFromSectionAndSubject(section, subject);
  }
}

function autoFillFromSectionAndSubject(section, subject) {
  const profSel = document.getElementById('f-prof');
  const secSel = document.getElementById('f-section');

  // Find the mapping entry for this subject + section
  const entry = PROF_MAP.find(e => e.subject === subject && e.sections.includes(section));
  if (!entry) return;

  // Set professor dropdown (make sure the option exists)
  const profOption = Array.from(profSel.options).find(o => o.value === entry.professor);
  if (profOption) {
    profSel.value = entry.professor;
    // Trigger section population
    onProfChange();
    // Then set the section
    secSel.value = section;
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
    const role = EMAIL_TO_PROF[email] ? 'professor' : 'student';

    currentUser = { email, name, role, picture };
    localStorage.setItem('reval_session', JSON.stringify(currentUser));
    localStorage.setItem('reval_last_email', email);

    if (role === 'student') {
      showPage('page-student');
      applyUserTheme();
      initStudentDashboard();
    } else {
      showPage('page-professor');
      applyUserTheme();
      initProfDashboard();
    }
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
  populateSubjectDropdown();
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
function showStudentForm() {
  document.getElementById('reval-form').reset();
  // Re-seed subject dropdown after reset
  populateSubjectDropdown();
  // Reset cascading selects
  ['f-prof', 'f-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Select subject first</option>';
  });
  document.getElementById('f-examtype').innerHTML = '<option value="">Select subject first</option>';
  document.getElementById('docs-upload-content').innerHTML = `
    <span class="file-upload-icon">🗂️</span>
    <p>Upload answer scripts, screenshots or any supporting evidence</p>
    <span class="file-upload-hint">JPG, PNG, PDF or Word • Multiple files • Max 5MB each</span>`;
  document.getElementById('docs-upload-area').classList.remove('has-file');
  resetPaymentSection();
  openModal('student-form-modal');
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
  const payment = await getPaymentForSubmission();
  if (!payment.ok) return;
  const section = document.getElementById('f-section').value;
  if (!section) { showToast('Please select your section.', 'error'); return; }

  // ── Upload files to Cloudinary if configured ──
  const submitBtn = document.querySelector('#reval-form .btn-primary');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;

  let paymentUrl = null;
  let supportingDocUrls = [], supportingDocNames = [];

  try {
    if (CLOUDINARY_ENABLED) {

      const docFiles = Array.from(document.getElementById('f-docs').files || []);
      for (let i = 0; i < docFiles.length; i++) {
        submitBtn.textContent = `Uploading docs (${i + 1}/${docFiles.length})...`;
        supportingDocUrls.push(await uploadToCloudinary(docFiles[i]));
        supportingDocNames.push(docFiles[i].name);
      }
    } else {
      // Cloudinary not configured — store filenames only
      supportingDocNames = Array.from(document.getElementById('f-docs').files || []).map(f => f.name);
    }
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    showToast('File upload failed: ' + err.message, 'error');
    return;
  }

  submitBtn.textContent = 'Saving...';

  const request = {
    id: generateId(),
    studentEmail: currentUser.email,
    studentName: document.getElementById('f-name').value.trim(),
    regNo: document.getElementById('f-regno').value.trim(),
    professorName: document.getElementById('f-prof').value,
    subject: document.getElementById('f-subject').value,
    section: section,
    examType: document.getElementById('f-examtype').value,
    term: document.getElementById('f-term').value.trim(),
    questions: document.getElementById('f-questions').value.trim(),
    reason: document.getElementById('f-reason').value.trim(),
    ...payment.fields,
    paymentUrl,                      // null if Cloudinary not configured
    supportingDocs: supportingDocNames,
    supportingDocUrls,               // [] if Cloudinary not configured
    status: 'Pending',
    createdAt: Date.now(),
    updatedMarks: null,
    professorRemarks: null,
    history: [
      { at: Date.now(), event: 'Submitted', by: currentUser.email, note: '' }
    ],
  };

  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);

  submitBtn.disabled = false;
  submitBtn.textContent = originalLabel;
  closeModal('student-form-modal');
  renderStudentStats();
  switchStudentTab('pending', document.querySelector('#page-student .tab'));
  showToast(`Request ${request.id} submitted successfully!`, 'success');
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
  await loadPaymentConfig();

  const session = localStorage.getItem('reval_session');
  if (session) {
    try {
      currentUser = JSON.parse(session);
      if (currentUser.role === 'student') {
        showPage('page-student');
        initStudentDashboard();
      } else {
        showPage('page-professor');
        initProfDashboard();
      }
    } catch { showPage('page-login'); }
  } else {
    showPage('page-login');
  }

  // Initialize Google Sign-In (GIS may still be loading due to async — use callback too)
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    initGoogleSignIn();
  }

  // Populate dev faculty login panel
  populateCreds();
});

// Called by GIS library once it finishes loading (handles the async defer case)
window.onGoogleLibraryLoad = initGoogleSignIn;

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

function testLoginAsFaculty(email, name) {
  currentUser = { email: email.toLowerCase(), name: name, role: 'professor', picture: '' };
  localStorage.setItem('reval_session', JSON.stringify(currentUser));
  showPage('page-professor');
  initProfDashboard();
  showToast('DEV login: ' + name, 'info');
}

function fillEmail() { }

function toggleCreds(btn) {
  const list = document.getElementById('creds-list');
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
const RESULT_DECLARED_AT = Date.now() - (18 * 60 * 60 * 1000);
const DEADLINE_DURATION = 24 * 60 * 60 * 1000;

function startFormCountdown() {
  const el = document.getElementById('form-countdown');
  if (!el) return;
  if (_countdownInterval) clearInterval(_countdownInterval);
  function tick() {
    const rem = (RESULT_DECLARED_AT + DEADLINE_DURATION) - Date.now();
    if (rem <= 0) {
      el.textContent = 'DEADLINE PASSED';
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
showStudentForm = function () {
  _baseShowStudentForm();
  startFormCountdown();
  const wrap = document.getElementById('desperation-wrap');
  if (wrap) wrap.style.display = 'none';
};

const _baseCloseModal = closeModal;
closeModal = function (id) {
  _baseCloseModal(id);
  if (id === 'student-form-modal') stopFormCountdown();
};

const _baseSubmitRevalForm = submitRevalForm;
submitRevalForm = async function (e) {
  e.preventDefault();
  const payment = await getPaymentForSubmission();
  if (!payment.ok) return;
  const section = document.getElementById('f-section').value;
  if (!section) { showToast('Please select your section.', 'error'); return; }
  const request = {
    id: generateId(),
    studentEmail: currentUser.email,
    studentName: document.getElementById('f-name').value.trim(),
    regNo: document.getElementById('f-regno').value.trim(),
    professorName: document.getElementById('f-prof').value,
    subject: document.getElementById('f-subject').value,
    section: section,
    examType: document.getElementById('f-examtype').value,
    term: document.getElementById('f-term').value.trim(),
    questions: document.getElementById('f-questions').value.trim(),
    reason: document.getElementById('f-reason').value.trim(),
    ...payment.fields,
    status: 'Pending',
    createdAt: Date.now(),
    updatedMarks: null,
    professorRemarks: null,
  };
  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);
  stopFormCountdown();
  closeModal('student-form-modal');
  renderStudentStats();
  switchStudentTab('pending', document.querySelector('#page-student .tab'));
  jokaToast('submit', section);
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
