"use client";

import { motion, type Variants } from "motion/react";

type Props = {
  text: string;
  className?: string;
  charClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function SplitChars({
  text,
  className,
  charClassName,
  delay = 0,
  stagger = 0.04,
  duration = 0.7,
}: Props) {
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const child: Variants = {
    hidden: { y: "110%", opacity: 0, rotate: 6 },
    show: {
      y: 0,
      opacity: 1,
      rotate: 0,
      transition: { duration, ease },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "inline-flex", overflow: "hidden", flexWrap: "wrap" }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          variants={child}
          className={charClassName}
          aria-hidden
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            transformOrigin: "0% 100%",
          }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}
