/**
 * One-time Google Drive setup for the Re-Evaluation Portal.
 *
 *   node connect-drive.js
 *
 * Opens Google's consent page, then writes GDRIVE_REFRESH_TOKEN and
 * GDRIVE_ROOT_FOLDER_ID into .env. Run it again any time to reconnect.
 *
 * Needs GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET in .env first — see the
 * instructions printed below if they're missing.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { URLSearchParams } = require('url');

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, '.env');
const PORT = 53682;                                   // loopback port for Google's redirect
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

// Load .env the same way server.js does
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const CLIENT_ID = process.env.GDRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET || '';

function setupHelp() {
  console.log('');
  console.log('  Google Drive is not set up yet. It takes about 5 minutes:');
  console.log('');
  console.log('  1. Go to  https://console.cloud.google.com/  and pick (or create) a project.');
  console.log('  2. APIs & Services → Library → search "Google Drive API" → Enable.');
  console.log('  3. APIs & Services → OAuth consent screen → External → fill in the app name');
  console.log('     and your email → add your own Google account under "Test users".');
  console.log('  4. APIs & Services → Credentials → Create credentials → OAuth client ID →');
  console.log('     Application type: Desktop app → Create.');
  console.log('  5. Copy the Client ID and Client secret into .env:');
  console.log('');
  console.log('       GDRIVE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com');
  console.log('       GDRIVE_CLIENT_SECRET=xxxxxxxxxxxxxxxx');
  console.log('');
  console.log('  6. Run this again:  node connect-drive.js');
  console.log('');
}

// Write (or replace) a key in .env, keeping everything else as it is
function saveToEnv(values) {
  let text = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    if (pattern.test(text)) text = text.replace(pattern, line);
    else text = text.replace(/\s*$/, '\n') + line + '\n';
  }
  fs.writeFileSync(ENV_FILE, text, 'utf8');
}

function openInBrowser(url) {
  const command = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(command, () => { /* if it fails, the user can copy the link below */ });
}

function page(title, message) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
    <body style="font-family:system-ui,sans-serif;background:#f5efe6;color:#2c1a0e;display:flex;
      align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="background:#fff;border:1px solid rgba(93,46,12,.15);border-radius:10px;padding:32px 40px;
        box-shadow:0 12px 40px rgba(93,46,12,.16);max-width:460px">
        <h2 style="margin:0 0 8px;color:#5D2E0C">${title}</h2>
        <p style="margin:0;line-height:1.6">${message}</p>
      </div></body>`;
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  }).toString();

  const https = require('https');
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(data); } catch { /* not JSON */ }
        if (res.statusCode !== 200) reject(new Error(parsed.error_description || parsed.error || `Google returned ${res.statusCode}`));
        else resolve(parsed);
      });
    });
    req.on('error', reject);
    req.end(body);
  });
}

function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) { setupHelp(); process.exit(1); }

  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',          // needed for a refresh token
    prompt: 'consent',               // so we always get one, even on a repeat run
    state,
  }).toString();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname !== '/callback') { res.writeHead(404); res.end(); return; }

    const respond = (code, html) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); };
    const error = url.searchParams.get('error');
    if (error) {
      respond(400, page('Not connected', `Google said: <code>${error}</code>. You can close this tab and run the command again.`));
      console.error(`\n  ❌  Google refused: ${error}\n`);
      server.close(); process.exit(1);
    }
    if (url.searchParams.get('state') !== state) {
      respond(400, page('Not connected', 'That response did not match this setup attempt. Please run the command again.'));
      server.close(); process.exit(1);
    }

    try {
      const tokens = await exchangeCode(url.searchParams.get('code'));
      if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Remove the portal from your Google account access list and try again.');
      saveToEnv({ GDRIVE_REFRESH_TOKEN: tokens.refresh_token });

      // Create the top-level folder now, so photos land somewhere predictable
      process.env.GDRIVE_REFRESH_TOKEN = tokens.refresh_token;
      const drive = require('./drive.js');
      const folderId = await drive.ensureFolder(drive.ROOT_FOLDER_NAME, null);
      saveToEnv({ GDRIVE_ROOT_FOLDER_ID: folderId });

      respond(200, page('Google Drive connected',
        `Question photos will be saved to the <strong>${drive.ROOT_FOLDER_NAME}</strong> folder in your Drive.
         You can close this tab and restart the portal.`));
      console.log('');
      console.log('  ✅  Google Drive connected.');
      console.log(`      Folder: "${drive.ROOT_FOLDER_NAME}" (id ${folderId})`);
      console.log('      Saved GDRIVE_REFRESH_TOKEN and GDRIVE_ROOT_FOLDER_ID to .env');
      console.log('      Restart the portal for it to take effect.');
      console.log('');
      server.close(); process.exit(0);
    } catch (e) {
      respond(500, page('Not connected', `Something went wrong: ${e.message}`));
      console.error(`\n  ❌  ${e.message}\n`);
      server.close(); process.exit(1);
    }
  });

  server.on('error', err => {
    console.error(`\n  ❌  Could not listen on port ${PORT}: ${err.message}\n`);
    process.exit(1);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('  🔗  Connecting the portal to Google Drive');
    console.log('  ─────────────────────────────────────────');
    console.log('  A browser tab should open. Sign in and allow access.');
    console.log('  If it does not open, paste this into your browser:');
    console.log('');
    console.log('  ' + authUrl);
    console.log('');
    console.log('  Waiting for you to approve… (Ctrl+C to cancel)');
    openInBrowser(authUrl);
  });
}

main();
