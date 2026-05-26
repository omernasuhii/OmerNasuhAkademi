import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface GoldenStripProps {
  children: React.ReactNode;
  className?: string;
}

export default function GoldenStrip({ children, className = "" }: GoldenStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Diagonal shimmer effect moving from right (100%) to left (-100%) as scroll progress increases
  const x = useTransform(scrollYProgress, [0, 1], ["100%", "-100%"]);
  // Opacity could fade in/out slightly for more "delicate" feel
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden bg-gradient-to-r from-yellow-500/5 via-amber-400/10 to-yellow-500/5 backdrop-blur-sm border-y border-yellow-500/20 h-16 md:h-20 flex items-center ${className}`}
    >
      {/* The Shimmer Effect */}
      <motion.div 
        style={{ x, opacity }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="h-full w-48 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent skew-x-[-30deg] blur-lg"></div>
      </motion.div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
