/**
 * Who is calling?
 *
 * The upload endpoint writes into a real Google Drive, so it must not be open to the
 * internet. The caller sends the Supabase access token it already holds from signing in,
 * and this asks Supabase whether that token is genuine. No JWT secret is needed and
 * nothing is trusted from the request itself.
 */

const https = require('https');
const { envValue, assertHeaderSafe, describeBadChars } = require('./env.js');

// The Supabase anon key is publishable by design — it already ships to every visitor
// inside js/app.js, and row-level security is what actually guards the data. Keeping a
// copy here means a mistyped or mangled environment variable cannot stop sign-ins being
// verified. If the project's key is ever rotated, change it in BOTH places.
const PUBLISHABLE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludW5xd21ya3lwdXZhcmdjZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjM5MTYsImV4cCI6MjEwNTczOTkxNn0.5L8iXBgMPGWGO9AAjqu6fDYfNdohgaEwqg5N9oAiYM8';

const SUPABASE_URL = envValue('SUPABASE_URL', 'https://ynunqwmrkypuvargceen.supabase.co');
// A value that survived cleaning but still cannot be sent is worse than no value at all,
// so fall back to the built-in key and say so in the log rather than failing every upload.
const SUPABASE_ANON_KEY = (() => {
  const fromEnv = envValue('SUPABASE_ANON_KEY');
  if (!fromEnv) return PUBLISHABLE_ANON_KEY;
  try {
    return assertHeaderSafe('SUPABASE_ANON_KEY', fromEnv);
  } catch {
    console.error('SUPABASE_ANON_KEY contains ' + describeBadChars(fromEnv) +
      ' and was ignored; using the key built into the code. Re-enter it to silence this.');
    return PUBLISHABLE_ANON_KEY;
  }
})();
const ALLOWED_DOMAIN = envValue('ALLOWED_EMAIL_DOMAIN', 'email.iimcal.ac.in');

function getJson(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers,
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch { /* non-JSON error page */ }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.setTimeout(8000, () => req.destroy(new Error('Supabase did not answer in time.')));
    req.on('error', reject);
    req.end();
  });
}

/**
 * Returns the signed-in user, or throws. `err.status` carries the HTTP code to send back.
 */
async function requireUser(req) {
  if (!SUPABASE_ANON_KEY) {
    const e = new Error('The server is missing SUPABASE_ANON_KEY, so sign-ins cannot be checked.');
    e.status = 500;
    throw e;
  }

  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    const e = new Error('Please sign in again before uploading.');
    e.status = 401;
    throw e;
  }

  const res = await getJson(`${SUPABASE_URL}/auth/v1/user`, {
    apikey: assertHeaderSafe('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY),
    Authorization: `Bearer ${assertHeaderSafe('the sign-in token', token.replace(/\s+/g, ''))}`,
  });

  if (res.status !== 200 || !res.body || !res.body.email) {
    const e = new Error('Your session has expired. Sign in again and retry.');
    e.status = 401;
    throw e;
  }

  const email = String(res.body.email).toLowerCase();
  if (!email.endsWith('@' + ALLOWED_DOMAIN)) {
    const e = new Error('Only ' + ALLOWED_DOMAIN + ' accounts may upload.');
    e.status = 403;
    throw e;
  }
  return { email, id: res.body.id };
}

module.exports = { requireUser, SUPABASE_URL, ALLOWED_DOMAIN };
