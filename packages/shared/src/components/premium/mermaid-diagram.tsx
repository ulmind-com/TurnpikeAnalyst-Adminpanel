import { useEffect, useId, useRef, useState } from "react";

import { usePrefs } from "@turnpike/shared/hooks/use-prefs";

/**
 * Renders a Mermaid diagram, falling back to the source when it will not parse.
 *
 * Mermaid is ~500 KB and is needed on two screens out of thirty, so it is
 * imported dynamically rather than bundled into the initial load. A diagram
 * that fails to parse shows its source instead of an error: an intern who
 * mistyped should still see what they wrote, and a reviewer should still be
 * able to read it.
 */
export function MermaidDiagram({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { dark } = usePrefs();
  // Mermaid needs a DOM id that is unique and starts with a letter.
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!source.trim()) return;
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "default",
          fontFamily: "var(--font-sans)",
        });
        const { svg } = await mermaid.render(id, source);
        if (!cancelled && container.current) {
          container.current.innerHTML = svg;
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Diagram could not be rendered");
        }
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
    // `dark` is a dependency because Mermaid bakes the theme into the SVG at
    // render time; it does not follow a CSS variable afterwards.
  }, [source, dark, id]);

  if (error) {
    return (
      <div className={className}>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          This diagram could not be rendered, so here is the source as written.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs text-foreground">
          {source}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={container}
      className={className}
      // Mermaid emits an SVG sized to its content; this keeps a wide diagram
      // scrollable instead of overflowing the page.
      style={{ overflowX: "auto" }}
    />
  );
}
