/**
 * GET /api/photo-get?id=<drive file id>
 *
 * Streams one question photo back from Drive. The files are private to the portal's Google
 * account and are never shared by link, so this is the only way to see them.
 *
 * The portal holds the scope drive.file, which reaches only files this app itself created.
 * Even so this endpoint hands out a photo to anyone who knows its id. Ids are opaque and
 * never published, but once re-evaluation requests live in Supabase this should check that
 * the caller is the student who submitted it or the professor reviewing it.
 */

const drive = require('./_lib/drive.js');

const EXT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Use GET.' });
    return;
  }
  if (!drive.driveEnabled()) {
    res.status(503).json({ error: 'Photo storage is not configured.' });
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id') || '';
  const ext = (url.searchParams.get('ext') || 'jpg').toLowerCase();

  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    res.status(400).json({ error: 'Not a photo id.' });
    return;
  }

  try {
    const buffer = await drive.downloadPhoto(id);
    res.setHeader('Content-Type', EXT_TYPES[ext] || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    // The bytes never change once uploaded, and they are one student's answer script
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.status(200).send(buffer);
  } catch (e) {
    res.status(404).json({ error: 'That photo is no longer available.' });
  }
};
