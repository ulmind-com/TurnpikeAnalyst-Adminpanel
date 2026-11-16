import { useEffect, useId, useRef, useState } from "react";

import { usePrefs } from "@turnpike/shared/hooks/use-prefs";

const MERMAID_KEYWORDS = [
  "graph",
  "flowchart",
  "sequencediagram",
  "classdiagram",
  "statediagram",
  "erdiagram",
  "journey",
  "gantt",
  "pie",
  "quadrantchart",
  "requirementdiagram",
  "gitgraph",
  "c4context",
  "c4container",
  "c4component",
  "c4dynamic",
  "c4deployment",
  "mindmap",
  "timeline",
  "zenuml",
  "sankey",
  "xychart",
  "block",
  "packet",
  "architecture",
];

function looksLikeMermaid(source: string): boolean {
  const trimmed = source.trim().toLowerCase();
  if (!trimmed) return false;
  // Strip comments or whitespace at the beginning
  const firstLine = trimmed.split("\n")[0].trim().replace(/^%%.*$/, "").trim();
  const target = firstLine || trimmed;
  return MERMAID_KEYWORDS.some((kw) => target.startsWith(kw));
}

function cleanDanglingMermaidErrors(id: string) {
  if (typeof document === "undefined") return;
  try {
    const errorDoms = document.querySelectorAll(
      `[id^="d${id}"], [id^="${id}"], .error-icon, [id*="mermaid-error"]`
    );
    errorDoms.forEach((el) => {
      // Remove leaked mermaid error elements directly attached to document.body
      if (el.parentElement === document.body || !document.querySelector(".mermaid-container")?.contains(el)) {
        el.remove();
      }
    });
  } catch {
    // Non-fatal cleanup
  }
}

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

    if (!source.trim()) {
      setError(null);
      return;
    }

    if (!looksLikeMermaid(source)) {
      setError("Waiting for valid diagram type (e.g. graph TD, flowchart LR, sequenceDiagram...)");
      cleanDanglingMermaidErrors(id);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          theme: dark ? "dark" : "default",
          fontFamily: "var(--font-sans)",
        });
        // Override parseError to prevent Mermaid from injecting error boxes into document.body
        mermaid.parseError = () => {};

        const { svg } = await mermaid.render(id, source);
        if (!cancelled && container.current) {
          container.current.innerHTML = svg;
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Diagram could not be rendered");
        }
      } finally {
        cleanDanglingMermaidErrors(id);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanDanglingMermaidErrors(id);
    };
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
      className={`mermaid-container ${className || ""}`}
      style={{ overflowX: "auto" }}
    />
  );
}
