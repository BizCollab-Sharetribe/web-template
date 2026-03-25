const express = require('express');
const { openIdConfiguration, jwksUri } = require('./api-util/idToken');

const rsaPrivateKey = process.env.RSA_PRIVATE_KEY;
const rsaPublicKey = process.env.RSA_PUBLIC_KEY;
const keyId = process.env.KEY_ID;

const router = express.Router();

// These .well-known/* endpoints will be enabled if you are using this template as OIDC proxy
// https://www.sharetribe.com/docs/cookbook-social-logins-and-sso/setup-open-id-connect-proxy/
if (rsaPublicKey && rsaPrivateKey) {
  router.get('/openid-configuration', openIdConfiguration);
  const modifiedRsaPublicKey = rsaPublicKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  router.get('/jwks.json', jwksUri([{ alg: 'RS256', rsaPublicKey: modifiedRsaPublicKey, keyId }]));
}

module.exports = router;
