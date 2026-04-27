import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Cabinet Grotesk is not available via next/font/google; self-host Fontshare OFL files (same weights as Google Fonts usage).
const cabinetGrotesk = localFont({
  src: [
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-cabinet",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zero Entry AI",
  description:
    "AI auto-logs your calls, emails, and meetings directly into your CRM.",
  icons: {
    icon: "/images/icon-gradient.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`min-h-full flex flex-col ${cabinetGrotesk.variable}`}>{children}</body>
    </html>
  );
}
