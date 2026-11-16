import { useEffect } from "react";
import { usePrefs } from "@turnpike/shared/hooks/use-prefs";

/** Lenis smooth scrolling, mounted client-side only. */
export function SmoothScroll() {
  const { smoothScroll, reducedMotion } = usePrefs();

  useEffect(() => {
    if (!smoothScroll || reducedMotion) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let destroyed = false;
    let instance: { raf: (t: number) => void; destroy: () => void } | null = null;

    void import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, lerp: 0.1 });
      instance = lenis;
      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      instance?.destroy();
    };
  }, [smoothScroll, reducedMotion]);

  return null;
}
