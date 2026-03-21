import Stripe from "stripe";

// Creates a server-side Stripe client for checkout and billing operations.
export function createStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey);
}

// Returns the publishable key for initializing Stripe.js in the browser.
export function getStripePublishableKey() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
  }

  return publishableKey;
}
