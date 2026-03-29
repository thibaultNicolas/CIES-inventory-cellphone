"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target instanceof HTMLElement) {
        // Let the new page render before anchor scrolling.
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: "start", behavior: "auto" });
        });
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, searchParams]);

  return null;
}
