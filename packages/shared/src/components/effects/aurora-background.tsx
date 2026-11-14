import { cn } from "@turnpike/shared/lib/utils";

/**
 * Aurora field: layered gradient orbs + mesh wash + noise.
 * Pure CSS/GPU compositing — no 3D runtime shipped to an admin tool.
 */
export function AuroraBackground({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden noise-layer",
        className,
      )}
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="orb size-[42rem] -left-40 -top-52 opacity-40"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }}
      />
      <div
        className="orb size-[38rem] right-[-12rem] top-[-8rem] opacity-35"
        style={{
          background: "radial-gradient(circle, var(--brand-cyan), transparent 65%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="orb size-[46rem] bottom-[-18rem] left-1/3 opacity-30"
        style={{
          background: "radial-gradient(circle, var(--brand-blue), transparent 65%)",
          animationDelay: "-12s",
        }}
      />
      {dense && (
        <div
          className="orb size-[30rem] bottom-[-6rem] right-[10%] opacity-30"
          style={{
            background: "radial-gradient(circle, var(--secondary), transparent 65%)",
            animationDelay: "-3s",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--background) 40%, transparent), color-mix(in oklab, var(--background) 85%, transparent))",
        }}
      />
    </div>
  );
}
