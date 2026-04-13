/**
 * Event handlers for Sharetribe events.
 *
 * Add event-type-specific logic here. Each handler receives the full
 * Sharetribe event object and may be async.
 *
 * handleEvent is the single dispatch entry point called by the poller.
 */

const { denormalisedResponseEntities } = require('../../api-util/data');
const { getIntegrationSdk } = require('../../api-util/sdk');
const { emailServices } = require('../../services');
const { newHurdleEmail } = require('./templates/newHurdle');

const LOG_PREFIX = '[SharetribeEvents]';

const DEFAULT_CAP_LIMIT = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Per-type handlers — add new handlers here as the marketplace grows
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} event
 */
const onListingUpdated = async event => {
  try {
    const { resource, source, previousValues } = event.attributes;

    if (source !== 'source/console' || previousValues.attributes.state !== 'pendingApproval') {
      return false;
    }

    const { categoryLevel1, budget_range, cap_limit } = resource.attributes.publicData;
    const { title, description } = resource.attributes;
    const listingId = resource.id.uuid;

    const industry = categoryLevel1.replace(/_/g, ' ');
    const capLimit = cap_limit || DEFAULT_CAP_LIMIT;
    const listingUrl = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/l/${title}/${listingId}`;

    const iSdk = getIntegrationSdk();
    const usersRes = await iSdk.users.query({ priv_industry_expertise: categoryLevel1 });
    const users = denormalisedResponseEntities(usersRes);

    console.log(`${LOG_PREFIX} Notifying ${users.length} specialist(s) for industry: ${industry}`);

    for (const user of users) {
      const {
        email,
        profile: { displayName },
      } = user.attributes;

      await emailServices.sendEmail({
        toEmail: email,
        toName: displayName,
        subject: `🚨 New match: ${industry} Hurdle posted`,
        htmlContent: newHurdleEmail({
          displayName: displayName.trim(),
          industry,
          title,
          description,
          budgetRange: budget_range,
          capLimit,
          listingUrl,
        }),
      });

      console.log(`${LOG_PREFIX} Email sent to ${email} (${displayName})`);
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error in onListingUpdated handler:`, error.message);
  }
};

// Map eventType strings to their handler functions.
const EVENT_HANDLERS = {
  'listing/updated': onListingUpdated,
};

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispatches a single Sharetribe event to the appropriate handler.
 *
 * @param {Object} event - A single Sharetribe event object
 * @param {string} event.attributes.eventType  - e.g. 'listing/updated'
 * @param {number} event.attributes.sequenceId - Strictly increasing cursor
 * @param {Object} event.attributes.resource   - The affected resource (null for deleted events)
 * @param {Object} event.attributes.previousValues - Previous attribute values (for updates)
 * @returns {Promise<void>}
 */
const handleEvent = async event => {
  const { eventType, sequenceId } = event.attributes;
  console.log(`${LOG_PREFIX} Event #${sequenceId}: ${eventType}`);

  const handler = EVENT_HANDLERS[eventType];
  if (handler) {
    await handler(event);
  }
};

module.exports = { handleEvent };
