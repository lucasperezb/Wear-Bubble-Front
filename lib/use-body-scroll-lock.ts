"use client";

import { useEffect } from "react";

let activeLocks = 0;
let lockedScrollY = 0;
let previousStyles: {
  overflow: string;
  position: string;
  top: string;
  width: string;
  paddingRight: string;
} | null = null;

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    if (activeLocks === 0) {
      lockedScrollY = window.scrollY;
      previousStyles = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        paddingRight: body.style.paddingRight,
      };
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${lockedScrollY}px`;
      body.style.width = "100%";
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    }
    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks !== 0 || !previousStyles) return;
      body.style.overflow = previousStyles.overflow;
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.width = previousStyles.width;
      body.style.paddingRight = previousStyles.paddingRight;
      previousStyles = null;
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
    };
  }, [active]);
}
