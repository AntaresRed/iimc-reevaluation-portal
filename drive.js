/**
 * Google Drive storage for question photos.
 *
 * The implementation lives in api/_lib/drive.js so the local server and the Vercel
 * serverless functions share exactly one copy. Anything under api/ that starts with an
 * underscore is bundled with the functions but never served as a route or a static file.
 *
 * Set up once with:  node connect-drive.js
 * That writes GDRIVE_REFRESH_TOKEN and GDRIVE_ROOT_FOLDER_ID into .env.
 */

module.exports = require('./api/_lib/drive.js');
