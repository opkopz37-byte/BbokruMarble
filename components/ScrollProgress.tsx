"use client";

import { motion, useScroll, useSpring } from "motion/react";
import styles from "./ScrollProgress.module.css";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 22,
    mass: 0.4,
  });

  return <motion.div className={styles.bar} style={{ scaleX }} />;
}
