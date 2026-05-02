"use client";

import Link from "next/link";
import { motion } from "motion/react";
import SplitChars from "@/components/SplitChars";
import Tilt from "@/components/Tilt";
import Marquee from "@/components/Marquee";
import SectionLabel from "@/components/SectionLabel";
import BackButton from "@/components/BackButton";
import { games } from "@/lib/games";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function GamesPage() {
  return (
    <div className={styles.page}>
      {/* ============ HERO ============ */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroTop}>
          <BackButton href="/" label="홈으로" />
          <motion.div
            className={styles.heroMeta}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
          >
            <span className={styles.metaCount}>{games.length}</span>
            <span className={styles.metaLabel}>GAMES AVAILABLE</span>
          </motion.div>
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.titleLine}>
            <SplitChars text="GAMES." delay={0.2} stagger={0.05} />
          </span>
        </h1>

        <motion.p
          className={styles.heroLead}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.9 }}
        >
          뽀그네 스튜디오에서 만든<br />
          <strong>실시간 미니게임 모음.</strong>
        </motion.p>
      </section>

      {/* ============ MARQUEE ============ */}
      <Marquee
        items={["뽁루마블", "BOARDGAME", "가위바위보", "TOURNAMENT", "MORE COMING SOON"]}
        duration={30}
      />

      {/* ============ GAME LIST ============ */}
      <section className={styles.list}>
        <SectionLabel index="02" label="/ LINEUP" />

        <div className={styles.cards}>
          {games.map((g, i) => (
            <motion.div
              key={g.slug}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease, delay: i * 0.1 }}
            >
              <Tilt max={5} scale={1.012} className={styles.tiltWrap}>
                <Link
                  href={`/games/${g.slug}`}
                  className={`${styles.card} ${
                    g.available ? "" : styles.cardSoon
                  }`}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardCategory}>{g.category}</span>
                    <span
                      className={`${styles.cardBadge} ${
                        g.badgeTone === "pink" ? styles.cardBadgePink : ""
                      }`}
                    >
                      {g.badge}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <span className={styles.cardEmoji} aria-hidden>
                      {g.accent}
                    </span>
                    <h2 className={styles.cardTitle}>{g.title}</h2>
                    <p className={styles.cardSub}>{g.sub}</p>
                    <p className={styles.cardDesc}>{g.description}</p>
                  </div>

                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaItemLabel}>인원</span>
                      <span className={styles.metaItemValue}>{g.meta.players}</span>
                    </div>
                  </div>

                  <span className={styles.cardMore}>
                    자세히 보기 <span aria-hidden>→</span>
                  </span>
                </Link>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
