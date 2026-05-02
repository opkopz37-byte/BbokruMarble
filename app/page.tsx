"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import Marquee from "@/components/Marquee";
import SplitChars from "@/components/SplitChars";
import Magnetic from "@/components/Magnetic";
import SectionLabel from "@/components/SectionLabel";
import { games } from "@/lib/games";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);

  return (
    <div className={styles.page}>
      {/* ============ HERO ============ */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroBg} aria-hidden />
        <span className={`${styles.deco} ${styles.decoCircle}`} aria-hidden />

        <motion.div
          className={styles.heroTop}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
        >
          <span className={styles.heroLabel}>
            EST. 2026 — REAL-TIME MINI GAMES
          </span>
        </motion.div>

        <motion.h1
          className={styles.heroTitle}
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <span className={styles.titleLine}>
            <SplitChars text="뽀그네" delay={0.2} stagger={0.06} />
          </span>
          <span className={styles.titleLine}>
            <SplitChars text="게임 스튜디오." delay={0.5} stagger={0.045} />
          </span>
        </motion.h1>

        <motion.div
          className={styles.heroFoot}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.1 }}
        >
          <p className={styles.tagline}>
            친구들과 함께 즐기는<br />
            <strong>실시간 미니게임 모음.</strong>
          </p>
          <Magnetic strength={0.3}>
            <Link href="/games" className={styles.cta}>
              <span>게임 보러가기</span>
              <span className={styles.ctaArrow} aria-hidden>→</span>
            </Link>
          </Magnetic>
        </motion.div>

        <motion.div
          className={styles.scrollHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
        >
          <span>SCROLL</span>
          <motion.div
            className={styles.scrollBar}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ============ MARQUEE (single line) ============ */}
      <Marquee
        items={["GAMES", "COMMUNITY", "REAL-TIME", "TOGETHER", "FUN", "PLAY", "BBOGRENE STUDIO"]}
        duration={32}
      />

      {/* ============ 01 PHILOSOPHY ============ */}
      <section className={styles.philosophy}>
        <span className={styles.bgNum} aria-hidden>01</span>
        <SectionLabel index="01" label="/ PHILOSOPHY" />
        <motion.p
          className={styles.philosophyText}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease }}
        >
          가벼운 마음으로,<br />
          <span className={styles.highlight}>그러나 진심으로</span><br />
          노는 사람들을 위한 공간.
        </motion.p>
      </section>

      {/* ============ 02 GAMES (minimal list) ============ */}
      <section className={styles.gamesSection}>
        <span className={styles.bgNum} aria-hidden>02</span>
        <div className={styles.gamesHead}>
          <SectionLabel index="02" label="/ GAMES" />
          <Link href="/games" className={styles.gamesAll}>
            전체 보기 <span aria-hidden>→</span>
          </Link>
        </div>

        <ul className={styles.gameList}>
          {games.map((g, i) => (
            <motion.li
              key={g.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
            >
              <Link href={`/games/${g.slug}`} className={styles.gameRow}>
                <span className={styles.gameRowEmoji} aria-hidden>{g.accent}</span>
                <span className={styles.gameRowTitle}>{g.title}</span>
                <span className={styles.gameRowSub}>{g.sub}</span>
                {g.available ? (
                  <span className={styles.gameRowArrow} aria-hidden>→</span>
                ) : (
                  <span className={styles.gameRowSoon}>준비중</span>
                )}
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* ============ 03 FINAL CTA ============ */}
      <motion.section
        className={styles.finalCta}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease }}
      >
        <SectionLabel index="03" label="/ READY?" align="center" />
        <h2 className={styles.finalTitle}>
          준비됐나요<span className={styles.titlePunct}>?</span>
        </h2>
        <p className={styles.finalText}>
          지금 바로 게임을 시작해보세요.
        </p>
        <Magnetic strength={0.4}>
          <Link href="/games" className={styles.finalBtn}>
            <span>START NOW</span>
            <span className={styles.finalArrow} aria-hidden>↗</span>
          </Link>
        </Magnetic>
      </motion.section>
    </div>
  );
}
