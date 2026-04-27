import type { Metadata } from "next";
import { PricingExperience } from "./pricing-experience";

export const metadata: Metadata = {
  title: "Pricing — Zero Entry AI",
  description: "Simple, transparent pricing for sales reps and teams.",
};

export default function PricingPage() {
  return <PricingExperience />;
}
