/**
 * Brevo (Sendinblue) transactional email service.
 *
 * Wraps the Brevo SMTP API. Keep provider-specific details here so
 * callers only deal with a generic sendEmail interface.
 */

const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends a transactional email via Brevo.
 *
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.subject
 * @param {string} params.htmlContent
 * @returns {Promise<void>}
 */
const sendEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  await axios.post(
    BREVO_API_URL,
    {
      sender: {
        name: process.env.REACT_APP_MARKETPLACE_NAME,
        email: 'hello@bizcollab.com.au',
      },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
    },
    {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
    }
  );
};

module.exports = { sendEmail };
