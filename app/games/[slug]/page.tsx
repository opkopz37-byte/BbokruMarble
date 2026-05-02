"use client";

import { use, useRef } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import SplitChars from "@/components/SplitChars";
import Magnetic from "@/components/Magnetic";
import SectionLabel from "@/components/SectionLabel";
import { getGame, games } from "@/lib/games";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const game = getGame(slug);
  if (!game) notFound();

  const others = games.filter((g) => g.slug !== slug);
  const aboutRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  const scrollToAbout = () => {
    if (aboutRef.current) {
      lenis?.scrollTo(aboutRef.current, { offset: -90 });
    }
  };

  return (
    <div className={styles.page}>
      {/* ============ HERO ============ */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />

        <motion.div
          className={styles.heroTop}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
        >
          <Link href="/games" className={styles.backLink}>
            <span aria-hidden>←</span> 게임 목록으로
          </Link>
          <span
            className={`${styles.badge} ${
              game.badgeTone === "pink" ? styles.badgePink : ""
            }`}
          >
            {game.badge}
          </span>
        </motion.div>

        <motion.div
          className={styles.heroBody}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          <span className={styles.category}>{game.category}</span>
          <h1 className={styles.title}>
            <SplitChars text={game.title} delay={0.25} stagger={0.05} />
          </h1>
          <motion.p
            className={styles.sub}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.6 }}
          >
            {game.sub}
          </motion.p>

          <motion.span
            className={styles.heroEmoji}
            aria-hidden
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.8 }}
          >
            {game.accent}
          </motion.span>

          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.9 }}
          >
            {game.available ? (
              <>
                <Magnetic strength={0.3}>
                  <a href={game.playHref} className={styles.heroPlayBtn}>
                    <span>{game.playLabel ?? "게임 플레이 하기"}</span>
                    <span className={styles.heroBtnArrow} aria-hidden>↗</span>
                  </a>
                </Magnetic>
                {game.joinHref && (
                  <Magnetic strength={0.3}>
                    <a href={game.joinHref} className={styles.heroJoinBtn}>
                      <span>{game.joinLabel ?? "참가하기"}</span>
                      <span className={styles.heroBtnArrow} aria-hidden>→</span>
                    </a>
                  </Magnetic>
                )}
              </>
            ) : (
              <span className={styles.heroPlayBtnDisabled}>
                <span>준비중</span>
              </span>
            )}
            <button
              type="button"
              onClick={scrollToAbout}
              className={styles.heroDescBtn}
            >
              <span>게임 설명 보기</span>
              <span className={styles.heroDescArrow} aria-hidden>↓</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.heroMeta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 1.0 }}
        >
          <MetaItem label="인원" value={game.meta.players} />
          <MetaItem label="난이도" value={game.meta.difficulty} />
        </motion.div>
      </section>

      {/* ============ 01 ABOUT ============ */}
      <section className={styles.section} ref={aboutRef}>
        <span className={styles.bgNum} aria-hidden>01</span>
        <SectionLabel index="01" label="/ ABOUT" />
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          어떤 게임인가요?
        </motion.h2>
        <div className={styles.aboutBody}>
          <motion.p
            className={styles.aboutLead}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease }}
          >
            {game.description}
          </motion.p>
          <div className={styles.aboutDetails}>
            {game.longDescription.map((p, i) => (
              <motion.p
                key={i}
                className={styles.aboutPara}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease, delay: i * 0.1 }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 02 FEATURES ============ */}
      <section className={styles.section}>
        <span className={styles.bgNum} aria-hidden>02</span>
        <SectionLabel index="02" label="/ FEATURES" />
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          주요 특징
        </motion.h2>
        <div className={styles.featureGrid}>
          {game.features.map((f, i) => (
            <motion.div
              key={f}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <span className={styles.featureCheck} aria-hidden>✓</span>
              <span>{f}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ 03 HOW TO PLAY ============ */}
      <section className={styles.howSection}>
        <SectionLabel index="03" label="/ HOW TO PLAY" inverted />
        <motion.h2
          className={`${styles.sectionTitle} ${styles.titleInverted}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          플레이 방법
        </motion.h2>
        <ol className={styles.howList}>
          {game.howTo.map((step, i) => (
            <motion.li
              key={step.n}
              className={styles.howItem}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
            >
              <span className={styles.howNum}>{step.n}</span>
              <div className={styles.howBody}>
                <h3 className={styles.howTitle}>{step.title}</h3>
                <p className={styles.howText}>{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ============ 04 OTHER GAMES ============ */}
      {others.length > 0 && (
        <section className={styles.section}>
          <span className={styles.bgNum} aria-hidden>04</span>
          <SectionLabel index="04" label="/ OTHER GAMES" />
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
          >
            다른 게임도<br />
            <span className={styles.sectionTitleAccent}>둘러보세요</span>
          </motion.h2>
          <div className={styles.otherGrid}>
            {others.map((g, i) => (
              <motion.div
                key={g.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease, delay: i * 0.1 }}
              >
                <Link href={`/games/${g.slug}`} className={styles.otherCard}>
                  <div className={styles.otherCardTop}>
                    <span
                      className={`${styles.badge} ${
                        g.badgeTone === "pink" ? styles.badgePink : ""
                      }`}
                    >
                      {g.badge}
                    </span>
                    <span className={styles.otherEmoji} aria-hidden>
                      {g.accent}
                    </span>
                  </div>
                  <h3 className={styles.otherTitle}>{g.title}</h3>
                  <p className={styles.otherSub}>{g.sub}</p>
                  <span className={styles.otherMore}>
                    자세히 보기 <span aria-hidden>→</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}
