/**
 * Reading credentials out of the environment.
 *
 * A value pasted into a dashboard or piped through a shell often picks up characters that
 * are invisible on screen but fatal in a request: a trailing newline, a zero-width space,
 * a byte-order mark. Node then refuses to send it — "Invalid character in header content".
 *
 * None of the values here — keys, tokens, ids, URLs, a domain name — may legitimately
 * contain whitespace or invisible formatting, so both are removed. Anything still
 * unsendable is reported by name and code point rather than left to crash obscurely.
 */

// Invisible characters JavaScript's \s does NOT match, and which are always paste artefacts:
// zero-width space/non-joiner/joiner, bidi marks, word joiner, soft hyphen, BOM.
const INVISIBLE = /[​-‏⁠-⁤­﻿]/g;

function envValue(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return fallback;
  const cleaned = String(raw).replace(/\s+/g, '').replace(INVISIBLE, '');
  return cleaned || fallback;
}

// Everything a header or an OAuth body can carry, once whitespace and invisibles are gone.
const SENDABLE = /^[\x21-\x7e]*$/;

function describeBadChars(value) {
  const seen = new Set();
  for (const ch of value) {
    if (!SENDABLE.test(ch)) {
      seen.add('U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    }
  }
  return [...seen].join(', ');
}

/**
 * Throws if `value` still cannot be sent. The message names the variable and the exact
 * code points, so one failed request is enough to identify a bad paste.
 */
function assertHeaderSafe(name, value) {
  if (!value || SENDABLE.test(value)) return value;
  throw new Error(`${name} contains ${describeBadChars(value)}, which cannot be sent in a ` +
    'request. Re-enter it in the project settings — retype it rather than pasting, or ' +
    'paste into a plain-text editor first to drop hidden characters.');
}

module.exports = { envValue, assertHeaderSafe, describeBadChars };
