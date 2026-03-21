import Stripe from 'stripe';
import { query } from '../config/database.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })
  : null;

export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured on the server.',
      });
    }

    const { items, successUrl, cancelUrl } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required to create a checkout session.',
      });
    }

    // Build line_items securely from DB prices
    const lineItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;

      const products = await query(
        'SELECT name, price FROM products WHERE id = ?',
        [product_id]
      );

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${product_id} not found`,
        });
      }

      const product = products[0];
      const unitAmount = Math.round(Number(product.price) * 100);

      lineItems.push({
        quantity,
        price_data: {
          currency: 'npr',
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
          },
        },
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid line items for checkout.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl || `${frontendUrl}/cart?payment=success`,
      cancel_url: cancelUrl || `${frontendUrl}/cart?payment=cancelled`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating checkout session',
    });
  }
};


