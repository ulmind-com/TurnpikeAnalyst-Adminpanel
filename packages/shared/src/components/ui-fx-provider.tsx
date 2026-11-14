import { useEffect } from "react";

import { uiFx, type FxType } from "@turnpike/shared/lib/ui-fx";

/**
 * Mount once near the app root. Gives every button, link and tab a subtle
 * click sound + haptic from a single delegated listener, so individual
 * components need no wiring. Elements can opt into a specific sound with
 * `data-fx="toggle"` (etc.), or opt out with `data-fx="none"`.
 */
export function UiFxProvider() {
  useEffect(() => {
    const SELECTOR =
      'a[href],button,[role="tab"],[role="menuitem"],[role="switch"],[data-fx]';

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest?.(SELECTOR) as HTMLElement | null;
      if (!el) return;
      if (el.getAttribute("aria-disabled") === "true" || (el as HTMLButtonElement).disabled) return;

      const explicit = el.getAttribute("data-fx");
      if (explicit === "none") return;

      const kind: FxType = (explicit as FxType) || (el.matches('a[href]') ? "nav" : "tick");
      uiFx.play(kind);
    };

    // Capture phase so it fires even when the handler stops propagation.
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}
