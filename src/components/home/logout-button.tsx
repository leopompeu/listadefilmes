"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onLogout = useCallback(async () => {
    setPending(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [router]);

  return (
    <button className={className} onClick={onLogout} type="button" disabled={pending}>
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
