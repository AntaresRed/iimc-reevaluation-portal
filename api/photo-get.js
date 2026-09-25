/**
 * GET /api/photo-get?id=<drive file id>   (with the caller's Supabase token)
 *
 * Streams one question photo back from Drive. The files are private to the portal's Google
 * account and are never shared by link, so this is the only way to see them.
 *
 * A photo is handed over only if the caller may see its request: the student who raised it,
 * the professors deciding it, or an admin. The database's own rules decide that.
 */

const drive = require('./_lib/drive.js');
const { requireUser, selectAsUser } = require('./_lib/auth.js');

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
    const user = await requireUser(req);
    const visible = await selectAsUser(user, `question_photos?drive_id=eq.${encodeURIComponent(id)}&select=id`);
    if (!visible.length) {
      res.status(404).json({ error: 'That photo is not available to you.' });
      return;
    }
  } catch (e) {
    res.status(e.status || 401).json({ error: e.message });
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
