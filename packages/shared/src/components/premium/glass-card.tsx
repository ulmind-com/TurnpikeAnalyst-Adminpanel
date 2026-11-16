import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@turnpike/shared/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Mouse-reactive light + subtle 3D tilt. */
  interactive?: boolean;
  as?: "div" | "section" | "article";
}

/** Liquid-glass surface with gradient ring, reflection sheen and hover tilt. */
export function GlassCard({ children, className, interactive = true }: GlassCardProps) {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });

  const glow = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, color-mix(in oklab, var(--brand-cyan) 22%, transparent), transparent 60%)`;

  return (
    <motion.div
      onPointerMove={(event) => {
        if (!interactive) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * 100;
        const py = ((event.clientY - rect.top) / rect.height) * 100;
        mx.set(px);
        my.set(py);
        ry.set((px - 50) / 22);
        rx.set(-(py - 50) / 26);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={interactive ? { rotateX: rx, rotateY: ry, transformPerspective: 1200 } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl glass-panel gradient-ring transition-shadow duration-500 hover:shadow-float",
        className,
      )}
    >
      {interactive && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glow }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
