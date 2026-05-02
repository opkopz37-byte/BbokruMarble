"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./ScrollButtons.module.css";

export default function ScrollButtons() {
  const lenis = useLenis();
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    let frameId = 0;
    const compute = () => {
      frameId = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShowTop(y > 200);
      setShowBottom(y < max - 50);
    };
    const onScroll = () => {
      // rAF로 throttle: 매 픽셀이 아니라 프레임당 한 번만 reflow
      if (frameId) return;
      frameId = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  const toTop = () => lenis?.scrollTo(0);
  const toBottom = () =>
    lenis?.scrollTo(document.documentElement.scrollHeight);

  return (
    <div className={styles.wrap}>
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="top"
            type="button"
            onClick={toTop}
            className={styles.btn}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ duration: 0.2 }}
            aria-label="최상단으로 이동"
          >
            <span aria-hidden>↑</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBottom && (
          <motion.button
            key="bottom"
            type="button"
            onClick={toBottom}
            className={`${styles.btn} ${styles.btnDark}`}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ duration: 0.2 }}
            aria-label="최하단으로 이동"
          >
            <span aria-hidden>↓</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
