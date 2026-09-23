/**
 * POST /api/photo-upload
 *
 * Puts one question photo into Google Drive and returns its file id. The hosted portal has
 * no server of its own, so without this the photo would only ever live in the student's
 * browser. One photo per call: Vercel caps a request body at about 4.5 MB, and a batch of
 * phone pictures would sail past that.
 *
 * Body: { requestId, regNo, studentName, subject, examType, term, name, dataUrl }
 * Reply: { name, driveId, folderId }
 */

const drive = require('./_lib/drive.js');
const { decodePhoto, safePhotoName } = require('./_lib/photos.js');
const { requireUser } = require('./_lib/auth.js');

const MAX_BODY_BYTES = 6 * 1024 * 1024;

function readBody(req) {
  // Vercel usually parses JSON for us; fall back to reading the stream when it has not.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { reject(new Error('That photo is too large to upload.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('The upload was not valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }
  if (!drive.driveEnabled()) {
    res.status(503).json({ error: 'Photo storage is not configured: ' + drive.driveStatus() });
    return;
  }

  try {
    const user = await requireUser(req);
    const body = await readBody(req);

    const requestId = clean(body.requestId, 80);
    if (!/^[A-Za-z0-9-]{1,80}$/.test(requestId)) {
      res.status(400).json({ error: 'Missing or malformed request id.' });
      return;
    }

    const { buffer, ext, mimeType } = decodePhoto(body.dataUrl);
    const name = safePhotoName(body.name, ext);

    // The folder is named from the request, so a student's photos stay together and the
    // sweep can delete the whole folder later.
    const windowInfo = {
      term: clean(body.term, 40),
      subject: clean(body.subject, 120),
      examType: clean(body.examType, 60),
    };
    const requestInfo = {
      id: requestId,
      regNo: clean(body.regNo, 40),
      // Trust the signed-in address over anything the form claims
      studentName: clean(body.studentName, 120) || user.email,
    };

    const uploaded = await drive.uploadRequestPhotos(requestInfo, windowInfo,
      [{ name, buffer, ext, mimeType }]);

    res.status(200).json({
      name,
      driveId: uploaded.photos[0].driveId,
      folderId: uploaded.folderId,
    });
  } catch (e) {
    const status = e.status || 400;
    if (status >= 500) console.error('photo-upload failed:', e);
    res.status(status).json({ error: e.message });
  }
};
