const { denormalisedResponseEntities } = require('../api-util/data');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  getIntegrationSdk,
} = require('../api-util/sdk');

const listingPromise = (sdk, id) => sdk.listings.show({ id });

module.exports = (req, res) => {
  const { bodyParams } = req.body || {};
  const sdk = getSdk(req, res);

  Promise.all([listingPromise(sdk, bodyParams?.params?.listingId)])
    .then(([showListingResponse]) => {
      const listing = showListingResponse.data.data;
      return getTrustedSdk(req);
    })
    .then(async trustedSdk => {
      const { params } = bodyParams;

      const userRes = await trustedSdk.currentUser.show();
      const user = denormalisedResponseEntities(userRes)[0];

      const { leadsAvailable = 0 } = user.attributes.profile.metadata || {};

      if (leadsAvailable <= 0) {
        throw new Error('No leads available');
      }

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
        },
      };

      const r = await trustedSdk.transactions.initiate(body);

      const iSdk = getIntegrationSdk();
      await iSdk.users.updateProfile({
        id: user.id,
        metadata: {
          leadsAvailable: leadsAvailable - 1,
        },
      });

      if (leadsAvailable - 1 <= 0) {
        await iSdk.users.updatePermissions({
          id: user.id,
          initiateTransactions: 'permission/deny',
        });
      }

      return r;
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
