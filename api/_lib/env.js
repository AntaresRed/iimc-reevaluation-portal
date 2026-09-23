/**
 * Reading credentials out of the environment.
 *
 * A value pasted into a dashboard or piped through a shell often arrives with a trailing
 * newline or a stray space, and Node refuses to put such a string in an HTTP header:
 * "Invalid character in header content". None of the values here — keys, tokens, ids,
 * URLs, a domain name — may legitimately contain whitespace, so it is simply removed.
 */

// Whitespace anywhere is always a paste artefact for these values, not part of them.
function envValue(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return String(raw).replace(/\s+/g, '');
}

// Anything a header or an OAuth body cannot carry, after whitespace has been removed.
// Catching it here turns a confusing runtime crash into a message that names the variable.
function assertHeaderSafe(name, value) {
  if (!value) return value;
  if (/[^\t\x20-\x7e]/.test(value)) {
    throw new Error(`${name} contains a character that cannot be sent in a request. ` +
      'Re-enter it in the project settings, taking care not to include line breaks.');
  }
  return value;
}

module.exports = { envValue, assertHeaderSafe };
