"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { fetchSession } from "@/lib/auth-client";

type ProfileEntryProps = {
  profileLabel: string;
  loginLabel: string;
  pendingLabel?: string;
  mobile?: boolean;
  onNavigate?: () => void;
};

export function ProfileEntry({
  profileLabel,
  loginLabel,
  pendingLabel,
  mobile = false,
  onNavigate,
}: ProfileEntryProps) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((user) => {
        if (!cancelled) {
          setIsAuthorized(Boolean(user));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthorized(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const href = isAuthorized ? "/account" : "/login";
  const label = isAuthorized === null ? pendingLabel ?? profileLabel : isAuthorized ? profileLabel : loginLabel;
  const isActive = pathname === href || pathname === "/account";

  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-3 py-2 transition-colors ${
        isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)]"
      }`}
    >
      <UserRound size={16} />
      <span className="text-[9px] font-black uppercase tracking-[0.16em] leading-none">{label}</span>
    </Link>
  );
}
