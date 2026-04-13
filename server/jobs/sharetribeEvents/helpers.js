/**
 * Polling helpers for the Sharetribe Events job.
 *
 * Owns the cursor state (lastSequenceId) and the pollEvents / tick
 * orchestration. Intentionally has no knowledge of the cron schedule —
 * that lives in index.js.
 */

const { getIntegrationSdk } = require('../../api-util/sdk');
const { kvGet, kvPut } = require('../../api-util/kvStore');
const { handleEvent } = require('./sharetribeEvents');

const LOG_PREFIX = '[SharetribeEvents]';

// KV key used to persist the cursor across server restarts
const KV_CURSOR_KEY = 'sharetribe_events_last_seq_id';

// In-memory cache — populated from KV on the first tick of each server lifetime.
// Avoids hitting KV on every backlog-drain tick while still surviving restarts.
// null = not yet loaded from KV.
let lastSequenceId = null;
let cursorLoaded = false;

// Per-page limit returned by the Events API (fixed at 100).
const EVENTS_PER_PAGE = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Cursor persistence (Cloudflare KV)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads the persisted cursor from KV on first call.
 * Subsequent calls within the same server lifetime use the in-memory value.
 *
 * @returns {Promise<number|null>}
 */
const loadCursor = async () => {
  if (cursorLoaded) return lastSequenceId;

  try {
    const raw = await kvGet(KV_CURSOR_KEY);
    lastSequenceId = raw ? parseInt(raw, 10) : null;
    console.log(`${LOG_PREFIX} Cursor loaded from KV: ${lastSequenceId ?? 'none (cold start)'}`);
  } catch (err) {
    console.warn(`${LOG_PREFIX} Could not read cursor from KV (${err.message}). Starting fresh.`);
    lastSequenceId = null;
  }

  cursorLoaded = true;
  return lastSequenceId;
};

/**
 * Persists the cursor to KV and updates the in-memory cache.
 *
 * @param {number} sequenceId
 * @returns {Promise<void>}
 */
const saveCursor = async sequenceId => {
  lastSequenceId = sequenceId;
  console.log(`${LOG_PREFIX} Cursor updated to ${sequenceId}, saving to KV...`);

  try {
    await kvPut(KV_CURSOR_KEY, String(sequenceId));
  } catch (err) {
    console.warn(`${LOG_PREFIX} Could not save cursor to KV:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Core polling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Polls the Sharetribe Events API for new events since the last known
 * sequenceId and processes each one via handleEvent.
 *
 * Returns true if a full page was received (signals the caller to poll
 * again immediately to drain remaining backlog).
 *
 * @returns {Promise<boolean>} fullPage
 */
const pollEvents = async () => {
  const integrationSdk = getIntegrationSdk();

  const cursor = await loadCursor();

  const queryParams = cursor !== null ? { startAfterSequenceId: cursor } : {};

  const response = await integrationSdk.events.query({
    ...queryParams,
    eventTypes: ['listing/updated'],
  });
  const events = response.data.data || [];

  if (events.length === 0) {
    console.log(`${LOG_PREFIX} No new events.`);
    return false;
  }

  console.log(`${LOG_PREFIX} Processing ${events.length} event(s).`);

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error(
        `${LOG_PREFIX} Error handling event #${event.attributes?.sequenceId}:`,
        err.message
      );
    }
  }

  // Advance cursor to the last event we processed and persist to KV
  await saveCursor(events[events.length - 1].attributes.sequenceId);

  return events.length === EVENTS_PER_PAGE;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tick
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One cron tick. Polls events; if a full page was returned (backlog),
 * schedules another poll after 1 s to drain it without waiting 5 minutes.
 *
 * @returns {Promise<void>}
 */
const tick = async () => {
  try {
    const fullPage = await pollEvents();
    if (fullPage) {
      console.log(`${LOG_PREFIX} Full page received — draining backlog in 1s.`);
      setTimeout(tick, 1000);
    } else {
      console.log(`${LOG_PREFIX} Tick complete.`);
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} Poll error:`, err.message);
  }
};

module.exports = { pollEvents, tick };
