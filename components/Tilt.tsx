"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** maximum rotation in degrees */
  max?: number;
  /** scale on hover */
  scale?: number;
};

export default function Tilt({
  children,
  className,
  max = 8,
  scale = 1.02,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useTransform(my, [-0.5, 0.5], [max, -max]);
  const ry = useTransform(mx, [-0.5, 0.5], [-max, max]);

  const srx = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.5 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(x);
    my.set(y);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale }}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      transition={{ scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
    >
      {children}
    </motion.div>
  );
}
