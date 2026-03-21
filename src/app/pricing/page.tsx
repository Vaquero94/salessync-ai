import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutButton } from "./checkout-button";
import { BillingPortalButton } from "./billing-portal-button";

const PLANS = [
  {
    id: "starter",
    name: "SalesSync Starter",
    price: 19,
    description: "Perfect for individuals getting started with AI-powered CRM logging",
    features: [
      "Up to 50 calls/meetings per month",
      "1 CRM connection",
      "Email sync (Gmail or Outlook)",
      "Basic AI extraction",
      "7-day transcript retention",
    ],
  },
  {
    id: "pro",
    name: "SalesSync Pro",
    price: 29,
    description: "For teams who need unlimited logging and advanced features",
    features: [
      "Unlimited calls/meetings",
      "Unlimited CRM connections",
      "Email sync (Gmail + Outlook)",
      "Advanced AI extraction",
      "90-day transcript retention",
      "Priority support",
    ],
  },
] as const;

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase
        .from("users")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your workflow. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className="flex flex-col"
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {user ? (
                  <CheckoutButton planId={plan.id} planName={plan.name} />
                ) : (
                  <Button asChild className="w-full" size="lg">
                    <a href="/login?next=/pricing">Log in to subscribe</a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {user && appUser?.stripe_customer_id && (
          <div className="mt-12 flex justify-center">
            <BillingPortalButton />
          </div>
        )}
      </div>
    </main>
  );
}
