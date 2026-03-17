"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

type MobileTab = "home" | "my-list" | "users";

type Props = {
  active: MobileTab;
};

function tabFromPathname(pathname: string): MobileTab {
  if (pathname.startsWith("/usuarios")) return "users";
  if (pathname.startsWith("/minha-lista")) return "my-list";
  return "home";
}

export const MobileBottomNav = memo(function MobileBottomNav({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [visualActive, setVisualActive] = useState<MobileTab>(active);
  const navTimerRef = useRef<number | null>(null);

  const routeActive = useMemo(() => tabFromPathname(pathname), [pathname]);

  useEffect(() => {
    setVisualActive(routeActive);
  }, [routeActive]);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    };
  }, []);

  const slideThenNavigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, target: MobileTab, href: string) => {
      if (routeActive === target) return;
      event.preventDefault();
      setVisualActive(target);
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
      navTimerRef.current = window.setTimeout(() => {
        router.push(href);
      }, 170);
    },
    [routeActive, router],
  );

  const activeIndex = visualActive === "my-list" ? 0 : visualActive === "home" ? 1 : 2;

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegacao mobile">
      <span
        className="mobile-bottom-indicator"
        aria-hidden="true"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      <Link
        href="/minha-lista"
        className="mobile-bottom-item"
        data-active={visualActive === "my-list"}
        aria-label="Minhas Listas"
        title="Minhas Listas"
        onClick={(event) => slideThenNavigate(event, "my-list", "/minha-lista")}
      >
        <span className="material-symbols-rounded mobile-bottom-icon" aria-hidden="true">
          movie
        </span>
      </Link>
      <Link
        href="/"
        className="mobile-bottom-item"
        data-active={visualActive === "home"}
        aria-label="Home"
        title="Home"
        onClick={(event) => slideThenNavigate(event, "home", "/")}
      >
        <span className="material-symbols-rounded mobile-bottom-icon" aria-hidden="true">
          home
        </span>
      </Link>
      <Link
        href="/usuarios"
        className="mobile-bottom-item"
        data-active={visualActive === "users"}
        aria-label="Usuarios"
        title="Usuarios"
        onClick={(event) => slideThenNavigate(event, "users", "/usuarios")}
      >
        <span className="material-symbols-rounded mobile-bottom-icon" aria-hidden="true">
          groups
        </span>
      </Link>
    </nav>
  );
});
