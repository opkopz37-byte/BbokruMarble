"use client";

import { motion } from "motion/react";
import styles from "./SectionLabel.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  index: string;
  label: string;
  inverted?: boolean;
  align?: "left" | "center";
};

export default function SectionLabel({
  index,
  label,
  inverted = false,
  align = "left",
}: Props) {
  return (
    <motion.div
      className={`${styles.label} ${inverted ? styles.inverted : ""} ${
        align === "center" ? styles.center : ""
      }`}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
    >
      <span className={styles.num}>{index}</span>
      <span className={styles.text}>{label}</span>
    </motion.div>
  );
}
