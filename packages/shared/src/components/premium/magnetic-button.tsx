import { motion, useMotionValue, useSpring } from "motion/react";
import { forwardRef, type ComponentProps } from "react";

import { Button } from "@turnpike/shared/components/ui/button";
import { cn } from "@turnpike/shared/lib/utils";

/** Button that magnetically leans toward the cursor. */
export const MagneticButton = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>(
  function MagneticButton({ className, children, ...props }, ref) {
    const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
    const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });

    return (
      <motion.span
        className="inline-flex"
        style={{ x, y }}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          x.set((event.clientX - (rect.left + rect.width / 2)) * 0.25);
          y.set((event.clientY - (rect.top + rect.height / 2)) * 0.35);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
        whileTap={{ scale: 0.96 }}
      >
        <Button ref={ref} className={cn("shine", className)} {...props}>
          {children}
        </Button>
      </motion.span>
    );
  },
);
