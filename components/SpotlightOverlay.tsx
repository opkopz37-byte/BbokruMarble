"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import styles from "./SpotlightOverlay.module.css";

/**
 * 다크 페이지 위에 깔리는 vignette 스폿라이트.
 * - 평소엔 옅은 vignette
 * - 스크롤 중에는 더 짙어져서 viewport 중앙으로 시선 집중
 * - 스크롤 멈추면 다시 옅어짐
 *
 * position: fixed + radial-gradient 한 장이라 합성 비용 낮음.
 * 모션 라이브러리의 useMotionValueEvent로 React 리렌더 없이 클래스 토글만 하므로
 * 스크롤 중에 추가 비용이 거의 없음.
 */
export default function SpotlightOverlay() {
  const { scrollY } = useScroll();
  const [active, setActive] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMotionValueEvent(scrollY, "change", () => {
    setActive(true);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setActive(false), 220);
  });

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  return (
    <motion.div
      className={styles.overlay}
      aria-hidden
      initial={false}
      animate={{ opacity: active ? 1 : 0.45 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
