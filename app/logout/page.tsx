"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutAccount } from "@/lib/auth-client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    logoutAccount().finally(() => {
      router.replace("/login");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-8 py-6 text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">SubReel Auth</p>
        <h1 className="mt-3 text-3xl font-black">Выходим из аккаунта</h1>
        <p className="mt-2 text-sm text-[var(--color-text-gray)]">Секунду, завершаем Supabase session и возвращаем на логин.</p>
      </div>
    </main>
  );
}
