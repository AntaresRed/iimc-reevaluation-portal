// ===== SUPABASE =====
// Sign-in and (soon) all portal data. The anon key is public by design: what each signed-in
// person may read or change is decided by the database's row level security, not by this page.
// Google sign-in runs through Supabase (Authentication → Providers → Google).
const SUPABASE_URL = 'https://ynunqwmrkypuvargceen.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludW5xd21ya3lwdXZhcmdjZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjM5MTYsImV4cCI6MjEwNTczOTkxNn0.5L8iXBgMPGWGO9AAjqu6fDYfNdohgaEwqg5N9oAiYM8';

const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// The [DEV] login panels sign in the dummy MBA office and faculty accounts, which have no real
// Google account, with a password (see "[DEV] TEST ACCOUNTS" near the end). Remove before real use.

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

// ===== DATA — everything lives in Supabase =====
// The page reads and writes the database directly with the signed-in person's session.
// What each person may see or change is decided there (row level security and triggers),
// so these functions only move data; the rules live in supabase/01_schema.sql.
// Reads fill in-memory caches, so rendering never has to wait.
let _cache = [];              // requests the signed-in person may see
let _uploadProgress = null;   // set while a submission is uploading its photos

function getRequests() { return _cache; }

// Database timestamps as the milliseconds the rest of the page works with
function ms(ts) {
  return ts ? Date.parse(ts) : null;
}

// The database explains a refusal in its own words; show those, not the plumbing around them
function dbMessage(error) {
  const text = (error && error.message) || 'Something went wrong.';
  if (/JWT|not authenticated|permission denied/i.test(text)) return 'Your session has expired. Please sign in again.';
  return text;
}

const REQUEST_SELECT = '*, ' +
  'question_items(id, position, question, reason, photo_count, question_photos(id, position, file_name, drive_id)), ' +
  'request_history(at, event, by_email, from_status, to_status, note)';

function requestFromRow(row) {
  const byPosition = (a, b) => a.position - b.position;
  const items = (row.question_items || []).slice().sort(byPosition).map(q => ({
    id: q.id,
    question: q.question,
    reason: q.reason,
    photos: (q.question_photos || []).slice().sort(byPosition).map(p => ({ name: p.file_name, driveId: p.drive_id })),
    photoCount: q.photo_count || 0,
  }));
  const names = row.professor_names || [];
  const resolved = String(row.status).startsWith('Resolved');
  return {
    id: row.id,
    windowId: row.window_id,
    studentEmail: row.student_email,
    studentName: row.student_name,
    regNo: row.reg_no,
    section: row.section || '',
    professorNames: names,
    professorName: names.join(' & '),
    subject: row.subject,
    courseCode: row.course_code || '',
    examType: row.exam_type,
    term: row.term,
    questions: items.map(q => q.question).join(', '),
    questionItems: items,
    status: row.status,
    questionMarks: row.question_marks || null,
    originalMarks: row.original_marks,
    updatedMarks: row.updated_marks,
    professorRemarks: row.professor_remarks,
    createdAt: ms(row.created_at),
    reviewedAt: ms(row.reviewed_at),
    resolvedAt: resolved ? ms(row.reviewed_at) : null,
    photosDeletedAt: ms(row.photos_deleted_at),
    photoCountBeforeDeletion: row.photo_count_before_deletion || 0,
    history: (row.request_history || []).slice().sort((a, b) => ms(a.at) - ms(b.at)).map(h => ({
      at: ms(h.at), event: h.event, by: h.by_email, from: h.from_status, to: h.to_status, note: h.note,
    })),
  };
}

// Is this professor one of the people deciding the request? (Co-taught sections have two.)
function isRequestFor(r, profName) {
  return Boolean(profName) && (r.professorNames || []).includes(profName);
}

async function refreshRequests() {
  if (!sb || !currentUser) return false;
  const { data, error } = await sb.from('requests').select(REQUEST_SELECT).order('created_at', { ascending: false });
  if (error) { console.error('[Data] Requests:', error.message); return false; }
  _cache = data.map(requestFromRow);
  return true;
}

// Re-read one request after changing it, so the page shows exactly what was stored
async function reloadRequest(id) {
  const { data, error } = await sb.from('requests').select(REQUEST_SELECT).eq('id', id).single();
  if (error) throw new Error(dbMessage(error));
  const fresh = requestFromRow(data);
  const idx = _cache.findIndex(x => x.id === id);
  if (idx === -1) _cache.unshift(fresh); else _cache[idx] = fresh;
  return fresh;
}

// A new request. The database checks the window is open, the section belongs to it, the
// student hasn't applied already and isn't deactivated, and copies the exam details and
// professors from the window. Photos then go to Drive, one at a time, and are recorded.
// Returns { request, photoProblem }: the request stands even if a photo could not be stored.
async function submitNewRequest(form) {
  const { data: id, error } = await sb.rpc('submit_request', {
    p_window_id: form.windowId,
    p_student_name: form.studentName,
    p_reg_no: form.regNo,
    p_section: form.section,
    p_items: form.items.map(q => ({ question: q.question, reason: q.reason })),
  });
  if (error) throw new Error(dbMessage(error));

  let request = await reloadRequest(id);
  let photoProblem = '';
  if (form.items.some(q => q.photos.length)) {
    try {
      await uploadRequestPhotos(request, form.items, _uploadProgress);
    } catch (e) {
      photoProblem = e.message;
    }
    request = await reloadRequest(id);
  }
  return { request, photoProblem };
}

// The professor's decision. The database works out the status from the marks.
async function saveReview(id, questionMarks) {
  const { data, error } = await sb.from('requests')
    .update({ question_marks: questionMarks, status: 'Resolved - No Change' })
    .eq('id', id)
    .select('id');
  if (error) throw new Error(dbMessage(error));
  if (!data || !data.length) throw new Error('You can only decide requests for your own sections.');
  return reloadRequest(id);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== QUESTION CARDS =====
// One card per question: its number, why it should be re-evaluated, and photos of that answer.
// Photos are shrunk in the browser before upload so a phone picture doesn't weigh 8 MB.
const MAX_QUESTIONS = 10;
const MAX_PHOTOS_PER_QUESTION = 3;
const PHOTO_MAX_EDGE = 1600;

let _questionSeq = 0;
const _questionPhotos = new Map();   // card id → [{ dataUrl, name }]

function questionCards() {
  return Array.from(document.querySelectorAll('#q-list .q-card'));
}

function renumberQuestionCards() {
  questionCards().forEach((card, i) => {
    card.querySelector('.q-card-title').textContent = 'Question ' + (i + 1);
    card.querySelector('.q-remove').style.display = questionCards().length > 1 ? '' : 'none';
  });
  const addBtn = document.getElementById('q-add-btn');
  if (addBtn) addBtn.disabled = questionCards().length >= MAX_QUESTIONS;
  updateDesperationIndex();
}

function addQuestionCard() {
  const list = document.getElementById('q-list');
  if (!list || questionCards().length >= MAX_QUESTIONS) {
    showToast(`You can add at most ${MAX_QUESTIONS} questions.`, 'error');
    return;
  }
  const id = 'q' + (++_questionSeq);
  _questionPhotos.set(id, []);

  const card = document.createElement('div');
  card.className = 'q-card';
  card.dataset.qid = id;
  card.innerHTML = `
    <div class="q-card-head">
      <span class="q-card-title">Question</span>
      <button type="button" class="q-remove" onclick="removeQuestionCard(this)">✕ Remove</button>
    </div>
    <div class="form-group">
      <label>Question number *</label>
      <input type="text" class="q-number" maxlength="40" placeholder="e.g. Q2(b)" oninput="updateDesperationIndex()" />
    </div>
    <div class="form-group">
      <label>Why should this answer be re-evaluated? *</label>
      <textarea class="q-reason" rows="3" maxlength="3000"
        placeholder="Explain what you believe was mis-marked in this answer."></textarea>
    </div>
    <div class="form-group">
      <label>Photos of this answer <span class="label-optional">(optional, up to ${MAX_PHOTOS_PER_QUESTION})</span></label>
      <input type="file" class="q-photos" accept="image/jpeg,image/png,image/webp" multiple hidden
        onchange="handleQuestionPhotos(this)" />
      <div class="q-photo-row">
        <button type="button" class="btn-secondary btn-photo" onclick="this.closest('.q-card').querySelector('.q-photos').click()">📷 Add photos</button>
        <span class="q-photo-hint">JPG, PNG or WebP</span>
      </div>
      <div class="q-thumbs"></div>
    </div>`;
  list.appendChild(card);
  renumberQuestionCards();
  card.querySelector('.q-number').focus();
  return card;
}

function removeQuestionCard(btn) {
  const card = btn.closest('.q-card');
  _questionPhotos.delete(card.dataset.qid);
  card.remove();
  if (!questionCards().length) addQuestionCard();
  renumberQuestionCards();
}

function resetQuestionCards() {
  const list = document.getElementById('q-list');
  if (!list) return;
  list.innerHTML = '';
  _questionPhotos.clear();
  addQuestionCard();
}

// Shrink to at most 1600px on the long edge and re-encode as JPEG
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image the browser can read.')); };
    img.src = url;
  });
}

async function handleQuestionPhotos(input) {
  const card = input.closest('.q-card');
  const id = card.dataset.qid;
  const photos = _questionPhotos.get(id) || [];
  const picked = Array.from(input.files || []);
  input.value = '';   // so the same file can be chosen again after removing it

  for (const file of picked) {
    if (photos.length >= MAX_PHOTOS_PER_QUESTION) {
      showToast(`Up to ${MAX_PHOTOS_PER_QUESTION} photos per question.`, 'error');
      break;
    }
    try {
      photos.push({ dataUrl: await shrinkImage(file), name: file.name });
    } catch (err) {
      showToast(`"${file.name}": ${err.message}`, 'error');
    }
  }
  _questionPhotos.set(id, photos);
  renderQuestionThumbs(card);
}

function renderQuestionThumbs(card) {
  const photos = _questionPhotos.get(card.dataset.qid) || [];
  card.querySelector('.q-thumbs').innerHTML = photos.map((p, i) => `
    <div class="q-thumb">
      <img src="${p.dataUrl}" alt="${escapeHtml(p.name)}" />
      <button type="button" class="q-thumb-remove" title="Remove photo"
        onclick="removeQuestionPhoto(this.closest('.q-card'), ${i})">✕</button>
    </div>`).join('');
}

function removeQuestionPhoto(card, index) {
  const photos = _questionPhotos.get(card.dataset.qid) || [];
  photos.splice(index, 1);
  _questionPhotos.set(card.dataset.qid, photos);
  renderQuestionThumbs(card);
}

// [{ question, reason, photos: [dataUrl] }] — or null with a message when something's missing
function collectQuestionItems() {
  const items = [];
  for (const [i, card] of questionCards().entries()) {
    const question = card.querySelector('.q-number').value.trim();
    const reason = card.querySelector('.q-reason').value.trim();
    if (!question) {
      card.querySelector('.q-number').focus();
      return { error: `Enter the question number for question ${i + 1}.` };
    }
    if (!reason) {
      card.querySelector('.q-reason').focus();
      return { error: `Enter why question ${i + 1} should be re-evaluated.` };
    }
    items.push({
      question,
      reason,
      photos: (_questionPhotos.get(card.dataset.qid) || []).map(p => p.dataUrl),
    });
  }
  if (!items.length) return { error: 'Add at least one question.' };
  return { items };
}

// ===== PHOTO UPLOAD =====
// Each photo is sent to /api/photo-upload, which stores it in the portal's Google Drive and
// hands back a file id. Only the id is kept in the database, as { name, driveId }.

// The photo functions need the Supabase session token to know who is asking
async function supabaseAccessToken() {
  if (!sb) return null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    return session ? session.access_token : null;
  } catch { return null; }
}

async function uploadOnePhoto(token, requestId, name, dataUrl) {
  const res = await fetch('/api/photo-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ requestId, name, dataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

// Each photo goes to Drive through /api/photo-upload, which checks the request is this
// student's own and still pending, and is then recorded against its question.
async function uploadRequestPhotos(request, items, onProgress) {
  const token = await supabaseAccessToken();
  if (!token) throw new Error('please sign in again.');
  const pending = [];
  items.forEach((q, qi) => q.photos.forEach((dataUrl, pi) => pending.push({ qi, pi, dataUrl })));

  let done = 0;
  for (const p of pending) {
    const item = request.questionItems[p.qi];
    const saved = await uploadOnePhoto(token, request.id, `${photoLabel(item.question, p.qi)} - ${p.pi + 1}`, p.dataUrl);
    const { error } = await sb.from('question_photos').insert({
      question_item_id: item.id, position: p.pi + 1, file_name: saved.name, drive_id: saved.driveId,
    });
    if (error) throw new Error(dbMessage(error));
    done++;
    if (onProgress) onProgress(done, pending.length);
  }
  return done;
}

// "Q2(b) - 1": the name a photo gets in Drive
function photoLabel(question, index) {
  const safe = String(question).replace(/[^A-Za-z0-9()._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  return safe || `Question ${index + 1}`;
}

function photoName(photo) {
  return typeof photo === 'string' ? photo : (photo && photo.name) || '';
}

// ===== PHOTO VIEWER =====
// Shows one photo full size over the page. A new tab is no good here: an offline photo is a
// data: URL, and browsers block navigating a tab to one — that is the blank page you get.
function openPhotoViewer(src, alt) {
  let el = document.getElementById('photo-viewer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'photo-viewer';
    el.className = 'photo-viewer';
    el.innerHTML = `
      <button type="button" class="photo-viewer-close" title="Close" onclick="closePhotoViewer()">&times;</button>
      <img alt="" />`;
    el.addEventListener('click', e => { if (e.target === el) closePhotoViewer(); });
    document.body.appendChild(el);
  }
  const img = el.querySelector('img');
  img.src = src;
  img.alt = alt || '';
  el.classList.add('open');
  document.addEventListener('keydown', photoViewerKeys);
}

function closePhotoViewer() {
  const el = document.getElementById('photo-viewer');
  if (!el) return;
  el.classList.remove('open');
  el.querySelector('img').src = '';      // let the browser release a large data: URL
  document.removeEventListener('keydown', photoViewerKeys);
}

function photoViewerKeys(e) {
  if (e.key === 'Escape') closePhotoViewer();
}

// Photos are private: /api/photo-get hands one over only to a signed-in person who may see its
// request. An <img> can't send the sign-in token, so the page fetches each photo itself and
// shows it from memory, once per visit. Called whenever a modal opens.
const _photoCache = new Map();   // Drive id → Promise of an object URL ('' if unavailable)

function photoImgHtml(photo, alt) {
  const name = photoName(photo);
  if (name.startsWith('data:image/')) return `<img src="${name}" alt="${alt}" />`;
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();
  return `<img data-photo-id="${escapeHtml((photo && photo.driveId) || '')}" data-photo-ext="${escapeHtml(ext)}" alt="${alt}" />`;
}

async function loadProtectedPhotos(root) {
  const imgs = [...root.querySelectorAll('img[data-photo-id]:not([src])')].filter(img => img.dataset.photoId);
  if (!imgs.length) return;
  const token = await supabaseAccessToken();
  for (const img of imgs) {
    const id = img.dataset.photoId;
    if (!_photoCache.has(id)) {
      _photoCache.set(id, fetch(`/api/photo-get?id=${encodeURIComponent(id)}&ext=${encodeURIComponent(img.dataset.photoExt)}`,
        { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.blob() : Promise.reject(new Error(String(res.status))))
        .then(blob => URL.createObjectURL(blob))
        .catch(() => { _photoCache.delete(id); return ''; }));
    }
    _photoCache.get(id).then(url => {
      if (url) img.src = url;
      else img.alt = 'Photo unavailable';
    });
  }
}

// `after(i)` adds content under question i: the marks fields, or the marks once decided
function questionListHtml(r, { photos = true, after = () => '' } = {}) {
  // Older requests stored one questions string and one reason for all of them
  if (!Array.isArray(r.questionItems) || !r.questionItems.length) {
    return `
      <div class="detail-grid">
        <div class="detail-item detail-full"><label>Questions</label><span>${escapeHtml(r.questions || '—')}</span></div>
        ${r.reason ? `<div class="detail-item detail-full"><label>Reason</label><span style="white-space:pre-wrap">${escapeHtml(r.reason)}</span></div>` : ''}
      </div>
      ${after(0)}`;
  }
  return r.questionItems.map((q, i) => `
    <div class="q-view">
      <div class="q-view-head">
        <span class="q-view-num">${escapeHtml(q.question)}</span>
        <span class="q-view-index">Question ${i + 1}</span>
      </div>
      <div class="q-view-reason">${escapeHtml(q.reason)}</div>
      ${(photos && q.photos && q.photos.length) ? `<div class="q-view-photos">${q.photos.map(photo => `
        <button type="button" class="q-photo" title="Open full size"
          onclick="openPhotoViewer(this.querySelector('img').src, this.querySelector('img').alt)">
          ${photoImgHtml(photo, 'Photo of ' + escapeHtml(q.question))}
        </button>`).join('')}</div>` : ''}
      ${(photos && !(q.photos || []).length && q.photoCount) ? `<div class="q-view-gone">🗑️ ${q.photoCount} photo${q.photoCount === 1 ? '' : 's'} were deleted ${PHOTO_RETENTION_DAYS} days after this request was closed.</div>` : ''}
      ${after(i)}
    </div>`).join('');
}

// ===== SHARED HELPERS =====
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== HISTORY TIMELINE RENDERER =====
function renderHistoryTimeline(r) {
  // Build history from the stored array; fall back to synthesised entries for legacy requests
  let entries = Array.isArray(r.history) && r.history.length > 0 ? r.history : [];
  // Old fee/refund entries are no longer part of the portal
  entries = entries.filter(e => !/^Refund /.test(e.event || ''));

  if (entries.length === 0) {
    // Legacy request — synthesise from timestamps
    entries = [{ at: r.createdAt, event: 'Submitted', by: r.studentEmail || '—', note: '' }];
    if (r.reviewedAt) {
      entries.push({ at: r.reviewedAt, event: 'Status changed', by: '—', from: 'Pending', to: r.status, note: r.professorRemarks || '' });
    }
  }

  const icons = { 'Submitted': '📨', 'Status changed': '🔄', 'Remarks updated': '✏️', 'Photos deleted': '🗑️' };
  const dots = { 'Submitted': 'dot-submit', 'Status changed': 'dot-change', 'Remarks updated': 'dot-remark', 'Photos deleted': 'dot-remark' };

  const rows = entries.map((e, i) => {
    const isLast = i === entries.length - 1;
    const icon = icons[e.event] || '📌';
    const dotClass = dots[e.event] || 'dot-change';
    const statusChange = (e.from && e.to && e.from !== e.to)
      ? `<span class="ht-status-change">${escapeHtml(e.from)} → ${escapeHtml(e.to)}</span>`
      : '';
    const note = e.note ? `<div class="ht-note">${escapeHtml(e.note)}</div>` : '';
    const actor = e.by ? `<span class="ht-actor">${escapeHtml(e.by)}</span>` : '';
    return `
      <div class="ht-entry${isLast ? ' ht-last' : ''}">
        <div class="ht-left">
          <div class="ht-dot ${dotClass}">${icon}</div>
          ${!isLast ? '<div class="ht-line"></div>' : ''}
        </div>
        <div class="ht-content">
          <div class="ht-header">
            <span class="ht-event">${escapeHtml(e.event)}</span>
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

// Everyone who teaches this section: one professor, or both for a co-taught course
function professorFor(subject, section) {
  return PROF_MAP.filter(e => e.subject === subject && e.sections.includes(section)).map(e => e.professor).join(' & ');
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

// ===== SIGN-IN (Google, verified by Supabase) =====
// Google hands the sign-in to Supabase, which checks it and returns a session. The database
// refuses any account outside @email.iimcal.ac.in, and decides the role (admin / professor /
// student) from its own tables — the page never gets to choose.
const IIMC_DOMAIN = 'email.iimcal.ac.in';

function setAuthError(message) {
  const el = document.getElementById('google-auth-error');
  if (el) el.textContent = message || '';
}

async function signInWithGoogle() {
  if (!sb) { setAuthError('Sign-in could not load. Check your internet connection and refresh.'); return; }
  setAuthError('');
  const btn = document.getElementById('google-signin-btn');
  if (btn) btn.disabled = true;
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: location.origin + location.pathname,
      queryParams: { hd: IIMC_DOMAIN, prompt: 'select_account' },   // show IIMC accounts first
    },
  });
  if (error) {
    if (btn) btn.disabled = false;
    setAuthError('Sign-in failed: ' + error.message);
  }
  // On success the browser leaves for Google and comes back here signed in
}

// Coming back from Google with an error (e.g. a non-IIMC account refused by the database)
function takeAuthErrorFromUrl() {
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  const desc = params.get('error_description');
  if (!desc) return null;
  history.replaceState(null, '', location.pathname);
  const text = desc.replace(/\+/g, ' ');
  return /database error saving new user/i.test(text)
    ? 'Only @email.iimcal.ac.in accounts can use this portal. Please sign in with your IIMC Google account.'
    : 'Sign-in failed: ' + text;
}

// The signed-in person as the rest of the page expects it, with the role from the database
async function userFromSession(session) {
  const user = session.user;
  const meta = user.user_metadata || {};
  const email = (user.email || '').toLowerCase();
  const { data: role, error } = await sb.rpc('my_role');
  if (error) console.error('[Auth] Could not read role:', error.message);
  // The dummy test accounts have no Google profile, so name them from the portal's own lists
  const knownName = (ADMIN_ACCOUNTS.find(a => a.email === email) || {}).name || EMAIL_TO_PROF[email];
  return {
    email,
    name: meta.full_name || meta.name || knownName || email.split('@')[0],
    picture: meta.avatar_url || meta.picture || '',
    role: error ? 'student' : role,          // the least-privileged role if the check fails
    verified: true,
  };
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

async function signOut() {
  if (sb) {
    try { await sb.auth.signOut(); } catch (e) { console.error('[Auth] Sign-out:', e); }
  }
  currentUser = null;
  _cache = [];
  _windows = [];
  _blocks = [];
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
  navUser.innerHTML = (currentUser.picture
    ? `<img src="${escapeHtml(currentUser.picture)}" alt="" class="nav-user-photo">` : '') +
    `<span>${escapeHtml(label)}</span>`;
  document.getElementById('student-welcome').textContent =
    'Welcome back, ' + currentUser.name + '! Manage your re-evaluation requests below.';
  renderStudentOpenWindows();
  renderStudentStats();
  renderStudentRequests(currentStudentTab);
  switchStudentView(_studentView);      // Requests or Profile, whichever was last open
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

// Once its window closes, a request leaves "My Requests" and appears in the Profile history
function isInHistory(r) {
  const w = getWindows().find(x => x.id === r.windowId);
  if (w) return windowStateOf(w) === 'closed';
  return r.status.startsWith('Resolved');    // older requests with no window on record
}

function renderStudentRequests(tab) {
  let all = getRequests().filter(r => r.studentEmail === currentUser.email && !isInHistory(r));
  if (tab === 'pending') all = all.filter(r => r.status === 'Pending');
  else if (tab === 'review') all = all.filter(r => r.status === 'Under Review');
  else if (tab === 'resolved') all = all.filter(r => r.status.startsWith('Resolved'));

  const grid = document.getElementById('student-requests-grid');
  if (all.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No open requests in this category. Closed ones are in your Profile.</p>
    </div>`;
    return;
  }
  all.sort((a, b) => b.createdAt - a.createdAt);
  grid.innerHTML = all.map(r => studentCard(r)).join('');
}

function studentCard(r) {
  const hasResult = r.status.startsWith('Resolved');
  const resultAlert = hasResult
    ? `<div class="card-result-alert ${getResultClass(r.status)}" style="margin-bottom:8px;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;">${escapeHtml(r.status)}</div>`
    : '';
  return `
  <div class="request-card" data-id="${escapeHtml(r.id)}" onclick="openStudentDetail(this.dataset.id)">
    <div class="card-top">
      <div class="card-subject">${escapeHtml(r.subject)}</div>
      ${getBadge(r.status)}
    </div>
    ${resultAlert}
    <div class="card-meta">
      <span class="meta-item">📅 ${escapeHtml(r.examType)}</span>
      <span class="meta-item">👨‍🏫 ${escapeHtml(r.professorName)}</span>
      <span class="meta-item">🏷️ Sec ${escapeHtml(r.section || '—')}</span>
    </div>
    <div class="card-questions">Questions: ${escapeHtml(r.questions)}</div>
    <div class="card-footer">
      <span>ID: ${escapeHtml(r.id)}</span>
      <span>${formatDate(r.createdAt)}</span>
    </div>
  </div>`;
}

function getResultClass(status) {
  if (status.includes('Increased') || status.includes('Changed')) return 'result-increased-alert';
  if (status.includes('Decreased')) return 'result-decreased-alert';
  return 'result-nochange-alert';
}

function getBadge(status) {
  if (status === 'Pending') return `<span class="badge badge-pending">Pending</span>`;
  if (status === 'Under Review') return `<span class="badge badge-review">Under Review</span>`;
  if (status.includes('Increased')) return `<span class="badge badge-increased">Marks Up ↑</span>`;
  if (status.includes('Decreased')) return `<span class="badge badge-decreased">Marks Down ↓</span>`;
  if (status.includes('Changed')) return `<span class="badge badge-increased">Marks Changed</span>`;
  return `<span class="badge badge-nochange">No Change</span>`;
}

// Why the photos are missing: already deleted, or simply not shown in history
function photoNoteHtml(r, inHistory, hadPhotos) {
  if (r.photosDeletedAt) {
    const n = r.photoCountBeforeDeletion;
    return `<p class="q-view-note">🗑️ ${n ? n + ' photo' + (n === 1 ? '' : 's') : 'The photos'} of your answer script
      ${n === 1 ? 'was' : 'were'} deleted on ${formatDate(r.photosDeletedAt)}, ${PHOTO_RETENTION_DAYS} days after this
      request was closed. Everything else about the request is kept.</p>`;
  }
  if (inHistory && hadPhotos) {
    return `<p class="q-view-note">Photos are not shown once the re-evaluation window has closed. They are deleted
      ${PHOTO_RETENTION_DAYS} days after the professor's decision.</p>`;
  }
  return '';
}

// The professor's decision on older requests: original → updated marks, then the remarks.
// Requests decided per question show their marks and remarks under each question instead.
function decisionHtml(r, title = "Professor's Decision") {
  if (Array.isArray(r.questionMarks) && r.questionMarks.length) return '';
  if (!r.originalMarks && !r.updatedMarks && !r.professorRemarks) return '';
  const boxClass = r.status.includes('Decreased') ? ' result-decreased' : r.status === PAYABLE_STATUS ? ' result-nochange' : '';
  const row = (label, value, cls = '') => `<div class="result-marks-row"><label>${label}</label><span class="result-marks${cls}">${escapeHtml(value)}</span></div>`;
  const marks = (r.originalMarks ? row('Original', r.originalMarks, ' result-marks-original') : '') +
    (r.updatedMarks ? row('Updated', r.updatedMarks) : '');
  return `
    <div class="result-box${boxClass}">
      <h5>${title}</h5>
      ${marks}
      ${r.professorRemarks ? `<div class="result-remarks">${escapeHtml(r.professorRemarks)}</div>` : ''}
    </div>`;
}

function openStudentDetail(id) {
  const r = getRequests().find(x => x.id === id);
  if (!r) return;
  const inHistory = isInHistory(r);
  const hadPhotos = (r.questionItems || []).some(q => q.photos && q.photos.length);

  const resultHtml = decisionHtml(r);

  document.getElementById('student-detail-body').innerHTML = `
    <div class="detail-section">
      <h4>Request Information</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>Full Name</label><span>${escapeHtml(r.studentName)}</span></div>
        <div class="detail-item"><label>Registration No.</label><span>${escapeHtml(r.regNo)}</span></div>
        <div class="detail-item"><label>Subject</label><span>${escapeHtml(r.subject)}</span></div>
        <div class="detail-item"><label>Section</label><span>${escapeHtml(r.section || '—')}</span></div>
        <div class="detail-item"><label>Exam Type</label><span>${escapeHtml(r.examType)}</span></div>
        <div class="detail-item"><label>Professor</label><span>${escapeHtml(r.professorName)}</span></div>
        <div class="detail-item"><label>Term</label><span>${escapeHtml(r.term || '—')}</span></div>
        <div class="detail-item"><label>Status</label><span>${getBadge(r.status)}</span></div>
        <div class="detail-item"><label>Submitted On</label><span>${formatDate(r.createdAt)}</span></div>
        <div class="detail-item"><label>Request ID</label><span style="font-family:monospace;font-size:12px">${escapeHtml(r.id)}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>Questions</h4>
      ${questionListHtml(r, { photos: !inHistory, after: marksAfter(r) })}
      ${photoNoteHtml(r, inHistory, hadPhotos)}
    </div>
    ${resultHtml}
    ${renderHistoryTimeline(r)}`;
  openModal('student-detail-modal');
}

// ===== STUDENT FORM =====
// Opens the request form for one open window. Returns false if the student can't apply.
function showStudentForm(windowId) {
  const w = getWindows().find(x => x.id === windowId);
  if (!w || windowStateOf(w) !== 'open') { showToast('This re-evaluation window is not open.', 'error'); return false; }
  if (_studentBlocked) { showToast('Re-evaluation is deactivated for your account. Please contact the MBA office.', 'error'); return false; }
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
  resetQuestionCards();
  openModal('student-form-modal');
  return true;
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
  const professorNames = sectioned ? professorFor(w.subject, section) : w.professor;
  if (!professorNames) {
    showToast(sectioned ? `No professor is mapped to ${w.subject} for Section ${section}.` : 'This window has no reviewing professor.', 'error');
    return;
  }

  const collected = collectQuestionItems();
  if (collected.error) { showToast(collected.error, 'error'); return; }

  const submitBtn = document.querySelector('#reval-form button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  const photoCount = collected.items.reduce((n, q) => n + q.photos.length, 0);
  submitBtn.textContent = photoCount ? `Uploading ${photoCount} photo${photoCount === 1 ? '' : 's'}...` : 'Submitting...';
  // Photos go up one at a time, so say which one
  _uploadProgress = (done, total) => { submitBtn.textContent = `Uploading photo ${done} of ${total}...`; };

  let photoProblem = '';
  try {
    ({ photoProblem } = await submitNewRequest({
      windowId: w.id,
      studentName: document.getElementById('f-name').value.trim(),
      regNo: document.getElementById('f-regno').value.trim(),
      section,
      items: collected.items,
    }));
  } catch (err) {
    showToast('Could not submit: ' + err.message, 'error');
    return;
  } finally {
    _uploadProgress = null;
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }

  stopFormCountdown();
  closeModal('student-form-modal');
  renderStudentStats();
  renderStudentOpenWindows();
  switchStudentTab('pending', document.querySelector('#page-student .tab'));
  if (photoProblem) showToast('Your request was submitted, but some photos could not be stored: ' + photoProblem, 'error');
  else jokaToast('submit', section);
}

// ===== PROFESSOR DASHBOARD =====
function initProfDashboard() {
  const navUser = document.getElementById('prof-nav-user');
  const label = navDisplayLabel();
  navUser.innerHTML = (currentUser.picture
    ? `<img src="${escapeHtml(currentUser.picture)}" alt="" class="nav-user-photo">` : '') +
    `<span>${escapeHtml(label)}</span>`;

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
  const myName = resolveProfessorName(currentUser.email);
  if (!myName) return [];
  return getRequests().filter(r => isRequestFor(r, myName));
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
    </div>`;
    return;
  }
  all.sort((a, b) => b.createdAt - a.createdAt);
  grid.innerHTML = all.map(r => profCard(r)).join('');
}

function profCard(r) {
  return `
  <div class="request-card" data-id="${escapeHtml(r.id)}" onclick="openProfReview(this.dataset.id)">
    <div class="card-top">
      <div class="card-subject">${escapeHtml(r.subject)}</div>
      ${getBadge(r.status)}
    </div>
    <div class="card-meta">
      <span class="meta-item">🎓 ${escapeHtml(r.studentName)}</span>
      <span class="meta-item">📋 ${escapeHtml(r.regNo)}</span>
      <span class="meta-item">🏷️ Sec ${escapeHtml(r.section || '—')}</span>
      <span class="meta-item">📅 ${escapeHtml(r.examType)}</span>
    </div>
    <div class="card-questions">Questions: ${escapeHtml(r.questions)}</div>
    <div class="card-footer">
      <span>ID: ${escapeHtml(r.id)}</span>
      <span>${formatDate(r.createdAt)}</span>
    </div>
  </div>`;
}

// ===== MARKS PER QUESTION =====
// For every question the professor enters the original and updated marks, whether they went up,
// down or stayed the same, and a remark. A request whose marks changed on any question counts as
// a successful re-evaluation ("Marks Changed"), even if the total is the same; otherwise "No Change".
// Stored as r.questionMarks = [{ question, original, updated, result, remark }], one per question.
const QUESTION_RESULTS = { increased: 'Increased', decreased: 'Decreased', unchanged: 'No change' };
let _reviewQuestions = [];   // question names of the request open in the review form

// Older requests have one questions string instead of a list; they get a single group
function reviewQuestionNames(r) {
  if (Array.isArray(r.questionItems) && r.questionItems.length) return r.questionItems.map(q => q.question);
  return [r.questions || 'All questions'];
}

function formatMark(n) {
  return n == null ? '—' : String(Math.round(n * 100) / 100);
}

// Compared in hundredths so 0.1 + 0.2 doesn't count as a change
function resultFromMarks(original, updated) {
  if (original == null || updated == null || !Number.isFinite(original) || !Number.isFinite(updated)) return '';
  const diff = Math.round(updated * 100) - Math.round(original * 100);
  return diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged';
}

// The professor's fields under one question
function questionMarkFieldsHtml(m = {}) {
  const val = v => v == null ? '' : formatMark(v);
  const number = (label, cls, value) => `
    <label class="qm-field">${label}
      <input type="number" class="${cls}" min="0" step="0.5" inputmode="decimal" value="${val(value)}" oninput="onReviewMarksInput(this)" />
    </label>`;
  return `
    <div class="qm-fields">
      <div class="qm-row">
        ${number('Original marks *', 'qm-original', m.original)}
        ${number('Updated marks *', 'qm-updated', m.updated)}
        <label class="qm-field">Result *
          <select class="qm-result">
            <option value="">Select…</option>
            ${Object.entries(QUESTION_RESULTS).map(([value, label]) =>
              `<option value="${value}" ${m.result === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
      </div>
      <label class="qm-field">Remark on this question *
        <textarea class="qm-remark" rows="2" maxlength="1000" placeholder="Explain the marks for this question. Visible to the student.">${escapeHtml(m.remark || '')}</textarea>
      </label>
    </div>`;
}

// Typing the marks fills in the result; the professor can still change it, but not to one the marks contradict
function onReviewMarksInput(input) {
  const group = input.closest('.qm-fields');
  const num = el => el.value.trim() === '' ? null : Number(el.value);
  const result = resultFromMarks(num(group.querySelector('.qm-original')), num(group.querySelector('.qm-updated')));
  if (result) group.querySelector('.qm-result').value = result;
}

// The same marks, read-only, under each question on the student and admin screens
function questionMarksViewHtml(m) {
  if (!m) return '';
  const cls = { increased: ' qm-up', decreased: ' qm-down' }[m.result] || '';
  return `
    <div class="qm-view">
      <span class="qm-view-marks">Marks ${formatMark(m.original)}${m.updated != null
        ? ` → <strong class="qm-view-updated${cls}">${formatMark(m.updated)}</strong>` : ''}</span>
      ${m.result ? `<span class="qm-view-result${cls}">${QUESTION_RESULTS[m.result]}</span>` : ''}
      ${m.remark ? `<div class="qm-view-remark">${escapeHtml(m.remark)}</div>` : ''}
    </div>`;
}

function marksAfter(r) {
  const marks = Array.isArray(r.questionMarks) ? r.questionMarks : [];
  return i => questionMarksViewHtml(marks[i]);
}

function readReviewMarks() {
  const num = el => el.value.trim() === '' ? null : Number(el.value);
  return [...document.querySelectorAll('#prof-request-detail .qm-fields')].map((el, i) => ({
    question: _reviewQuestions[i],
    original: num(el.querySelector('.qm-original')),
    updated: num(el.querySelector('.qm-updated')),
    result: el.querySelector('.qm-result').value,
    remark: el.querySelector('.qm-remark').value.trim(),
  }));
}

// An error message, or '' when the marks can be saved
function checkReviewMarks(marks) {
  const bad = v => !Number.isFinite(v) || v < 0;
  for (const m of marks) {
    if (m.original == null) return `Enter the original marks for ${m.question}.`;
    if (m.updated == null) return `Enter the updated marks for ${m.question} — the same as the original if they did not change.`;
    if (bad(m.original) || bad(m.updated)) return `Marks for ${m.question} must be numbers of 0 or more.`;
    if (!m.result) return `Choose whether the marks for ${m.question} increased, decreased or stayed the same.`;
    if (m.result !== resultFromMarks(m.original, m.updated)) {
      return `For ${m.question} you chose "${QUESTION_RESULTS[m.result]}", but the marks go from ${formatMark(m.original)} to ${formatMark(m.updated)}.`;
    }
    if (!m.remark) return `Enter a remark for ${m.question}.`;
  }
  return '';
}

function openProfReview(id) {
  currentProfRequestId = id;
  const r = getRequests().find(x => x.id === id);
  if (!r) return;

  _reviewQuestions = reviewQuestionNames(r);
  const marks = Array.isArray(r.questionMarks) ? r.questionMarks : [];
  document.getElementById('prof-modal-sub').textContent =
    `${r.studentName} · ${r.regNo} · Sec ${r.section || '—'} · ${r.subject} · Submitted ${formatDate(r.createdAt)}`;

  document.getElementById('prof-request-detail').innerHTML = `
    <div class="detail-section">
      <h4>Student's Request</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>Student Name</label><span>${escapeHtml(r.studentName)}</span></div>
        <div class="detail-item"><label>Registration No.</label><span>${escapeHtml(r.regNo)}</span></div>
        <div class="detail-item"><label>Subject / Course</label><span>${escapeHtml(r.subject)}</span></div>
        <div class="detail-item"><label>Section</label><span>${escapeHtml(r.section || '—')}</span></div>
        <div class="detail-item"><label>Exam Type</label><span>${escapeHtml(r.examType)}</span></div>
        <div class="detail-item"><label>Academic Term</label><span>${escapeHtml(r.term || '—')}</span></div>
        <div class="detail-item"><label>Current Status</label><span>${getBadge(r.status)}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>Questions to Re-Evaluate</h4>
      <p class="qm-hint">Fill in every field under each question. The request counts as successful if the marks
        change on any question, even if the total stays the same.</p>
      ${questionListHtml(r, { after: i => questionMarkFieldsHtml(marks[i]) })}
    </div>`;


  // Append read-only history timeline for faculty reference
  const existingTimeline = document.getElementById('prof-request-detail').querySelector('.history-timeline-wrap');
  if (existingTimeline) existingTimeline.remove();
  const timelineEl = document.createElement('div');
  timelineEl.innerHTML = renderHistoryTimeline(r);
  document.getElementById('prof-request-detail').appendChild(timelineEl);

  openModal('prof-review-modal');
}

async function submitProfReview() {
  const questionMarks = readReviewMarks();
  const problem = checkReviewMarks(questionMarks);
  if (problem) { showToast(problem, 'error'); return; }

  const btn = document.querySelector('#prof-review-modal .form-actions .btn-primary');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    await saveReview(currentProfRequestId, questionMarks);
    closeModal('prof-review-modal');
    renderProfStats();
    renderProfRequests(currentProfTab);
    showToast('Decision saved.', 'success');
  } catch (err) {
    showToast('Could not save decision: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

// ===== MODAL HELPERS =====
function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  loadProtectedPhotos(modal);
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
let _toastTimer = null;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== START-UP =====
// A signed-in session is restored (or finished, when coming back from Google), the data this
// person may see is loaded, and their dashboard opens. Without a session: the sign-in page.
window.addEventListener('DOMContentLoaded', async () => {
  // The [DEV] login panels are hidden in the page markup so they can't flash before the
  // sign-in check finishes; they're revealed here once the page is ready.
  document.querySelectorAll('.creds-panel').forEach(p => { p.style.display = ''; });
  populateCreds();
  populateAdminCreds();
  localStorage.removeItem('reval_session');   // left over from the old pretend [DEV] logins

  const authError = takeAuthErrorFromUrl();
  if (authError) setAuthError(authError);

  let session = null;
  if (sb) {
    try { ({ data: { session } } = await sb.auth.getSession()); }
    catch (e) { console.error('[Auth] Session check:', e); }
  } else {
    setAuthError('Sign-in could not load. Check your internet connection and refresh.');
  }

  if (session) {
    if (location.search.includes('code=')) history.replaceState(null, '', location.pathname);
    await startSession(session);
  } else {
    showPage('page-login');
  }

  // Signed out in another tab, or the session expired
  if (sb) {
    sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && currentUser) {
        currentUser = null;
        showPage('page-login');
      }
    });
  }
});

// Load everything this person may see, then open their dashboard
async function startSession(session) {
  currentUser = await userFromSession(session);
  await Promise.all([loadFaculty(), loadWindows(), refreshRequests()]);
  openDashboardForRole();
}

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

function windowFromRow(w) {
  return {
    id: w.id,
    subject: w.subject,
    courseCode: w.course_code || '',
    examType: w.exam_type,
    sections: w.sections || [],
    professor: w.professor || '',
    term: w.term,
    startsAt: ms(w.starts_at),
    endsAt: ms(w.ends_at),
    closedAt: ms(w.closed_at),
    createdBy: w.created_by,
    createdAt: ms(w.created_at),
    updatedBy: w.updated_by,
    updatedAt: ms(w.updated_at),
  };
}

async function loadWindows() {
  if (!sb || !currentUser) return;
  const { data, error } = await sb.from('windows').select('*').order('starts_at', { ascending: false });
  if (error) { console.error('[Data] Windows:', error.message); return; }
  _windows = data.map(windowFromRow);
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
    const mine = requestsInWindow(w.id).filter(r => isRequestFor(r, resolveProfessorName(currentUser.email))).length;
    rows.push(['Your Requests', String(mine)]);
  }

  let actions = '';
  if (role === 'student' && state === 'open') {
    actions = _studentBlocked
      ? '<button class="btn-secondary" disabled>Re-evaluation deactivated</button>'
      : hasAppliedInWindow(w.id)
      ? '<button class="btn-secondary" disabled>✓ Applied</button>'
      : `<button class="btn-primary" onclick="closeModal('window-detail-modal'); showStudentForm('${w.id}')">Apply for Re-evaluation</button>`;
  } else if (role === 'admin') {
    const count = requestsInWindow(w.id).length;
    actions = count
      ? `<button class="btn-secondary" onclick="closeModal('window-detail-modal'); showWindowRequests('${w.id}')">View ${count} request${count === 1 ? '' : 's'}</button>`
      : '';
    if (state !== 'closed') actions += `
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
  const banner = document.getElementById('student-blocked-banner');
  if (banner) {
    banner.style.display = _studentBlocked ? '' : 'none';
    banner.innerHTML = _studentBlocked
      ? '<strong>Re-evaluation is deactivated for your account.</strong> Please contact the MBA office if you think this is a mistake.'
      : '';
  }
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
          : _studentBlocked
            ? '<button class="btn-secondary" disabled title="Re-evaluation is deactivated for your account">Deactivated</button>'
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
    const count = requestsInWindow(w.id).filter(r => isRequestFor(r, profName)).length;
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
  switchAdminView(_adminView);
  loadBlocks().then(renderAdminDashboard);
}

function renderAdminDashboard() {
  renderAdminStats();
  if (_adminView === 'students') renderAdminStudents();
  else if (_adminView === 'requests') renderAdminRequests();
  else if (_adminView === 'fees') renderAdminFees();
  else renderAdminWindows(currentAdminTab);
}

function renderAdminStats() {
  const now = Date.now();
  const ws = getWindows();
  const stats = [
    { label: 'Open Now', val: ws.filter(w => windowStateOf(w, now) === 'open').length },
    { label: 'Scheduled', val: ws.filter(w => windowStateOf(w, now) === 'scheduled').length },
    { label: 'Closed', val: ws.filter(w => windowStateOf(w, now) === 'closed').length },
    { label: 'Requests Received', val: getRequests().filter(r => r.windowId).length },
    { label: 'Deactivated Students', val: activeBlocks().length },
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
  document.getElementById('w-prof-new').hidden = true;
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
  const search = document.getElementById('w-prof-search');
  const auto = document.getElementById('w-prof-auto');
  const input = document.getElementById('w-prof');
  const hasSubject = Boolean(document.getElementById('w-subject').value);
  const sections = tickedSections();

  group.style.display = hasSubject ? '' : 'none';
  if (!hasSubject) {
    hideProfSuggestions();
    document.getElementById('w-prof-new').hidden = true;
    return;
  }

  if (sections.length) {
    // With sections chosen, the professors follow from the course mapping — shown, not searched
    hideProfSuggestions();
    document.getElementById('w-prof-new').hidden = true;
    search.style.display = 'none';
    auto.style.display = '';
    input.required = false;

    const subject = selectedWindowSubject();
    const byProf = new Map();
    sections.forEach(sec => {
      const prof = professorFor(subject, sec) || 'Not assigned';
      if (!byProf.has(prof)) byProf.set(prof, []);
      byProf.get(prof).push(sec);
    });
    auto.innerHTML = [...byProf].map(([prof, secs]) => `
      <div class="prof-auto-row">
        <span class="prof-auto-name">👨‍🏫 ${escapeHtml(prof)}</span>
        <span class="prof-auto-secs">Section${secs.length > 1 ? 's' : ''} ${secs.join(', ')}</span>
      </div>`).join('');
    document.getElementById('w-prof-label').textContent = byProf.size > 1 ? 'Reviewing Professors' : 'Reviewing Professor';
    document.getElementById('w-prof-hint').textContent =
      'From the course mapping — each section\'s requests go to that section\'s professor.';
  } else {
    search.style.display = '';
    auto.style.display = 'none';
    auto.innerHTML = '';
    input.required = true;
    document.getElementById('w-prof-label').textContent = 'Reviewing Professor *';
    document.getElementById('w-prof-hint').textContent =
      'No section is selected, so every student of this subject can apply and all requests go to this professor.';
  }
}

// ----- Faculty directory -----
// The faculty directory and who teaches which section come from the database. PROF_EMAILS and
// PROF_MAP above only fill the [DEV] login list until someone signs in; then they are replaced.
// Professors the office added from the window form are marked as added.
let _addedFaculty = [];

async function loadFaculty() {
  if (!sb || !currentUser) return;
  const [fac, secs] = await Promise.all([
    sb.from('faculty').select('email, name, added_by'),
    sb.from('course_sections').select('subject, section, professor_name'),
  ]);
  const error = fac.error || secs.error;
  if (error) { console.error('[Data] Faculty:', error.message); return; }

  for (const key of Object.keys(PROF_EMAILS)) delete PROF_EMAILS[key];
  for (const key of Object.keys(EMAIL_TO_PROF)) delete EMAIL_TO_PROF[key];
  _addedFaculty = [];
  fac.data.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(registerFaculty);

  // One entry per professor per subject, with their sections — the shape the page uses
  const entries = new Map();
  for (const row of secs.data) {
    const key = row.professor_name + '\u0000' + row.subject;
    if (!entries.has(key)) entries.set(key, { professor: row.professor_name, subject: row.subject, sections: [], termCoverage: 'Both' });
    entries.get(key).sections.push(row.section);
  }
  PROF_MAP.length = 0;
  [...entries.values()]
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.professor.localeCompare(b.professor))
    .forEach(e => { e.sections.sort(); PROF_MAP.push(e); });
}

function registerFaculty(f) {
  PROF_EMAILS[f.name] = f.email;
  EMAIL_TO_PROF[f.email] = f.name;
  if (f.added_by && !_addedFaculty.some(x => x.email === f.email)) _addedFaculty.push({ name: f.name, email: f.email });
}

function facultyList() {
  return Object.entries(PROF_EMAILS).map(([name, email]) => ({
    name, email, added: _addedFaculty.some(f => f.email === email),
  }));
}

function isKnownProfessor(name) {
  return Object.prototype.hasOwnProperty.call(PROF_EMAILS, name);
}

// ----- Reviewing professor: search + suggestions -----
let _profSuggestIndex = -1;

function renderProfSuggestions() {
  const input = document.getElementById('w-prof');
  const box = document.getElementById('w-prof-suggestions');
  if (input.disabled) return;
  const typed = input.value.trim();
  const q = typed.toLowerCase();
  const teaching = new Set(getEntriesForSubject(selectedWindowSubject()).map(e => e.professor));

  // Match on name or email; professors who teach the subject come first
  const matches = facultyList()
    .filter(f => !q || f.name.toLowerCase().includes(q) || f.email.includes(q))
    .sort((a, b) => (teaching.has(b.name) - teaching.has(a.name)) || a.name.localeCompare(b.name))
    .slice(0, 8);

  const items = matches.map(f => `
    <div class="suggest-item" data-name="${escapeHtml(f.name)}" onmousedown="event.preventDefault(); pickProfessor(this.dataset.name)">
      <span class="suggest-name">${escapeHtml(f.name)}</span>
      <span class="suggest-email">${escapeHtml(f.email)}</span>
      ${teaching.has(f.name) ? '<span class="suggest-tag">Teaches this subject</span>' : ''}
      ${f.added ? '<span class="suggest-tag suggest-tag-added">Added by office</span>' : ''}
    </div>`);

  // Offer to add whoever was typed if they aren't in the directory
  const exact = facultyList().some(f => f.name.toLowerCase() === q);
  if (typed && !exact) {
    items.push(`<div class="suggest-item suggest-add" onmousedown="event.preventDefault(); startAddProfessor()">
      + Add “${escapeHtml(typed)}” as a new professor</div>`);
  }
  if (!items.length) {
    items.push('<div class="suggest-empty">No faculty found.</div>');
  }
  box.innerHTML = items.join('');
  box.hidden = false;
  _profSuggestIndex = -1;
}

function onProfInput() {
  document.getElementById('w-prof-new').hidden = true;
  renderProfSuggestions();
}

function hideProfSuggestions() {
  const box = document.getElementById('w-prof-suggestions');
  if (box) box.hidden = true;
  _profSuggestIndex = -1;
}

function pickProfessor(name) {
  document.getElementById('w-prof').value = name;
  document.getElementById('w-prof-new').hidden = true;
  hideProfSuggestions();
}

// Arrow keys move through suggestions, Enter picks, Escape closes (Enter never submits the form here)
function onProfKeydown(e) {
  const box = document.getElementById('w-prof-suggestions');
  const items = Array.from(box.querySelectorAll('.suggest-item'));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (box.hidden) { renderProfSuggestions(); return; }
    if (!items.length) return;
    _profSuggestIndex = (_profSuggestIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle('active', i === _profSuggestIndex));
    items[_profSuggestIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const chosen = items[_profSuggestIndex] || (items.length === 1 ? items[0] : null);
    if (!chosen) return;
    if (chosen.classList.contains('suggest-add')) startAddProfessor();
    else pickProfessor(chosen.dataset.name);
  } else if (e.key === 'Escape') {
    hideProfSuggestions();
  }
}

function startAddProfessor() {
  const typed = document.getElementById('w-prof').value.trim();
  hideProfSuggestions();
  document.getElementById('w-prof-new').hidden = false;
  document.getElementById('w-prof-new-name').value = typed;
  document.getElementById('w-prof-new-email').value = '';
  document.getElementById('w-prof-new-email').focus();
}

function cancelAddProfessor() {
  document.getElementById('w-prof-new').hidden = true;
  document.getElementById('w-prof').focus();
}

function onNewProfKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); addNewProfessor(); }
  if (e.key === 'Escape') cancelAddProfessor();
}

async function addNewProfessor() {
  let name = document.getElementById('w-prof-new-name').value.replace(/\s+/g, ' ').trim();
  const email = document.getElementById('w-prof-new-email').value.trim().toLowerCase();
  if (!name) { showToast('Please enter the professor\'s name.', 'error'); return; }
  if (!/^prof\.?\s/i.test(name)) name = 'Prof. ' + name;   // match the directory's naming
  if (!/^[a-z0-9._%+-]+@email\.iimcal\.ac\.in$/.test(email)) {
    showToast('Please enter the professor\'s @email.iimcal.ac.in address.', 'error');
    return;
  }
  const clash = facultyList().find(f => f.email === email || f.name.toLowerCase() === name.toLowerCase());
  if (clash) {
    showToast(`${clash.name} (${clash.email}) is already in the faculty list.`, 'info');
    pickProfessor(clash.name);
    return;
  }

  const { data: saved, error } = await sb.from('faculty').insert({ name, email }).select().single();
  if (error) {
    showToast(/duplicate key/i.test(error.message) ? 'That professor is already in the faculty list.' : dbMessage(error), 'error');
    return;
  }
  registerFaculty(saved);
  populateCreds();
  pickProfessor(saved.name);
  showToast(`${saved.name} added to the faculty list.`, 'success');
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
    professor: sections.length ? '' : document.getElementById('w-prof').value.trim(),
    term: document.getElementById('w-term').value.trim(),
    startsAt: fromLocalInput(document.getElementById('w-start').value),
    endsAt: fromLocalInput(document.getElementById('w-end').value),
  };
  if (!payload.subject) { showToast('Please choose or enter the subject.', 'error'); return; }
  if (!examType) { showToast('Please choose or enter the type of exam.', 'error'); return; }
  if (!payload.term) { showToast('Please enter the term.', 'error'); return; }
  if (!sections.length && !payload.professor) { showToast('No section is selected, so please choose the reviewing professor.', 'error'); return; }
  if (!sections.length && !isKnownProfessor(payload.professor)) {
    showToast('Pick the professor from the suggestions, or add them as a new professor.', 'error');
    return;
  }
  if (!(payload.endsAt > payload.startsAt)) { showToast('The window must close after it opens.', 'error'); return; }
  if (payload.endsAt <= Date.now()) { showToast('The closing time is already in the past.', 'error'); return; }

  const row = {
    subject: payload.subject,
    course_code: payload.courseCode,
    exam_type: payload.examType,
    sections: payload.sections,
    professor: payload.professor,
    term: payload.term,
    starts_at: new Date(payload.startsAt).toISOString(),
    ends_at: new Date(payload.endsAt).toISOString(),
  };
  const query = editing ? sb.from('windows').update(row).eq('id', editing) : sb.from('windows').insert(row);
  const { data, error } = await query.select().single();
  if (error) { showToast(dbMessage(error), 'error'); return; }
  const saved = windowFromRow(data);

  const idx = _windows.findIndex(x => x.id === saved.id);
  if (idx === -1) _windows.push(saved); else _windows[idx] = saved;
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

  const { data, error } = await sb.from('windows').update({ closed_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) { showToast(dbMessage(error), 'error'); return; }
  Object.assign(w, windowFromRow(data));
  renderAdminDashboard();
  showToast('Window closed.', 'success');
}

// ----- Routing and refresh -----
function openDashboardForRole() {
  applyUserTheme();
  if (currentUser.role === 'admin') {
    showPage('page-admin');
    initAdminDashboard();
  } else if (currentUser.role === 'professor') {
    showPage('page-professor');
    initProfDashboard();
  } else {
    showPage('page-student');
    initStudentDashboard();
    // The server decides this; the page only reflects it
    refreshBlockedState().then(renderStudentOpenWindows);
  }
}

// Every 30s: pick up windows and requests changed elsewhere, and keep countdowns current
setInterval(async () => {
  if (!currentUser) return;
  const jobs = [loadWindows(), refreshRequests()];
  if (currentUser.role === 'admin') jobs.push(loadBlocks());
  if (currentUser.role === 'student') jobs.push(refreshBlockedState());
  await Promise.all(jobs);
  if (!currentUser) return;   // signed out while refreshing
  if (currentUser.role === 'admin') {
    renderAdminDashboard();
  } else if (currentUser.role === 'professor') {
    renderProfOpenWindows();
    renderProfStats();
    renderProfRequests(currentProfTab);
  } else {
    renderStudentOpenWindows();
    renderStudentStats();
    renderStudentRequests(currentStudentTab);
    if (_studentView === 'profile') renderStudentProfile();
  }
}, 30000);

// ===== STUDENT PROFILE =====
// Everything the student has ever applied for, and how many times the fee is due.
// The fee is charged only when the marks stay the same; a change either way costs nothing.
let _studentView = 'requests';

function switchStudentView(view) {
  _studentView = view;
  document.querySelectorAll('#student-view-switch .view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('student-requests-view').style.display = view === 'requests' ? '' : 'none';
  document.getElementById('student-profile-view').style.display = view === 'profile' ? '' : 'none';
  if (view === 'profile') renderStudentProfile();
}

function myRequests() {
  return getRequests()
    .filter(r => (r.studentEmail || '').toLowerCase() === (currentUser.email || '').toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
}

// What the student's requests add up to
function profileSummary(all) {
  return {
    total: all.length,
    pending: all.filter(r => r.status === 'Pending' || r.status === 'Under Review').length,
    changed: all.filter(r => r.status.startsWith('Resolved') && r.status !== PAYABLE_STATUS).length,
    payable: all.filter(isFeePayable).length,
  };
}

function outcomeLabel(status) {
  if (status === 'Resolved - Marks Increased') return { text: 'Marks increased', cls: 'out-up', fee: 'No fee' };
  if (status === 'Resolved - Marks Decreased') return { text: 'Marks decreased', cls: 'out-down', fee: 'No fee' };
  if (status === 'Resolved - Marks Changed') return { text: 'Marks changed', cls: 'out-up', fee: 'No fee' };
  if (status === PAYABLE_STATUS) return { text: 'No change', cls: 'out-same', fee: 'Fee payable' };
  return { text: status, cls: 'out-open', fee: '—' };
}

function renderStudentProfile() {
  const el = document.getElementById('student-profile-view');
  if (!el || !currentUser) return;

  const all = myRequests();
  const s = profileSummary(all);
  const latest = all[0];
  const regNo = latest ? latest.regNo : '';
  const section = getSectionFromRegNo(regNo);
  const batch = getBatchFromEmail(currentUser.email);

  const history = all.length ? all.map(r => {
    const o = outcomeLabel(r.status);
    const questions = Array.isArray(r.questionItems) && r.questionItems.length
      ? r.questionItems.length : (r.questions || '').split(',').filter(q => q.trim()).length;
    return `
      <tr data-id="${escapeHtml(r.id)}" onclick="openStudentDetail(this.dataset.id)">
        <td>
          <div class="ph-subject">${escapeHtml(r.subject)}</div>
          <div class="ph-meta">${escapeHtml(r.examType)} · ${escapeHtml(r.term || '—')}</div>
        </td>
        <td class="num">${questions}</td>
        <td>${getBadge(r.status)}</td>
        <td><span class="ph-outcome ${o.cls}">${o.text}</span></td>
        <td class="ph-fee ${o.fee === 'Fee payable' ? 'ph-fee-due' : ''}">${o.fee}</td>
        <td class="ph-date">${formatDate(r.createdAt)}</td>
      </tr>`;
  }).join('') : `<tr><td colspan="6" class="students-empty">You haven't applied for re-evaluation yet.</td></tr>`;

  el.innerHTML = `
    <div class="profile-card">
      ${currentUser.picture ? `<img class="profile-photo" src="${escapeHtml(currentUser.picture)}" alt="" />`
        : `<div class="profile-photo profile-initials">${escapeHtml((currentUser.name || '?').charAt(0).toUpperCase())}</div>`}
      <div class="profile-who">
        <h3>${escapeHtml(currentUser.name || '—')}</h3>
        <div class="profile-email">${escapeHtml(currentUser.email)}</div>
        <div class="profile-tags">
          ${regNo ? `<span class="profile-tag">📋 ${escapeHtml(regNo)}</span>` : ''}
          ${section ? `<span class="profile-tag">🏷️ Section ${section}</span>` : ''}
          ${batch ? `<span class="profile-tag">🎓 ${escapeHtml(batch)}</span>` : ''}
          <span class="profile-tag">${currentUser.verified ? '✅ Signed in with Google' : '🛠️ Test login'}</span>
        </div>
      </div>
      <div class="profile-fee ${s.payable ? 'profile-fee-due' : ''}">
        <div class="profile-fee-count">${s.payable}</div>
        <div class="profile-fee-label">${s.payable === 1 ? 'time' : 'times'} the fee is payable</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-number">${s.total}</div><div class="stat-label">Applied</div></div>
      <div class="stat-card"><div class="stat-number">${s.pending}</div><div class="stat-label">Awaiting Result</div></div>
      <div class="stat-card"><div class="stat-number">${s.changed}</div><div class="stat-label">Marks Changed</div></div>
      <div class="stat-card"><div class="stat-number">${s.payable}</div><div class="stat-label">No Change</div></div>
    </div>

    <div class="profile-note">
      💡 The re-evaluation fee is charged only when your marks stay the same. If they go up
      <em>or</em> down, you pay nothing. The MBA office collects what's due.
    </div>

    <h4 class="profile-heading">Re-evaluation history</h4>
    <div class="students-table-wrap">
      <table class="students-table profile-history">
        <thead>
          <tr>
            <th>Subject</th>
            <th class="num">Questions</th>
            <th>Status</th>
            <th>Outcome</th>
            <th>Fee</th>
            <th>Applied</th>
          </tr>
        </thead>
        <tbody>${history}</tbody>
      </table>
    </div>`;
}

// ===== STUDENTS AND DEACTIVATION =====
// The office can switch re-evaluation off for a student. The server does the actual blocking
// (matched on email and registration number, including any others the student has used), so
// clearing the browser or signing in elsewhere changes nothing. Nothing is deleted: lifting a
// block only records who lifted it and when.
// The re-evaluation fee is charged only when the marks stay the same. A change either way
// — up or down — costs the student nothing, exactly as the demand-draft process worked.
const PAYABLE_STATUS = 'Resolved - No Change';

// Photos of the answer script are deleted this long after the professor closes the request.
// Kept in step with PHOTO_RETENTION_DAYS in server.js.
const PHOTO_RETENTION_DAYS = 30;

let _blocks = [];
let _studentBlocked = false;   // for the signed-in student
let _adminView = 'windows';
let _pendingBlock = null;      // student shown in the deactivate dialog

function isFeePayable(r) {
  return r.status === PAYABLE_STATUS;
}

function blockFromRow(b) {
  return {
    id: b.id,
    emails: b.emails || [],
    regNos: b.reg_nos || [],
    name: b.name || '',
    reason: b.reason,
    blockedBy: b.blocked_by,
    blockedAt: ms(b.blocked_at),
    liftedAt: ms(b.lifted_at),
    liftedBy: b.lifted_by,
    liftNote: b.lift_note,
  };
}

// Only the office can read the list and the reasons
async function loadBlocks() {
  if (!sb || !currentUser || currentUser.role !== 'admin') { _blocks = []; return; }
  const { data, error } = await sb.from('blocks').select('*').order('blocked_at', { ascending: false });
  if (error) { console.error('[Data] Deactivations:', error.message); return; }
  _blocks = data.map(blockFromRow);
}

// Students only learn whether they're blocked, never the office's reason
async function refreshBlockedState() {
  if (!sb || !currentUser || currentUser.role !== 'student') { _studentBlocked = false; return; }
  const { data, error } = await sb.rpc('am_i_blocked');
  if (!error) _studentBlocked = Boolean(data);
}

function activeBlocks() {
  return _blocks.filter(b => !b.liftedAt);
}

function blockForStudent(email, regNo) {
  const e = (email || '').toLowerCase();
  const r = normaliseRegNo(regNo);
  return activeBlocks().find(b => (e && b.emails.includes(e)) || (r && b.regNos.includes(r)));
}

// Same shape the server stores: "MBA/0042/62" and "mba/42/62" both become "MBA/42/62"
function normaliseRegNo(value) {
  return String(value == null ? '' : value).toUpperCase().replace(/\s+/g, '').replace(/\/0+(\d)/g, '/$1');
}

// One row per student, built from their requests plus anyone blocked without requests
function studentRows() {
  const rows = new Map();
  for (const r of getRequests()) {
    const key = (r.studentEmail || '').toLowerCase();
    if (!key) continue;
    if (!rows.has(key)) {
      rows.set(key, { email: key, name: r.studentName || '—', regNo: r.regNo || '', applied: 0, payable: 0, lastAt: 0 });
    }
    const row = rows.get(key);
    row.applied++;
    if (isFeePayable(r)) row.payable++;
    if (r.createdAt > row.lastAt) { row.lastAt = r.createdAt; row.name = r.studentName || row.name; row.regNo = r.regNo || row.regNo; }
  }
  for (const b of activeBlocks()) {
    for (const email of b.emails.length ? b.emails : ['—']) {
      if (!rows.has(email)) {
        rows.set(email, { email, name: b.name || '—', regNo: b.regNos[0] || '', applied: 0, payable: 0, lastAt: b.blockedAt });
      }
    }
  }
  return [...rows.values()]
    .map(row => ({ ...row, block: blockForStudent(row.email, row.regNo) || null }))
    .sort((a, b) => b.payable - a.payable || b.applied - a.applied || a.name.localeCompare(b.name));
}

// ===== FEES REGISTER =====
// Every re-evaluation that ended with the marks unchanged, and so costs the student the fee.
// One row per student with their count, and the individual re-evaluations behind each count.
let _feeSearch = '';
let _feeOpenRows = new Set();

function feeRows() {
  const rows = new Map();
  for (const r of getRequests()) {
    if (!isFeePayable(r)) continue;
    const key = (r.studentEmail || '').toLowerCase();
    if (!key) continue;
    if (!rows.has(key)) rows.set(key, { email: key, name: r.studentName || '—', regNo: r.regNo || '', items: [] });
    const row = rows.get(key);
    row.items.push(r);
    if (r.studentName) row.name = r.studentName;
    if (r.regNo) row.regNo = r.regNo;
  }
  return [...rows.values()]
    .map(row => ({ ...row, items: row.items.slice().sort((a, b) => b.createdAt - a.createdAt) }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}

function setFeeSearch(value) {
  _feeSearch = (value || '').trim().toLowerCase();
  renderAdminFees();
}

function toggleFeeRow(email) {
  if (_feeOpenRows.has(email)) _feeOpenRows.delete(email); else _feeOpenRows.add(email);
  renderAdminFees();
}

function renderAdminFees() {
  const el = document.getElementById('admin-fees-view');
  if (!el) return;

  const all = feeRows();
  const students = all.length;
  const charges = all.reduce((n, row) => n + row.items.length, 0);
  const resolved = getRequests().filter(r => r.status.startsWith('Resolved')).length;
  const share = resolved ? Math.round((charges / resolved) * 100) : 0;
  const repeat = all.filter(row => row.items.length > 1).length;

  const shown = all.filter(row => !_feeSearch ||
    row.email.includes(_feeSearch) || row.name.toLowerCase().includes(_feeSearch) || row.regNo.toLowerCase().includes(_feeSearch));

  const body = shown.length ? shown.map(row => {
    const open = _feeOpenRows.has(row.email);
    const detail = open ? `
      <tr class="fee-detail-row">
        <td colspan="5">
          <table class="fee-detail">
            <thead><tr><th>Subject</th><th>Exam</th><th>Term</th><th>Reviewed by</th><th>Applied</th><th>Decided</th></tr></thead>
            <tbody>${row.items.map(r => `
              <tr>
                <td>${escapeHtml(r.subject)}</td>
                <td>${escapeHtml(r.examType)}</td>
                <td>${escapeHtml(r.term || '—')}</td>
                <td>${escapeHtml(r.professorName || (r.professorNames || []).join(', ') || '—')}</td>
                <td>${formatDate(r.createdAt)}</td>
                <td>${r.reviewedAt ? formatDate(r.reviewedAt) : '—'}</td>
              </tr>`).join('')}</tbody>
          </table>
        </td>
      </tr>` : '';
    return `
      <tr class="fee-row" data-email="${escapeHtml(row.email)}" onclick="toggleFeeRow(this.dataset.email)">
        <td class="fee-caret">${open ? '▾' : '▸'}</td>
        <td>
          <div class="student-name">${escapeHtml(row.name)}</div>
          <div class="student-email">${escapeHtml(row.email)}</div>
        </td>
        <td>${escapeHtml(row.regNo || '—')}</td>
        <td class="num num-alert">${row.items.length}</td>
        <td class="fee-last">${formatDate(row.items[0].createdAt)}</td>
      </tr>${detail}`;
  }).join('')
    : `<tr><td colspan="5" class="students-empty">${_feeSearch ? 'No student matches that search.' : 'No re-evaluation has ended without a change in marks yet.'}</td></tr>`;

  el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-number">${charges}</div><div class="stat-label">Chargeable Re-evaluations</div></div>
      <div class="stat-card"><div class="stat-number">${students}</div><div class="stat-label">Students Who Owe</div></div>
      <div class="stat-card"><div class="stat-number">${repeat}</div><div class="stat-label">Charged More Than Once</div></div>
      <div class="stat-card"><div class="stat-number">${share}%</div><div class="stat-label">Of Decided Requests</div></div>
    </div>

    <div class="students-toolbar">
      <input type="search" id="fee-search" placeholder="Search by name, email or registration number…"
        value="${escapeHtml(_feeSearch)}" oninput="setFeeSearch(this.value)" />
      <span class="section-picker-hint">The fee is due only when the marks stayed the same. Click a student to see each charge.</span>
    </div>

    <div class="students-table-wrap">
      <table class="students-table fee-table">
        <thead>
          <tr>
            <th class="fee-caret"></th>
            <th>Student</th>
            <th>Registration No.</th>
            <th class="num">Times Charged</th>
            <th>Latest</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;

  const search = document.getElementById('fee-search');
  if (search && _feeSearch) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
}

function switchAdminView(view) {
  _adminView = view;
  document.querySelectorAll('#admin-view-switch .view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('admin-windows-view').style.display = view === 'windows' ? '' : 'none';
  document.getElementById('admin-requests-view').style.display = view === 'requests' ? '' : 'none';
  document.getElementById('admin-students-view').style.display = view === 'students' ? '' : 'none';
  document.getElementById('admin-fees-view').style.display = view === 'fees' ? '' : 'none';
  // The window counters belong to the windows and students views; the fees view brings its own
  document.getElementById('admin-stats').style.display = view === 'fees' ? 'none' : '';
  const heading = {
    windows: ['Re-Evaluation Windows', 'Students can only apply for re-evaluation while a window is open for their exam and section.'],
    requests: ['All Requests', 'Every re-evaluation request raised, in every window — open, closed or past.'],
    students: ['Students', 'Everyone who has applied, what they owe, and who is currently deactivated.'],
    fees: ['Fees Register', 'Every re-evaluation that ended with the marks unchanged — those are the ones the student pays for.'],
  }[view];
  document.getElementById('admin-title').textContent = heading[0];
  document.getElementById('admin-subtitle').textContent = heading[1];
  document.getElementById('admin-open-window-btn').style.display = view === 'windows' ? '' : 'none';
  document.getElementById('admin-deactivate-btn').style.display = view === 'students' ? '' : 'none';
  renderAdminDashboard();
}

function renderAdminStudents() {
  const search = (document.getElementById('student-search').value || '').trim().toLowerCase();
  const rows = studentRows().filter(row => !search ||
    row.email.includes(search) || row.name.toLowerCase().includes(search) || row.regNo.toLowerCase().includes(search));

  const body = document.getElementById('students-tbody');
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="students-empty">${search ? 'No student matches that search.' : 'No students have applied yet.'}</td></tr>`;
  } else {
    body.innerHTML = rows.map(row => `
      <tr class="${row.block ? 'row-blocked' : ''}">
        <td>
          <div class="student-name">${escapeHtml(row.name)}</div>
          <div class="student-email">${escapeHtml(row.email)}</div>
        </td>
        <td>${escapeHtml(row.regNo || '—')}</td>
        <td class="num">${row.applied}</td>
        <td class="num ${row.payable ? 'num-alert' : ''}">${row.payable}</td>
        <td>${row.block
          ? `<span class="win-badge badge-blocked" title="${escapeHtml(row.block.reason)}">Deactivated</span>`
          : '<span class="win-badge badge-active">Active</span>'}</td>
        <td>
          ${row.block
            ? `<button class="btn-secondary btn-end" data-id="${escapeHtml(row.block.id)}" onclick="reactivateStudent(this.dataset.id)">Reactivate</button>`
            : `<button class="btn-secondary btn-end" data-email="${escapeHtml(row.email)}" data-reg="${escapeHtml(row.regNo)}" data-name="${escapeHtml(row.name)}"
                 onclick="showDeactivateForm(this.dataset.email, this.dataset.reg, this.dataset.name)">Deactivate</button>`}
        </td>
      </tr>`).join('');
  }

  // The record: who was deactivated, why, and whether it was lifted
  const log = document.getElementById('blocks-log');
  if (!_blocks.length) {
    log.innerHTML = '';
  } else {
    log.innerHTML = `<h4>Deactivation record</h4>` + _blocks.slice().sort((a, b) => b.blockedAt - a.blockedAt).map(b => `
      <div class="block-row ${b.liftedAt ? 'block-lifted' : ''}">
        <div>
          <strong>${escapeHtml(b.emails.join(', ') || '—')}</strong>
          ${b.regNos.length ? `<span class="block-reg">${escapeHtml(b.regNos.join(', '))}</span>` : ''}
          <div class="block-reason">“${escapeHtml(b.reason)}”</div>
        </div>
        <div class="block-meta">
          Deactivated ${formatDateTime(b.blockedAt)} by ${escapeHtml(b.blockedBy)}
          ${b.liftedAt ? `<br/>Reactivated ${formatDateTime(b.liftedAt)} by ${escapeHtml(b.liftedBy)}${b.liftNote ? ' — ' + escapeHtml(b.liftNote) : ''}` : ''}
        </div>
      </div>`).join('');
  }
}

// ===== ALL REQUESTS (admin) =====
// Every request ever raised, filterable by status, window and term, with a read-only detail view.
function windowOptionLabel(w) {
  return `${w.subject} · ${w.examType} · ${w.term}` + (w.sections.length ? ` · Sec ${w.sections.join(', ')}` : '');
}

// Refill a <select>, keeping the current choice when it still exists
function fillSelect(el, options) {
  const current = el.value;
  el.innerHTML = options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
  el.value = options.some(([value]) => value === current) ? current : '';
}

function fillRequestFilters() {
  const ws = getWindows().slice().sort((a, b) => b.startsAt - a.startsAt);
  const windowOpts = [['', 'All windows'], ...ws.map(w => [w.id, windowOptionLabel(w)])];
  if (getRequests().some(r => !ws.some(w => w.id === r.windowId))) windowOpts.push(['none', 'No window on record']);
  fillSelect(document.getElementById('req-window'), windowOpts);

  const terms = [...new Set(getRequests().map(r => r.term).filter(Boolean))].sort().reverse();
  fillSelect(document.getElementById('req-term'), [['', 'All terms'], ...terms.map(t => [t, t])]);
}

function filteredAdminRequests() {
  const search = (document.getElementById('req-search').value || '').trim().toLowerCase();
  const status = document.getElementById('req-status').value;
  const windowId = document.getElementById('req-window').value;
  const term = document.getElementById('req-term').value;
  const windowIds = new Set(getWindows().map(w => w.id));
  return getRequests().filter(r =>
    (!status || (status === 'resolved' ? r.status.startsWith('Resolved')
      : status === 'changed' ? r.status.startsWith('Resolved') && r.status !== PAYABLE_STATUS
      : r.status === status)) &&
    (!windowId || (windowId === 'none' ? !windowIds.has(r.windowId) : r.windowId === windowId)) &&
    (!term || r.term === term) &&
    (!search || [r.studentName, r.studentEmail, r.regNo, r.subject, r.courseCode, r.professorName, r.id]
      .some(v => (v || '').toLowerCase().includes(search)))
  ).sort((a, b) => b.createdAt - a.createdAt);
}

function renderAdminRequests() {
  fillRequestFilters();
  const rows = filteredAdminRequests();
  const total = getRequests().length;
  document.getElementById('req-count').textContent = rows.length === total
    ? `${total} request${total === 1 ? '' : 's'}`
    : `Showing ${rows.length} of ${total} requests`;

  const body = document.getElementById('req-tbody');
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="students-empty">${total ? 'No request matches these filters.' : 'No requests have been raised yet.'}</td></tr>`;
    return;
  }
  body.innerHTML = rows.map(r => `
    <tr class="req-row" data-id="${escapeHtml(r.id)}" onclick="openAdminRequest(this.dataset.id)" title="View details">
      <td class="req-date">${formatDateTime(r.createdAt)}</td>
      <td>
        <div class="student-name">${escapeHtml(r.studentName)}</div>
        <div class="student-email">${escapeHtml(r.regNo)} · ${escapeHtml(r.studentEmail)}</div>
      </td>
      <td>
        <div class="student-name">${escapeHtml(r.subject)}</div>
        <div class="student-email">${escapeHtml(r.examType)} · ${escapeHtml(r.term || '—')}</div>
      </td>
      <td>${escapeHtml(r.section || '—')}</td>
      <td>${escapeHtml(r.professorName || '—')}</td>
      <td>${getBadge(r.status)}</td>
    </tr>`).join('');
}

// Opened from a window's details: the requests view, narrowed to that window
function showWindowRequests(windowId) {
  document.getElementById('req-search').value = '';
  document.getElementById('req-status').value = '';
  document.getElementById('req-term').value = '';
  fillRequestFilters();
  document.getElementById('req-window').value = windowId;
  switchAdminView('requests');
}

function openAdminRequest(id) {
  const r = getRequests().find(x => x.id === id);
  if (!r) return;
  const w = getWindows().find(x => x.id === r.windowId);
  const decision = decisionHtml(r, "Professor's Decision" + (r.reviewedAt ? ' · ' + formatDateTime(r.reviewedAt) : ''));

  document.getElementById('ar-sub').innerHTML = `${getBadge(r.status)} Submitted ${formatDateTime(r.createdAt)}`;
  document.getElementById('ar-body').innerHTML = `
    <div class="detail-section">
      <h4>Request Information</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>Student</label><span>${escapeHtml(r.studentName)}</span></div>
        <div class="detail-item"><label>Email</label><span>${escapeHtml(r.studentEmail)}</span></div>
        <div class="detail-item"><label>Registration No.</label><span>${escapeHtml(r.regNo)}</span></div>
        <div class="detail-item"><label>Section</label><span>${escapeHtml(r.section || '—')}</span></div>
        <div class="detail-item"><label>Subject</label><span>${escapeHtml(r.subject)}${r.courseCode ? ' (' + escapeHtml(r.courseCode) + ')' : ''}</span></div>
        <div class="detail-item"><label>Exam Type</label><span>${escapeHtml(r.examType)}</span></div>
        <div class="detail-item"><label>Term</label><span>${escapeHtml(r.term || '—')}</span></div>
        <div class="detail-item"><label>Professor</label><span>${escapeHtml(r.professorName || '—')}</span></div>
        <div class="detail-item"><label>Window</label><span>${w
          ? `<a href="#" onclick="event.preventDefault(); closeModal('admin-request-modal'); openWindowDetail('${w.id}')">${escapeHtml(windowOptionLabel(w))}</a>`
          : '—'}</span></div>
        <div class="detail-item"><label>Request ID</label><span style="font-family:monospace;font-size:12px">${escapeHtml(r.id)}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>Questions</h4>
      ${questionListHtml(r, { after: marksAfter(r) })}
    </div>
    ${decision}
    ${renderHistoryTimeline(r)}`;
  openModal('admin-request-modal');
}

// The filtered list as a spreadsheet, for the exam cell's records
function exportAdminRequests() {
  const rows = filteredAdminRequests();
  if (!rows.length) { showToast('There are no requests to export.', 'info'); return; }
  const cell = v => {
    const text = String(v == null ? '' : v);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  const when = ts => ts ? new Date(ts).toLocaleString('en-IN') : '';
  const header = ['Request ID', 'Submitted', 'Student', 'Email', 'Registration No.', 'Subject', 'Course Code', 'Exam Type',
    'Term', 'Section', 'Professor', 'Questions', 'Status', 'Original Marks', 'Updated Marks', 'Remarks', 'Decided'];
  const lines = [header, ...rows.map(r => [r.id, when(r.createdAt), r.studentName, r.studentEmail, r.regNo, r.subject,
    r.courseCode, r.examType, r.term, r.section, r.professorName, r.questions, r.status, r.originalMarks,
    r.updatedMarks,
    r.professorRemarks, when(r.reviewedAt)])].map(line => line.map(cell).join(','));
  // The byte-order mark makes Excel read ₹ and names with accents correctly
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reevaluation-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function showDeactivateForm(email, regNo, name) {
  _pendingBlock = { email: email || '', regNo: regNo || '', name: name || '' };
  const known = Boolean(email || regNo);
  document.getElementById('block-form').reset();
  document.getElementById('b-email').value = _pendingBlock.email;
  document.getElementById('b-regno').value = _pendingBlock.regNo;
  document.getElementById('b-email').readOnly = known;
  document.getElementById('b-regno').readOnly = known;
  document.getElementById('block-who').textContent = known
    ? `${name || email}${regNo ? ' · ' + regNo : ''}`
    : 'Enter the student below';
  document.getElementById('b-confirm').checked = false;
  updateDeactivateButton();
  openModal('block-modal');
}

function updateDeactivateButton() {
  const reason = document.getElementById('b-reason').value.trim();
  const confirmed = document.getElementById('b-confirm').checked;
  document.getElementById('block-submit').disabled = reason.length < 5 || !confirmed;
}

async function submitDeactivate(e) {
  e.preventDefault();
  const email = document.getElementById('b-email').value.trim();
  const regNo = document.getElementById('b-regno').value.trim();
  const reason = document.getElementById('b-reason').value.trim();
  if (!email && !regNo) { showToast('Enter the student\'s email or registration number.', 'error'); return; }
  if (reason.length < 5) { showToast('Please give a reason — it is kept in the record.', 'error'); return; }
  if (!document.getElementById('b-confirm').checked) { showToast('Please tick the confirmation box.', 'error'); return; }

  const btn = document.getElementById('block-submit');
  btn.disabled = true;
  try {
    const { data, error } = await sb.from('blocks').insert({
      emails: email ? [email] : [],
      reg_nos: regNo ? [regNo] : [],
      name: (_pendingBlock && _pendingBlock.name) || '',
      reason,
    }).select().single();
    if (error) throw new Error(dbMessage(error));
    const block = blockFromRow(data);
    _blocks.unshift(block);
    closeModal('block-modal');
    renderAdminDashboard();
    showToast(`Re-evaluation deactivated for ${block.emails.join(', ') || block.regNos.join(', ')}.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function reactivateStudent(blockId) {
  const block = _blocks.find(b => b.id === blockId);
  if (!block) return;
  const who = block.emails.join(', ') || block.regNos.join(', ');
  if (!confirm(`Turn re-evaluation back on for ${who}?\n\nThey will be able to apply again in any open window.`)) return;
  const note = prompt('Note for the record (optional):', '') || '';
  try {
    const { data, error } = await sb.from('blocks').update({ lifted_at: new Date().toISOString(), lift_note: note })
      .eq('id', blockId).select().single();
    if (error) throw new Error(dbMessage(error));
    Object.assign(block, blockFromRow(data));
    renderAdminDashboard();
    showToast(`Re-evaluation reactivated for ${who}.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== FACULTY TEST CREDENTIALS PANEL (DEV MODE) =====
function populateCreds() {
  const container = document.getElementById('creds-entries');
  if (!container) return;
  container.innerHTML = Object.entries(PROF_EMAILS).map(([name, email]) => `
    <div class="cred-row">
      <span class="cred-name">${escapeHtml(name.replace('Prof. ', ''))}</span>
      <span class="cred-email" title="Click to log in as ${escapeHtml(name)}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(name)}"
        onclick="devSignIn(this)">${escapeHtml(email)}</span>
    </div>`).join('');
}

// DEV: dummy admin accounts
function populateAdminCreds() {
  const container = document.getElementById('admin-creds-entries');
  if (!container) return;
  container.innerHTML = ADMIN_ACCOUNTS.map(a => `
    <div class="cred-row">
      <span class="cred-name">${escapeHtml(a.name)}</span>
      <span class="cred-email" title="Click to log in as ${escapeHtml(a.name)}" data-email="${escapeHtml(a.email)}" data-name="${escapeHtml(a.name)}"
        onclick="devSignIn(this)">${escapeHtml(a.email)}</span>
    </div>`).join('');
}

// ===== [DEV] TEST ACCOUNTS =====
// The dummy admin and faculty accounts have no mailbox, so they sign in with a password. Each
// is created in Supabase (Authentication → Users → Add user, "Auto Confirm User" ticked) and
// listed in the test_accounts table. The session is real, so the database treats a dummy exactly
// like the person it stands in for. The password is typed each time; it is never in this file.
async function devSignIn(el) {
  const input = el.closest('.creds-list').querySelector('.dev-password');
  const password = input.value;
  if (!password) { showToast('Enter the test password first.', 'error'); input.focus(); return; }
  if (!sb) { showToast('Sign-in could not load. Check your internet connection and refresh.', 'error'); return; }
  const email = el.dataset.email;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showToast(/invalid login/i.test(error.message)
      ? `${email} isn't set up as a test account with that password.`
      : 'Sign-in failed: ' + error.message, 'error');
    return;
  }
  input.value = '';
  await startSession(data.session);
  showToast('Signed in as ' + currentUser.name, 'info');
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
const PEACEFUL_LABELS = ['Total Battles', 'Awaiting Verdict', 'In The Funnel', 'Case Closed', 'Paid The Price'];
const NORMAL_LABELS = ['Total Requests', 'Pending', 'Under Review', 'Resolved', 'Fee Payable'];

function togglePeaceful() {
  _peacefulMode = !_peacefulMode;
  const btn = document.getElementById('peaceful-toggle-student');
  if (btn) {
    btn.textContent = _peacefulMode ? '🔥 Intense' : '🧘 Peaceful';
    btn.classList.toggle('peaceful-active', _peacefulMode);
  }
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
    { label: labels[4], val: all.filter(isFeePayable).length },
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
    // No fee counter here: what a student owes the office is not the professor's business
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
  const wrap = document.getElementById('desperation-wrap');
  const text = document.getElementById('desperation-text');
  const fill = document.getElementById('desperation-fill');
  if (!wrap || !text || !fill) return;
  const count = questionCards().filter(function (c) { return c.querySelector('.q-number').value.trim(); }).length;
  if (!count) { wrap.style.display = 'none'; return; }
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
