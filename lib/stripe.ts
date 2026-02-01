import { loadStripe, Stripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from './config';

// ============================================================================
// Types
// ============================================================================

export interface StripeCheckoutOptions {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_SUCCESS_URL = `${window.location.origin}/results?payment=success`;
const DEFAULT_CANCEL_URL = `${window.location.origin}/results?payment=cancelled`;

// Payment Link URL (configured in Stripe Dashboard)
const PAYMENT_LINK_BASE = 'https://buy.stripe.com';

// ============================================================================
// Stripe Instance Cache
// ============================================================================

let stripePromise: Promise<Stripe | null> | null = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize Stripe.js
 * Returns a cached instance if already initialized
 */
export async function initStripe(publishableKey?: string): Promise<Stripe> {
  if (!stripePromise) {
    const key = publishableKey || getStripePublishableKey();
    stripePromise = loadStripe(key);
  }

  const stripe = await stripePromise;

  if (!stripe) {
    throw new Error('Failed to load Stripe.js. Please check your internet connection.');
  }

  return stripe;
}

/**
 * Check if Stripe is available
 */
export function isStripeAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Stripe;
}

// ============================================================================
// Checkout Functions
// ============================================================================

/**
 * Redirect to Stripe Checkout using Payment Links
 * This is a serverless approach - no backend required
 */
export async function redirectToCheckout(
  _stripe: Stripe,
  priceId: string
): Promise<void> {
  // For Payment Links, we redirect directly to the Stripe-hosted page
  // The priceId should correspond to a Payment Link configured in Stripe Dashboard

  const returnUrl = encodeURIComponent(DEFAULT_SUCCESS_URL);
  const paymentLinkUrl = `${PAYMENT_LINK_BASE}/${priceId}?client_reference_id=${Date.now()}&return_url=${returnUrl}`;

  window.location.href = paymentLinkUrl;
}

/**
 * Alternative: Use Stripe Checkout Session (requires backend in production)
 * For development/demo, this uses client-only mode
 */
export async function redirectToCheckoutSession(
  stripe: Stripe,
  options: StripeCheckoutOptions
): Promise<void> {
  const { priceId, successUrl = DEFAULT_SUCCESS_URL, cancelUrl = DEFAULT_CANCEL_URL } = options;

  // Note: In production, you would create a Checkout Session on your backend
  // and pass the session ID here. For client-only mode, we use Payment Links.

  const result = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    successUrl,
    cancelUrl,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

// ============================================================================
// Product Configuration
// ============================================================================

export const PRODUCT_TIERS = {
  free: {
    name: 'Free Tier',
    matches: 5,
    price: 0,
    priceId: null,
  },
  premium: {
    name: 'Premium Session',
    matches: -1, // Unlimited for session
    price: 9.99,
    priceId: 'price_premium_session', // Replace with actual Stripe Price ID
    paymentLinkId: 'plink_premium', // Replace with actual Payment Link ID
  },
} as const;

export type ProductTier = keyof typeof PRODUCT_TIERS;

// ============================================================================
// Free Tier Management
// ============================================================================

const FREE_MATCHES_KEY = 'clinical_match_maker_free_matches';

/**
 * Get remaining free matches for this session
 */
export function getRemainingFreeMatches(): number {
  const stored = sessionStorage.getItem(FREE_MATCHES_KEY);
  if (stored === null) {
    return PRODUCT_TIERS.free.matches;
  }
  return parseInt(stored, 10);
}

/**
 * Decrement free matches count
 */
export function decrementFreeMatches(): number {
  const remaining = getRemainingFreeMatches();
  const newCount = Math.max(0, remaining - 1);
  sessionStorage.setItem(FREE_MATCHES_KEY, String(newCount));
  return newCount;
}

/**
 * Check if user has free matches remaining
 */
export function hasFreeMatchesRemaining(): boolean {
  return getRemainingFreeMatches() > 0;
}

/**
 * Reset free matches (e.g., after purchase)
 */
export function resetFreeMatches(): void {
  sessionStorage.removeItem(FREE_MATCHES_KEY);
}

/**
 * Grant unlimited matches for session (after purchase)
 */
export function grantUnlimitedMatches(): void {
  sessionStorage.setItem(FREE_MATCHES_KEY, '-1');
}

/**
 * Check if user has unlimited matches
 */
export function hasUnlimitedMatches(): boolean {
  return getRemainingFreeMatches() === -1;
}

// ============================================================================
// Payment Status Handling
// ============================================================================

/**
 * Handle payment redirect status from URL
 */
export function handlePaymentRedirect(): { success: boolean; cancelled: boolean } {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');

  const result = {
    success: payment === 'success',
    cancelled: payment === 'cancelled',
  };

  // If payment was successful, grant unlimited matches
  if (result.success) {
    grantUnlimitedMatches();
  }

  // Clean up URL
  if (payment) {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState({}, '', url.toString());
  }

  return result;
}
