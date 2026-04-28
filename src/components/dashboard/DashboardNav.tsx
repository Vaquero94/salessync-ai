"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  pendingCount: number;
  avatarInitial: string;
};

export function DashboardNav({ pendingCount, avatarInitial }: Props) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active =
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === href || pathname.startsWith(`${href}/`);
    return active ? "text-[#7C6FFF] font-medium" : "text-zinc-500 hover:text-zinc-300";
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.07] bg-[#0D0D10]">
      <div className="mx-auto flex h-full w-full max-w-[1100px] items-center justify-between px-6">
        <Link href="/" className="font-bold text-white">
          ZeroEntryAI
        </Link>
        <nav className="flex items-center gap-8 text-sm">
          <Link href="/dashboard" className={`inline-flex items-center ${linkClass("/dashboard")}`}>
            Inbox
            {pendingCount > 0 ? (
              <span className="ml-1 rounded-full bg-[#7C6FFF] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            ) : null}
          </Link>
          <Link href="/dashboard/history" className={linkClass("/dashboard/history")}>
            History
          </Link>
          <Link href="/dashboard/settings" className={linkClass("/dashboard/settings")}>
            Settings
          </Link>
        </nav>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7C6FFF] text-sm font-semibold text-white"
          aria-hidden
        >
          {avatarInitial}
        </div>
      </div>
    </header>
  );
}
