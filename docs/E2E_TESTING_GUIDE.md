# End-to-End Testing Guide

Follow these flows to test Zero Entry AI end-to-end. **Prerequisites:** `npm run dev`, `.env.local` configured.

---

## Flow 1: Sign up and land on dashboard

### Steps

1. Open **http://localhost:3000/signup**
2. Enter: Full name, email (use a new/unused email), password (min 6 chars)
3. Click **"Sign up"**

### Expected

- You land on **http://localhost:3000/dashboard**
- Header shows **Zero Entry AI**, **Pricing**, **Settings**, and your user menu
- You see "Welcome back" and "0 pending reviews"
- "Recent recordings" is empty
- You see "Process a recording" with a "Simulate recording" button (or "Subscribe to a plan" if you haven’t subscribed)

### If it fails

- **Redirect to /login?error=...** – Supabase may require email confirmation. In Supabase Dashboard → Authentication → Providers → Email: disable "Confirm email" for testing.
- **"Missing NEXT_PUBLIC_SUPABASE_URL"** – Add Supabase env vars to `.env.local`.

---

## Flow 2: Connect Stripe (test mode) and subscribe to Pro

### Prerequisites

Use Stripe **test** keys:

- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID` must be **price IDs** (`price_xxx`), not product IDs.
- Webhook secret from Stripe Dashboard → Developers → Webhooks → Add endpoint → `https://your-domain/api/stripe/webhook` (use ngrok for local: `ngrok http 3000`)

### Steps

1. Open **http://localhost:3000/pricing**
2. Click **"Subscribe to Zero Entry AI Pro"**
3. On Stripe Checkout, use test card **4242 4242 4242 4242**
4. Use any future expiry (e.g. 12/34), any 3-digit CVC, any billing details
5. Click **Pay**

### Expected

- Redirect to **http://localhost:3000/dashboard?checkout=success**
- On Pricing page you see **"Manage billing"**
- Stripe webhook runs; `users` gets `subscription_status: "pro"` and `stripe_customer_id`
- Dashboard shows **"Simulate recording"** button

### If it fails

- **"Invalid plan. Use 'starter' or 'pro'"** – `STRIPE_PRO_PRICE_ID` is missing or invalid. In Stripe Dashboard → Products → select Pro → copy **Price ID** (starts with `price_`).
- **"Webhook signature verification failed"** – `STRIPE_WEBHOOK_SECRET` or webhook URL mismatch. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## Flow 3: Simulate Recall.ai recording webhook

### Steps

1. Stay on **http://localhost:3000/dashboard**
2. Click **"Simulate recording"**
3. Wait a few seconds (Deepgram + OpenAI)

### Expected

- Button briefly shows "Processing…"
- Page refreshes
- A new recording appears in "Recent recordings" with green check icon (complete)
- A **Review** card appears under "Pending reviews"
- The card has contacts, deal info, action items, summary, sentiment

### If it fails

- **"Active subscription required"** – Flow 2 didn’t finish or webhook didn’t run. Check Stripe webhook logs.
- **"Transcription failed"** – Verify `DEEPGRAM_API_KEY`.
- **"Extraction failed"** – Verify `OPENAI_API_KEY`.

---

## Flow 4: Approve extraction and push to HubSpot

### Prerequisites

1. **HubSpot:** Create an app at developers.hubspot.com
2. Add `.env.local`: `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, `CRM_ENCRYPTION_KEY`
3. Add redirect URI: `http://localhost:3000/api/crm/hubspot/callback` (or your ngrok URL)
4. Go to **Settings** and click **Connect HubSpot**
5. Complete HubSpot OAuth (use a sandbox/developer portal if you have one)

### Steps

1. On a Review card, edit any field if you like
2. Click **"Approve & Push to CRM"**
3. Wait for the request to finish

### Expected

- Card disappears from "Pending reviews"
- New contact(s), deal, and note in your HubSpot portal
- No error alert

### If it fails

- **"Saved locally, but push to CRM failed"** – Check HubSpot connection in Settings, or HubSpot API errors in logs.
- **"No billing account found"** – Billing portal requires a prior subscription; complete Flow 2 first.

---

## Flow 5: Cancel subscription and verify access revoked

### Steps

1. Go to **http://localhost:3000/pricing**
2. Click **"Manage billing"**
3. In Stripe Billing Portal, click **"Cancel subscription"** and confirm
4. Return to the dashboard

### Expected

- Stripe sends `customer.subscription.deleted`
- Webhook updates `users` to `subscription_status: "free"`
- **"Manage billing"** disappears from Pricing (no `stripe_customer_id`)
- Dashboard shows **"Subscribe to a plan to process recordings"** instead of **"Simulate recording"**
- Clicking any process path for new recordings returns **403** (“Active subscription required”)

### If it fails

- **Webhook not firing** – Ensure Stripe webhook endpoint and secret are correct.
- **"Manage billing" still visible** – `stripe_customer_id` may still exist; webhook may have failed.

---

## Recall.ai webhook format

The process API accepts:

```json
{ "audioUrl": "https://..." }
{ "recording_url": "https://..." }
{ "recording": { "url": "https://..." } }
```

Recall.ai sends `recording.id` only. To support real Recall webhooks you’d add an endpoint that fetches the recording from Recall’s API and extracts the media URL before calling the process logic.

---

## Checklist

- [ ] Flow 1: Sign up → dashboard
- [ ] Flow 2: Stripe test subscribe Pro
- [ ] Flow 3: Simulate recording → pending review
- [ ] Flow 4: Approve → HubSpot push
- [ ] Flow 5: Cancel → access revoked
