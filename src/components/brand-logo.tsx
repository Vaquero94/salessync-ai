"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "primary" | "compact";
  /** Compact wordmark on solid brand/violet bars — single-color white mark */
  appearance?: "default" | "onViolet";
  className?: string;
  priority?: boolean;
  href?: string | null;
};

const dimensions = {
  primary: { width: 247, height: 50 },
  compact: { width: 209, height: 32 },
} as const;

/** Icon + “Zero Entry” / “AI” as separate spans so spacing is readable */
function CompactBrandMark({
  className,
  appearance = "default",
}: {
  className?: string;
  appearance?: "default" | "onViolet";
}) {
  const iconClass =
    appearance === "onViolet"
      ? "shrink-0 text-white"
      : "shrink-0 text-[#5B4FE8] dark:text-[#7C6FFF]";

  const wordmark =
    appearance === "onViolet" ? (
      <span className="inline-flex items-baseline gap-1.5 text-base font-semibold tracking-tight text-white sm:text-lg">
        <span>Zero Entry</span>
        <span className="font-bold">AI</span>
      </span>
    ) : (
      <span className="inline-flex items-baseline gap-1.5 text-base font-semibold tracking-tight sm:text-lg">
        <span className="text-[#5B4FE8] dark:text-[#C8C2FF]">Zero Entry</span>
        <span className="font-bold text-[#111111] dark:text-white">AI</span>
      </span>
    );

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width="40"
        height="40"
        viewBox="6 6 28 28"
        className={iconClass}
        aria-hidden
      >
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline
          points="26,14 32,20 26,26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      </svg>
      {wordmark}
    </span>
  );
}

export function BrandLogo({
  variant = "primary",
  appearance = "default",
  className,
  priority,
  href = "/",
}: BrandLogoProps) {
  if (variant === "compact") {
    const inner = <CompactBrandMark className={className} appearance={appearance} />;

    if (href === null) {
      return (
        <>
          <span className="sr-only">Zero Entry AI</span>
          {inner}
        </>
      );
    }

    return (
      <Link
        href={href}
        aria-label="Zero Entry AI"
        className="inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {inner}
      </Link>
    );
  }

  const { width, height } = dimensions.primary;
  const lightSrc = "/images/logo-primary-light.svg";
  const darkSrc = "/images/logo-primary-dark.svg";

  const inner = (
    <span className={`relative inline-block ${className ?? ""}`}>
      <Image
        src={lightSrc}
        alt="Zero Entry AI"
        width={width}
        height={height}
        className="dark:hidden"
        priority={priority}
      />
      <Image
        src={darkSrc}
        alt=""
        width={width}
        height={height}
        className="hidden dark:block"
        priority={priority}
        aria-hidden
      />
    </span>
  );

  if (href === null) {
    return inner;
  }

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {inner}
    </Link>
  );
}
