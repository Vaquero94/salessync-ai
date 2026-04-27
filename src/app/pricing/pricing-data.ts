/** Monthly list price per seat when billed monthly (annual is 20% less). */
export const MONTHLY_PRICE = { starter: 19, pro: 29, team: 24 } as const;

/** Effective monthly rate when billed annually (20% off monthly). */
export const ANNUAL_MONTHLY_EQ = { starter: 15, pro: 23, team: 19 } as const;

export const faqItems: { q: string; a: string }[] = [
  {
    q: "What counts as a recording minute?",
    a: "We meter active meeting audio Zero Entry AI processes for extraction—typically from Zoom or Google Meet. Silent padding and retries do not inflate your allowance.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes. Changes apply on your next renewal; annual saves about 20% versus paying month-to-month.",
  },
  {
    q: "How does the Team plan seat minimum work?",
    a: "Team requires at least five seats. Add seats anytime under Settings → Billing → Add seats. Stripe prorates automatically.",
  },
  {
    q: "Which CRMs do you support?",
    a: "HubSpot is available today. Additional CRMs are on the roadmap—join the waitlist to vote on the next connector.",
  },
  {
    q: "What happens if I exceed my recording minutes?",
    a: "We notify you before you hit the cap. You can upgrade your plan or purchase additional capacity without losing access to historical reviews.",
  },
  {
    q: "Is my data used to train public models?",
    a: "No. Your recordings and extracted fields stay in your tenant boundary and are used only to deliver your workspace.",
  },
  {
    q: "Do you offer refunds?",
    a: "If Zero Entry AI does not materially work as described in your first billing cycle, contact support within 14 days for a refund on that period.",
  },
  {
    q: "How does cancellation work?",
    a: "Cancel anytime from Settings → Billing. You keep access until the end of the paid period; exports of approved CRM updates remain in your CRM.",
  },
];
