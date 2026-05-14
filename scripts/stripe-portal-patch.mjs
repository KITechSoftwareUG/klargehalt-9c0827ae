#!/usr/bin/env node
/**
 * Stripe Billing Portal Configuration — idempotent setup.
 *
 * Run from app root: node scripts/stripe-portal-patch.mjs
 *
 * What it does:
 *  - Enables plan switching in the Customer Portal
 *  - Enables proration (upgrades charge prorated diff immediately,
 *    downgrades credit applied to next invoice)
 *  - Pins the allowed products/prices to klargehalt's Basis + Professional plans
 *  - Keeps cancellation at period end (no immediate cutoff)
 *
 * Idempotent — safe to re-run after Stripe Dashboard drift.
 *
 * Note: Stripe's API does not return `subscription_update.products` in the
 * response object — verify in Dashboard at:
 *   https://dashboard.stripe.com/settings/billing/portal
 */

import Stripe from 'stripe';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
function envVar(key) {
  const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return m ? m[1] : process.env[key];
}

const stripe = new Stripe(envVar('STRIPE_SECRET_KEY'));

const CONFIG_ID = 'bpc_1TSuY8BmGZykv3dLUU40PJZv';

const BASIS = {
  product: 'prod_UCr07d8DppZIqN',
  prices: [envVar('STRIPE_PRICE_BASIS_MONTHLY'), envVar('STRIPE_PRICE_BASIS_YEARLY')],
};
const PROFESSIONAL = {
  product: 'prod_UCr01DB8DZHES8',
  prices: [envVar('STRIPE_PRICE_PROFESSIONAL_MONTHLY'), envVar('STRIPE_PRICE_PROFESSIONAL_YEARLY')],
};

const result = await stripe.billingPortal.configurations.update(CONFIG_ID, {
  business_profile: {
    headline: 'KlarGehalt — Plan und Zahlungen verwalten',
  },
  features: {
    customer_update: { enabled: true, allowed_updates: ['name', 'email', 'address', 'phone'] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',
      proration_behavior: 'none',
      cancellation_reason: {
        enabled: true,
        options: ['too_expensive', 'switched_service', 'unused', 'other'],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: [BASIS, PROFESSIONAL],
    },
  },
});

const su = result.features.subscription_update;
console.log('✓ Portal config updated:', result.id);
console.log('  subscription_update.enabled:', su.enabled);
console.log('  subscription_update.proration_behavior:', su.proration_behavior);
console.log('  subscription_update.default_allowed_updates:', su.default_allowed_updates);
console.log('');
console.log('Verify in Stripe Dashboard:');
console.log('  https://dashboard.stripe.com/settings/billing/portal');
