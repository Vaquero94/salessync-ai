"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "primary" | "compact";
  className?: string;
  priority?: boolean;
  href?: string | null;
};

const dimensions = {
  primary: { width: 247, height: 50 },
  compact: { width: 209, height: 32 },
} as const;

export function BrandLogo({
  variant = "primary",
  className,
  priority,
  href = "/",
}: BrandLogoProps) {
  const { width, height } = dimensions[variant];
  const lightSrc =
    variant === "primary" ? "/images/logo-primary-light.svg" : "/images/logo-compact-light.svg";
  const darkSrc =
    variant === "primary" ? "/images/logo-primary-dark.svg" : "/images/logo-compact-dark.svg";

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
