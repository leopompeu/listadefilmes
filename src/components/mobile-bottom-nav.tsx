"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MobileTab = "home" | "my-list" | "users";

type Props = {
  active: MobileTab;
};

export function MobileBottomNav({ active }: Props) {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent || "";
      const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua,
      );
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallViewport = window.innerWidth < 900;
      setIsMobileDevice(isMobileUa && hasTouch && isSmallViewport);
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  if (!isMobileDevice) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegacao mobile">
      <Link
        href="/minha-lista"
        className="mobile-bottom-item"
        data-active={active === "my-list"}
        aria-label="Minha Lista"
        title="Minha Lista"
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
}
