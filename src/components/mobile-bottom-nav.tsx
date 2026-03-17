"use client";

import Link from "next/link";
import { memo } from "react";

type MobileTab = "home" | "my-list" | "users";

type Props = {
  active: MobileTab;
};

export const MobileBottomNav = memo(function MobileBottomNav({ active }: Props) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegacao mobile">
      <Link
        href="/minha-lista"
        className="mobile-bottom-item"
        data-active={active === "my-list"}
        aria-label="Minhas Listas"
        title="Minhas Listas"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          movie
        </span>
      </Link>
      <Link
        href="/"
        className="mobile-bottom-item"
        data-active={active === "home"}
        aria-label="Home"
        title="Home"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          home
        </span>
      </Link>
      <Link
        href="/usuarios"
        className="mobile-bottom-item"
        data-active={active === "users"}
        aria-label="Usuarios"
        title="Usuarios"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          groups
        </span>
      </Link>
    </nav>
  );
});
