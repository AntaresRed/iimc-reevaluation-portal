/**
 * GET /api/cron-photo-sweep — run once a day by Vercel Cron (see "crons" in vercel.json).
 *
 * Deletes the answer-script photos of every request decided more than PHOTO_RETENTION_DAYS
 * (30) days ago, as the privacy policy promises. Everything else about the request is kept:
 * each question records how many photos it had, the request records when they went, and its
 * history says so. A photo Drive can't delete is left for the next day's run, and the request
 * is only marked once all of its photos are gone.
 *
 * Needs two environment variables in Vercel:
 *   SUPABASE_SERVICE_ROLE_KEY — to read every decided request, past row-level security
 *   CRON_SECRET               — Vercel sends it with each scheduled call; anyone else is refused
 */

const drive = require('./_lib/drive.js');
const { envValue, assertHeaderSafe } = require('./_lib/env.js');
const { SUPABASE_URL } = require('./_lib/auth.js');

const RETENTION_DAYS = Number(envValue('PHOTO_RETENTION_DAYS', '30')) || 30;
// Stop well inside the function's 30-second limit; anything left waits for tomorrow
const TIME_BUDGET_MS = 20000;

async function db(method, query, body) {
  const key = assertHeaderSafe('SUPABASE_SERVICE_ROLE_KEY', envValue('SUPABASE_SERVICE_ROLE_KEY'));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Database ${method} ${query.split('?')[0]} failed (${res.status}): ${await res.text()}`);
  }
  return method === 'GET' ? res.json() : null;
}

async function sweepRequest(request, summary) {
  let failed = 0;
  for (const item of request.question_items) {
    // Note the count before any photo goes, so the page can still say how many there were.
    // Only when not yet noted, so a run that stopped halfway doesn't lower it.
    await db('PATCH', `question_items?id=eq.${item.id}&photo_count=eq.0`, { photo_count: item.question_photos.length });
    for (const photo of item.question_photos) {
      try {
        if (photo.drive_id) await drive.deletePhoto(photo.drive_id);
        await db('DELETE', `question_photos?id=eq.${photo.id}`);
        summary.photos++;
      } catch (e) {
        failed++;
        console.error(`cron-photo-sweep: photo ${photo.id} of request ${request.id}:`, e.message);
      }
    }
  }
  if (failed) {
    summary.failed += failed;
    return;
  }

  const items = await db('GET', `question_items?request_id=eq.${request.id}&select=photo_count`);
  const count = items.reduce((n, q) => n + (q.photo_count || 0), 0);
  await db('PATCH', `requests?id=eq.${request.id}`, {
    photos_deleted_at: new Date().toISOString(),
    photo_count_before_deletion: count,
  });
  await db('POST', 'request_history', {
    request_id: request.id,
    event: 'Photos deleted',
    by_email: 'Automatic clean-up',
    note: `${count} photo${count === 1 ? '' : 's'} of the answer script removed ${RETENTION_DAYS} days after the decision.`,
  });
  summary.requests++;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const secret = envValue('CRON_SECRET');
  if (!secret || String(req.headers.authorization || '') !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Not allowed.' });
    return;
  }
  if (!envValue('SUPABASE_SERVICE_ROLE_KEY')) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.' });
    return;
  }
  if (!drive.driveEnabled()) {
    res.status(503).json({ error: 'Photo storage is not configured: ' + drive.driveStatus() });
    return;
  }

  const started = Date.now();
  const cutoff = new Date(started - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const summary = { requests: 0, photos: 0, failed: 0, remaining: false };
  try {
    // Only requests that still have photos: the inner joins leave out the rest
    const due = await db('GET', 'requests?select=id,question_items!inner(id,question_photos!inner(id,drive_id))' +
      `&status=like.Resolved*&photos_deleted_at=is.null&reviewed_at=lt.${encodeURIComponent(cutoff)}` +
      '&order=reviewed_at.asc&limit=100');
    for (const request of due) {
      if (Date.now() - started > TIME_BUDGET_MS) { summary.remaining = true; break; }
      await sweepRequest(request, summary);
    }
    console.log('cron-photo-sweep:', JSON.stringify(summary));
    res.status(200).json(summary);
  } catch (e) {
    console.error('cron-photo-sweep failed:', e);
    res.status(500).json({ error: e.message, ...summary });
  }
};
