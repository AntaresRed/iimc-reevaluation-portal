/**
 * What counts as an acceptable question photo.
 * Shared by the local server and the Vercel upload function so both agree.
 */

const PHOTO_TYPES = {
  'image/jpeg': { ext: 'jpg', magic: b => b[0] === 0xFF && b[1] === 0xD8 },
  'image/png': { ext: 'png', magic: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  'image/webp': { ext: 'webp', magic: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// "data:image/jpeg;base64,..." -> { buffer, ext }, checking the bytes really are that image type.
// Throws with a message meant for the student.
function decodePhoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw new Error('Photos must be JPG, PNG or WebP images.');
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > MAX_PHOTO_BYTES) throw new Error('Each photo must be under 3 MB.');
  const type = PHOTO_TYPES[m[1]];
  if (buffer.length < 12 || !type.magic(buffer)) throw new Error('One of the photos is not a valid image.');
  return { buffer, ext: type.ext, mimeType: m[1] };
}

// A file name the student chose is never trusted: keep only safe characters, and make sure
// the extension matches the bytes we actually decoded.
function safePhotoName(name, ext, fallback = 'photo') {
  const base = String(name == null ? '' : name)
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
    .replace(/[^A-Za-z0-9()._ -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
  return `${base || fallback}.${ext}`;
}

module.exports = { PHOTO_TYPES, MAX_PHOTO_BYTES, decodePhoto, safePhotoName };
