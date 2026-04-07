const { denormalisedResponseEntities } = require('../../api-util/data');
const { getIntegrationSdk } = require('../../api-util/sdk');

const updateUserProfile = async data => {
  try {
    const iSdk = getIntegrationSdk();

    const { created, id, client_reference_id, amount_total, metadata } = data;

    if (!client_reference_id) {
      console.log('client_reference_id missing in checkout session completed');
      return;
    }

    const userRes = await iSdk.users.show({
      id: client_reference_id,
    });

    const user = denormalisedResponseEntities(userRes)[0];
    const { leadsPurchaseHistory = [], leadsAvailable = 0 } =
      user.attributes.profile.metadata || {};

    await iSdk.users.updateProfile({
      id: user.id,
      metadata: {
        leadsPurchaseHistory: [
          ...leadsPurchaseHistory,
          { id, created, amount: amount_total, refListingId: metadata.listingId },
        ],
        leadsAvailable: leadsAvailable + 1,
      },
    });

    await iSdk.users.updatePermissions({
      id: user.id,
      initiateTransactions: 'permission/allow',
    });
  } catch (error) {
    console.log('Failed to update creator profile', error);
  }
};

module.exports = {
  updateUserProfile,
};
