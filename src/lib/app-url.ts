/**
 * Public base URL for OAuth redirect URIs, webhooks, and Stripe return URLs.
 * Prefer env so local vs production matches what you register with providers.
 *
 * Resolution order: NEXT_PUBLIC_APP_URL → NEXTAUTH_URL → request origin → localhost
 */
export function getPublicAppUrl(requestUrl?: string): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (requestUrl) {
    return new URL(requestUrl).origin;
  }
  return "http://localhost:3000";
}
