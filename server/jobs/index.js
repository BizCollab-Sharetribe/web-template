/**
 * Background jobs entry point.
 *
 * Register every job here. server/index.js calls startAllJobs() once
 * after the server is ready. To add a new job, import it and call it
 * inside startAllJobs.
 */

const { startSharetribeEventsJob } = require('./sharetribeEvents');

const startAllJobs = () => {
  startSharetribeEventsJob();
};

module.exports = { startAllJobs };
