/**
 * Cloudflare KV REST API wrapper.
 *
 * Provides get/put operations against a single KV namespace configured
 * via server/config/kv.js. Uses native fetch (Node 18+).
 *
 * Mirrors the pattern in mediaSdk.js — config is read once, credentials
 * are validated on first use.
 */

const kvConfig = require('../config/kv');

const getBaseUrl = () => {
  const { accountId, namespaceId, apiToken } = kvConfig;

  if (!accountId || !namespaceId || !apiToken) {
    throw new Error(
      'Cloudflare KV is not configured. Set CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_KV_API_TOKEN.'
    );
  }

  return {
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Reads a value from KV.
 *
 * @param {string} key
 * @returns {Promise<string|null>} Raw string value, or null if key not found.
 */
const kvGet = async key => {
  const { baseUrl, headers } = getBaseUrl();
  const res = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, { headers });

  console.log(`KV GET ${key} → ${res.status}`);
  
  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`KV get failed: ${res.status} ${res.statusText}`);
  }

  return res.text();
};

/**
 * Writes a value to KV.
 *
 * @param {string} key
 * @param {string|number|object} value - Objects are JSON-stringified automatically.
 * @returns {Promise<void>}
 */
const kvPut = async (key, value) => {
  const { baseUrl, headers } = getBaseUrl();
  const body = typeof value === 'string' ? value : JSON.stringify(value);

  const res = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error(`KV put failed: ${res.status} ${res.statusText}`);
  }
};

module.exports = { kvGet, kvPut };
