import { useEffect, useRef } from "react";
import { usePrefs } from "@turnpike/shared/hooks/use-prefs";

/**
 * Premium cursor: glow core, elastic trailing ring, magnetic morph over
 * interactive elements, and a ripple on click. Pointer devices only.
 */
export function PremiumCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const { customCursor, reducedMotion } = usePrefs();

  useEffect(() => {
    if (!customCursor || reducedMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("premium-cursor-active");

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const interactiveSelector = 'a,button,[role="button"],input,select,textarea,[data-cursor="hover"]';

    const onMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      const target = (event.target as HTMLElement | null)?.closest(interactiveSelector);
      targetScale = target ? 2.1 : 1;
      ring.dataset.state = target ? "hover" : "idle";
    };

    const onDown = () => {
      targetScale = 1.4;
      const ripple = document.createElement("span");
      ripple.className = "pointer-events-none fixed z-[9998] rounded-full";
      ripple.style.cssText = `left:${mouseX}px;top:${mouseY}px;width:8px;height:8px;transform:translate(-50%,-50%);background:radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, transparent), transparent 70%);transition:width .5s ease-out,height .5s ease-out,opacity .5s ease-out;`;
      document.body.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.width = "120px";
        ripple.style.height = "120px";
        ripple.style.opacity = "0";
      });
      window.setTimeout(() => ripple.remove(), 520);
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      scale += (targetScale - scale) * 0.14;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("premium-cursor-active");
    };
  }, [customCursor, reducedMotion]);

  if (!customCursor || reducedMotion) return null;

  return (
    <div aria-hidden>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] size-1.5 rounded-full gradient-brand"
        style={{ boxShadow: "0 0 14px color-mix(in oklab, var(--primary) 70%, transparent)" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] size-6 rounded-full border transition-[background,border-color] duration-300 data-[state=hover]:border-transparent"
        style={{
          borderColor: "color-mix(in oklab, var(--primary) 55%, transparent)",
          background: "color-mix(in oklab, var(--brand-cyan) 10%, transparent)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
