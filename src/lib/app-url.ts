/**
 * Public base URL for OAuth redirects, webhooks, and return URLs.
 * Requires NEXT_PUBLIC_APP_URL or NEXTAUTH_URL — no request-host or localhost fallback.
 */
export function getPublicAppUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (!fromEnv) {
    throw new Error(
      "Set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL to your public app origin."
    );
  }
  return fromEnv.replace(/\/$/, "");
}
