"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import Magnetic from "@/components/Magnetic";
import { games } from "@/lib/games";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  return (
    <div className={styles.page}>
      {/* ============ HERO ============ */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <motion.div
            className={styles.heroImageWrap}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease }}
          >
            <Image
              src="/hero-on-air.png"
              alt="On Air — 뽀그네 게임 스튜디오"
              width={1254}
              height={1254}
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroImageGlow} aria-hidden />
          </motion.div>

          <motion.aside
            className={styles.heroSide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease, delay: 0.15 }}
          >
            <p className={styles.eyebrow}>Tonight&apos;s Games</p>
            <h2 className={styles.sideTitle}>
              오늘 함께 <em>플레이할</em> 게임
            </h2>

            <ol className={styles.tracklist}>
              {games.map((g, i) => (
                <motion.li
                  key={g.slug}
                  className={styles.track}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease, delay: 0.4 + i * 0.08 }}
                >
                  <span className={styles.trackNum}>
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <Link href={`/games/${g.slug}`} className={styles.trackLink}>
                    <span className={styles.trackTitle}>
                      {g.title}
                      {!g.available && (
                        <span className={styles.trackSoon}>SOON</span>
                      )}
                    </span>
                    <span className={styles.trackSub}>{g.sub}</span>
                  </Link>
                  <span className={styles.trackMeta}>{g.meta.duration}</span>
                  <span className={styles.trackPlay} aria-hidden>
                    ▸
                  </span>
                </motion.li>
              ))}
            </ol>

            <motion.div
              className={styles.ctaRow}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.9 }}
            >
              <Magnetic strength={0.3}>
                <Link href="/games" className={styles.cta}>
                  <span className={styles.ctaDot} aria-hidden />
                  <span>전체 게임 보기</span>
                  <span className={styles.ctaArrow} aria-hidden>→</span>
                </Link>
              </Magnetic>
              <p className={styles.schedule}>
                <span className={styles.scheduleDot} aria-hidden />
                LIVE — 언제든 함께 플레이
              </p>
            </motion.div>
          </motion.aside>
        </div>
      </section>

      {/* ============ STUDIO BIO ============ */}
      <motion.section
        className={styles.bio}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease }}
      >
        <div className={styles.bioInner}>
          <p className={styles.bioLabel}>Studio Bio</p>
          <h3 className={styles.bioTitle}>
            가벼운 마음으로, <em>그러나 진심으로</em> 노는 사람들을 위한 공간.
          </h3>
          <p className={styles.bioText}>
            뽀그네 게임 스튜디오는 친구들과 함께 즐기는 실시간 미니게임을 만들어요. 보드게임부터 가위바위보 토너먼트까지 — 한 화면을 같이 보며, 가볍게 노는 시간을 위해 디자인했습니다.
          </p>
          <ul className={styles.bioMeta}>
            <li>est. 2026</li>
            <li>Seoul</li>
            <li>실시간 멀티플레이</li>
          </ul>
        </div>
      </motion.section>

      {/* ============ FINAL CTA ============ */}
      <motion.section
        className={styles.finalCta}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease }}
      >
        <p className={styles.finalScript}>Ready?</p>
        <h2 className={styles.finalTitle}>
          지금, <em>시작해볼까요</em>
        </h2>
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
