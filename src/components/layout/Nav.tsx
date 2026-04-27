import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

type NavProps = {
  activePage?: string;
};

const linkBase = "text-sm font-medium transition-colors";
const inactiveColor = "text-[rgba(255,255,255,0.80)] hover:text-white";

function navLinkClass(active: boolean) {
  return `${linkBase} ${active ? "text-white" : inactiveColor}`;
}

export function Nav({ activePage }: NavProps) {
  const isHome = activePage === "home";
  const isPricing = activePage === "pricing";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-16 w-full" style={{ background: "#7C6FFF" }}>
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <span style={{ filter: "brightness(0) invert(1)" }} className="inline-flex shrink-0">
          <BrandLogo variant="compact" priority />
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-x-8">
          <Link href="/" className={navLinkClass(isHome)}>
            Home
          </Link>
          <Link href="/pricing" className={navLinkClass(isPricing)}>
            Pricing
          </Link>
          <Link href="/#how-it-works" className={`${linkBase} ${inactiveColor}`}>
            How it works
          </Link>
        </div>

        <Button asChild size="lg" className="shrink-0 border-0 bg-transparent p-0 shadow-none hover:bg-transparent">
          <Link
            href="/#waitlist"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-5 text-sm transition-opacity hover:opacity-90 sm:px-8"
            style={{
              background: "#fff",
              color: "#5B4FE8",
              fontWeight: "600",
              border: "none",
            }}
          >
            Get early access
          </Link>
        </Button>
      </div>
    </nav>
  );
}
