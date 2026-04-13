/**
 * Cloudflare KV configuration.
 *
 * Required environment variables:
 *   CF_ACCOUNT_ID       — Cloudflare account ID
 *   CF_KV_NAMESPACE_ID  — KV namespace ID
 *   CF_KV_API_TOKEN     — API token with KV read/write permissions
 */

const { R2_ACCOUNT_ID: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN } = process.env;

module.exports = {
  accountId: CF_ACCOUNT_ID,
  namespaceId: CF_KV_NAMESPACE_ID,
  apiToken: CF_KV_API_TOKEN,
};
