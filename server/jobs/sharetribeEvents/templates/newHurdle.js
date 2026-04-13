/**
 * Email template for "New Hurdle posted" specialist notification.
 *
 * Keep all presentation logic here. No business logic or API calls.
 */

/**
 * @param {Object} params
 * @param {string} params.displayName
 * @param {string} params.industry     - Human-readable category (spaces, not underscores)
 * @param {string} params.title        - Listing title
 * @param {string} [params.description]
 * @param {string} [params.budgetRange]
 * @param {number} params.capLimit
 * @param {string} params.listingUrl
 * @returns {string} HTML string
 */
const newHurdleEmail = ({
  displayName,
  industry,
  title,
  description,
  budgetRange,
  capLimit,
  listingUrl,
}) => `
<p>Hi <b>${displayName}</b>,</p>

<p>A new Hurdle matching your expertise in <b>${industry}</b> was just posted by an Industry Leader.</p>

<p>Here is the quick brief:</p>
<ul>
  <li><b>Industry:</b> ${industry}</li>
  <li><b>The Hurdle:</b> ${title}${description ? ` — ${description}` : ''}</li>
  ${budgetRange ? `<li><b>Estimated Value:</b> ${budgetRange}</li>` : ''}
</ul>

<p>⚡ <b>Quick Action Required</b> To ensure our Industry Leaders only review top-tier solutions, this Hurdle is strictly capped at a maximum of <b>${capLimit}</b> pitches.<br/>
Your unlock fee is currently locked at our launch rate of <b>$55</b>. Once the ${capLimit} slots are claimed by other specialists, this lead will be permanently locked.<br/>
Click below to view the full Hurdle details and secure your spot.</p>

<p><a href="${listingUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View &amp; Unlock This Hurdle</a></p>

<p>Happy solving,<br/><b>The BizCollab Team</b></p>
`;

module.exports = { newHurdleEmail };
