const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

// Fixed price: 55 AUD (amount in cents)
const PRICE_AMOUNT = 5500;
const PRICE_CURRENCY = 'aud';

/**
 * POST /api/create-checkout-session
 *
 * Body params:
 *   pathname {string} – required
 *   listingId {string} – required
 */
module.exports = async (req, res) => {
  const { listingId, pathname } = req.body || {};
  const { tokenUserId: userId, email } = req || {};

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!pathname) {
    return res.status(500).json({ error: 'PATHNAME is required' });
  }

  const successUrl = `${ROOT_URL}${pathname}?status=success`;
  const cancelUrl = `${ROOT_URL}${pathname}?status=fail`;

  try {
    const sessionParams = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: PRICE_CURRENCY,
            unit_amount: PRICE_AMOUNT,
            product_data: {
              name: 'Marketplace Payment',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        listingId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('Stripe checkout session error:', e.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
