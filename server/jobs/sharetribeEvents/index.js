/**
 * Sharetribe Events job — entry point.
 *
 * Registers the 5-minute cron schedule and fires an initial tick
 * shortly after startup so the server finishes initialising first.
 *
 * Polling strategy (per Sharetribe docs):
 *   - Cursor-based polling via startAfterSequenceId (no double-processing).
 *   - Cold start: use createdAtStart = now (only forward-looking events).
 *   - Full page (100 events) → immediate follow-up poll to drain backlog.
 */

const cron = require('node-cron');
const { tick } = require('./helpers');

// Run every 5 minutes: minute 0, 5, 10, … of every hour
const SCHEDULE = '*/5 * * * *';

/**
 * Registers the cron job and fires the first tick on startup.
 */
const startSharetribeEventsJob = () => {
  cron.schedule(SCHEDULE, () => tick());
};

module.exports = { startSharetribeEventsJob };
