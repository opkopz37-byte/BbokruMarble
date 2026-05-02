"use client";

import { motion } from "motion/react";
import styles from "./Marquee.module.css";

type Props = {
  items: string[];
  /** seconds per loop, lower = faster */
  duration?: number;
  reverse?: boolean;
  variant?: "light" | "dark";
};

export default function Marquee({
  items,
  duration = 28,
  reverse = false,
  variant = "light",
}: Props) {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className={`${styles.wrapper} ${
        variant === "dark" ? styles.wrapperDark : ""
      }`}
    >
      <motion.div
        className={styles.track}
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {repeated.map((item, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.dot}>✦</span>
            <span className={styles.text}>{item}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
