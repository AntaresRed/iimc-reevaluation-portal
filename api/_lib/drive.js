/**
 * Google Drive storage for question photos.
 * Zero dependencies: plain HTTPS calls to the Drive REST API.
 *
 * Set up once with:  node connect-drive.js
 * That writes GDRIVE_REFRESH_TOKEN and GDRIVE_ROOT_FOLDER_ID into .env.
 *
 * Files are private to the connected Google account — nothing is ever shared by link.
 * The portal fetches them with its own credentials and streams them to the browser.
 */

const https = require('https');
const { URLSearchParams } = require('url');

const CLIENT_ID = process.env.GDRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN || '';
const ROOT_FOLDER_ID = process.env.GDRIVE_ROOT_FOLDER_ID || '';

// Only files this app creates — the portal can never read the rest of the Drive
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const ROOT_FOLDER_NAME = 'IIM Calcutta Re-Evaluation';

let _disabledReason = null;

function driveEnabled() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && !_disabledReason);
}

function driveStatus() {
  if (_disabledReason) return `off (${_disabledReason})`;
  if (!CLIENT_ID || !CLIENT_SECRET) return 'off (no GDRIVE_CLIENT_ID / GDRIVE_CLIENT_SECRET in .env)';
  if (!REFRESH_TOKEN) return 'off (run: node connect-drive.js)';
  return 'on — photos stored in Google Drive';
}

// ===== HTTP =====
function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, buffer: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function json(options, body) {
  const res = await request(options, body);
  let parsed = {};
  try { parsed = JSON.parse(res.buffer.toString('utf8')); } catch { /* not JSON */ }
  if (res.status < 200 || res.status >= 300) {
    const message = (parsed.error && (parsed.error.message || parsed.error_description)) || `Drive returned ${res.status}`;
    throw new Error(message);
  }
  return parsed;
}

// ===== ACCESS TOKENS =====
let _token = null;         // { value, expiresAt }

async function accessToken() {
  if (_token && _token.expiresAt > Date.now() + 60000) return _token.value;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();
  try {
    const data = await json({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, body);
    _token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
    return _token.value;
  } catch (e) {
    // A revoked or expired refresh token can't be recovered without re-running the setup
    if (/invalid_grant|unauthorized/i.test(e.message)) {
      _disabledReason = 'Google access was revoked — run: node connect-drive.js';
    }
    throw e;
  }
}

async function driveApi(method, path, { body, headers = {} } = {}) {
  const token = await accessToken();
  return json({
    hostname: 'www.googleapis.com',
    path,
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
  }, body);
}

// ===== FOLDERS =====
// Drive happily creates two folders with the same name, so look before creating.
const _folderCache = new Map();   // "parentId/name" → folder id

function escapeQuery(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// File and folder names: keep it readable, drop what Drive dislikes
function safeName(value, fallback = 'Untitled') {
  const clean = String(value == null ? '' : value).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean || fallback;
}

async function ensureFolder(name, parentId) {
  const key = `${parentId || 'root'}/${name}`;
  if (_folderCache.has(key)) return _folderCache.get(key);

  const q = [
    `name = '${escapeQuery(name)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
    parentId ? `'${escapeQuery(parentId)}' in parents` : null,
  ].filter(Boolean).join(' and ');

  const found = await driveApi('GET', `/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`);
  let id = found.files && found.files[0] && found.files[0].id;

  if (!id) {
    const created = await driveApi('POST', '/drive/v3/files?fields=id', {
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) }),
      headers: { 'Content-Type': 'application/json' },
    });
    id = created.id;
  }
  _folderCache.set(key, id);
  return id;
}

async function rootFolder() {
  if (ROOT_FOLDER_ID) return ROOT_FOLDER_ID;
  return ensureFolder(ROOT_FOLDER_NAME, null);
}

// IIM Calcutta Re-Evaluation / Term 2, 2025-26 — Management Game — End Term / MBA-0170-62 — Name — ID
async function folderForRequest(request, windowInfo) {
  const root = await rootFolder();
  const examFolder = safeName(
    [windowInfo.term, windowInfo.subject, windowInfo.examType].filter(Boolean).join(' — '),
    'Re-evaluation');
  const examId = await ensureFolder(examFolder, root);
  const studentFolder = safeName(
    [request.regNo, request.studentName, request.id].filter(Boolean).join(' — '),
    request.id);
  return ensureFolder(studentFolder, examId);
}

// ===== PHOTOS =====
const MIME_BY_EXT = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

async function uploadPhoto(folderId, name, buffer, mimeType) {
  const token = await accessToken();
  const boundary = 'reval' + Date.now().toString(36);
  const metadata = JSON.stringify({ name, parents: [folderId] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const data = await json({
    hostname: 'www.googleapis.com',
    path: '/upload/drive/v3/files?uploadType=multipart&fields=id',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': body.length,
    },
  }, body);
  return data.id;
}

// Permanently remove a file. Drive answers 204; a file already gone answers 404, which is fine.
async function deletePhoto(fileId) {
  const token = await accessToken();
  const res = await request({
    hostname: 'www.googleapis.com',
    path: `/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204 || res.status === 404) return;
  throw new Error(`Drive returned ${res.status} when deleting that photo.`);
}

// Remove a request's folder once its photos are gone. Skipped if anything is still inside,
// so a folder that was reused or refilled is never taken down by mistake.
async function deleteFolderIfEmpty(folderId) {
  const q = `'${escapeQuery(folderId)}' in parents and trashed = false`;
  const children = await driveApi('GET', `/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`);
  if (children.files && children.files.length) return false;
  await deletePhoto(folderId);           // same endpoint, folders included
  for (const [key, id] of _folderCache) if (id === folderId) _folderCache.delete(key);
  return true;
}

async function downloadPhoto(fileId) {
  const token = await accessToken();
  const res = await request({
    hostname: 'www.googleapis.com',
    path: `/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error(`Drive returned ${res.status} for that photo.`);
  return res.buffer;
}

// Upload every photo of a request. Returns [{ name, driveId }]; throws if Drive is unreachable,
// and the caller then falls back to storing the files on this machine.
async function uploadRequestPhotos(request, windowInfo, photos) {
  const folderId = await folderForRequest(request, windowInfo);
  const saved = [];
  for (const photo of photos) {
    const mimeType = MIME_BY_EXT[photo.ext] || 'application/octet-stream';
    saved.push({ name: photo.name, driveId: await uploadPhoto(folderId, photo.name, photo.buffer, mimeType) });
  }
  return { folderId, photos: saved };
}

module.exports = {
  driveEnabled,
  driveStatus,
  uploadRequestPhotos,
  downloadPhoto,
  deletePhoto,
  deleteFolderIfEmpty,
  safeName,
  SCOPE,
  ROOT_FOLDER_NAME,
  ensureFolder,
  accessToken,
};
