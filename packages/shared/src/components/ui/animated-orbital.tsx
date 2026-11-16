import { motion } from "motion/react";
import React from "react";
import { cn } from "@turnpike/shared/lib/utils";
import { Orbit } from "lucide-react";

export function AnimatedOrbital({
  centerText = "ZK",
  centerIcon: CenterIcon = Orbit,
  icons = [],
  className
}: {
  centerText?: string;
  centerIcon?: any;
  icons?: any[];
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-[300px] w-[300px] items-center justify-center md:h-[450px] md:w-[450px] lg:h-[600px] lg:w-[600px]", className)}>
      {/* Dashed outer rings (ZkCloud thin elegant style) */}
      <div className="absolute inset-4 rounded-full border border-dashed border-primary/20 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_100%)]"></div>
      <div className="absolute inset-16 rounded-full border-[0.5px] border-primary/10"></div>
      <div className="absolute inset-32 rounded-full border-[0.5px] border-dashed border-brand-cyan/20"></div>

      {/* Center Glowing Hub */}
      <div className="relative z-10 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--primary)_40%,transparent)] ring-1 ring-black/5 md:h-[160px] md:w-[160px]">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,var(--primary)_0%,var(--brand-cyan)_100%)] opacity-10"></div>
        <div className="flex flex-col items-center justify-center text-primary">
          <CenterIcon className="size-8 md:size-10 opacity-80 mb-1" strokeWidth={1.5} />
          <span className="font-display text-xl md:text-2xl font-bold tracking-tight">{centerText}</span>
        </div>
      </div>

      {/* Orbiting Container */}
      <div className="absolute inset-0 animate-spin [animation-duration:35s] [animation-timing-function:linear]">
        {/* We dynamically place icons around the orbit */}
        {icons.map((Icon, i) => {
          // Calculate positions to spread them out on different radii
          const angle = (i / icons.length) * 360;
          const radiusPercent = i % 2 === 0 ? "0%" : "12%"; // Alternate between outer and inner ring roughly
          
          return (
            <div 
              key={i} 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: i % 2 === 0 ? "100%" : "70%",
                height: i % 2 === 0 ? "100%" : "70%",
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
            >
              <OrbitNode icon={Icon} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrbitNode({ icon: Icon }: { icon: any }) {
  return (
    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
      {/* Reverse spin to keep icon upright */}
      <div className="animate-spin [animation-direction:reverse] [animation-duration:35s] [animation-timing-function:linear]">
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-110"
        >
          <Icon className="size-4 md:size-5 text-slate-600" strokeWidth={1.5} />
        </motion.div>
      </div>
    </div>
  );
}
