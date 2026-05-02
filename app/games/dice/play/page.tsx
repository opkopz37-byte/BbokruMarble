"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Magnetic from "@/components/Magnetic";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

type ThemeKey = "dawn" | "acting" | "calm" | "excite";

type ThemeConfig = {
  key: ThemeKey;
  name: string;
  short: string;
  emoji: string;
  rollSound: string;
  voices: Record<number, string>;
  resultColor: string;
  buttonGradient: string;
  softBg: string;
};

const THEMES: ThemeConfig[] = [
  {
    key: "dawn",
    name: "새벽 주사위",
    short: "새벽",
    emoji: "💗",
    rollSound: "/boardgame/sounds/dice-roll.mp3",
    voices: {
      1: "/boardgame/sounds/a1_융망_새벽.mp3",
      2: "/boardgame/sounds/a2_딸기_새벽.mp3",
      3: "/boardgame/sounds/a3_아희_새벽.mp3",
      4: "/boardgame/sounds/a4_잔디_새벽.mp3",
      5: "/boardgame/sounds/a5_연우_새벽.mp3",
      6: "/boardgame/sounds/a6_밍이_새벽.mp3",
    },
    resultColor: "#FF69B4",
    buttonGradient: "linear-gradient(135deg, #FF69B4, #FFB6C1)",
    softBg: "#FFE4F1",
  },
  {
    key: "acting",
    name: "연기 주사위",
    short: "연기",
    emoji: "💜",
    rollSound: "/boardgame/sounds/dice-roll.mp3",
    voices: {
      1: "/boardgame/sounds/b1_나찌_연기.mp3",
      2: "/boardgame/sounds/b2_밍이_연기.mp3",
      3: "/boardgame/sounds/b3_대니_연기.mp3",
      4: "/boardgame/sounds/b4_뽀름_연기.mp3",
      5: "/boardgame/sounds/b5_카즈_연기.mp3",
      6: "/boardgame/sounds/b6_두식이_연기.mp3",
    },
    resultColor: "#9370DB",
    buttonGradient: "linear-gradient(135deg, #9370DB, #BA55D3)",
    softBg: "#EFE4FB",
  },
  {
    key: "calm",
    name: "차분 주사위",
    short: "차분",
    emoji: "💙",
    rollSound: "/boardgame/sounds/dice-roll.mp3",
    voices: {
      1: "/boardgame/sounds/c1_키키_차분.mp3",
      2: "/boardgame/sounds/c2_꽃순이_차분.mp3",
      3: "/boardgame/sounds/c3_와이비_차분.mp3",
      4: "/boardgame/sounds/c4_윤정_차분.mp3",
      5: "/boardgame/sounds/c5_밍이_차분.mp3",
      6: "/boardgame/sounds/c6_로젬_차분.mp3",
    },
    resultColor: "#4682B4",
    buttonGradient: "linear-gradient(135deg, #4682B4, #87CEEB)",
    softBg: "#E1F0FA",
  },
  {
    key: "excite",
    name: "촐싹 주사위",
    short: "촐싹",
    emoji: "🧡",
    rollSound: "/boardgame/sounds/dice-roll.mp3",
    voices: {
      1: "/boardgame/sounds/d1_똥깽_촐싹.mp3",
      2: "/boardgame/sounds/d2_밍이_촐싹.mp3",
      3: "/boardgame/sounds/d3_뽀끼리_촐싹.mp3",
      4: "/boardgame/sounds/d4_고도리_촐싹.mp3",
      5: "/boardgame/sounds/d5_밍이_촐싹.mp3",
      6: "/boardgame/sounds/d6_꽃순이_촐싹.mp3",
    },
    resultColor: "#ff8855",
    buttonGradient: "linear-gradient(135deg, #ff8855, #FFB84D)",
    softBg: "#FFEAD9",
  },
];

const FACE_ROTATIONS: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(0deg) rotateY(-180deg)",
  4: "rotateX(0deg) rotateY(90deg)",
  5: "rotateX(-90deg) rotateY(0deg)",
  6: "rotateX(90deg) rotateY(0deg)",
};

const ROLL_DURATION_MS = 1200;
const VOICE_DELAY_MS = 600;
const HISTORY_LIMIT = 30;

type RollEntry = { id: number; theme: ThemeKey; value: number };

export default function DicePlayPage() {
  const [themeKey, setThemeKey] = useState<ThemeKey>("dawn");
  const [face, setFace] = useState<number>(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const idRef = useRef(0);

  const getAudio = useCallback((src: string) => {
    const cache = audioCacheRef.current;
    let audio = cache.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = "auto";
      cache.set(src, audio);
    }
    return audio;
  }, []);

  const theme = useMemo(
    () => THEMES.find((t) => t.key === themeKey) ?? THEMES[0],
    [themeKey],
  );

  const stats = useMemo(() => {
    const count = history.length;
    const sum = history.reduce((a, b) => a + b.value, 0);
    return { count, sum };
  }, [history]);

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setResult(null);

    if (soundOn) {
      try {
        if (rollSoundRef.current) rollSoundRef.current.pause();
        const audio = getAudio(theme.rollSound);
        audio.volume = 0.7;
        audio.currentTime = 0;
        rollSoundRef.current = audio;
        audio.play().catch(() => {});
      } catch {}
    }

    const num = Math.floor(Math.random() * 6) + 1;

    window.setTimeout(() => {
      setRolling(false);
      setFace(num);
      setResult(num);
      idRef.current += 1;
      setHistory((prev) =>
        [{ id: idRef.current, theme: themeKey, value: num }, ...prev].slice(
          0,
          HISTORY_LIMIT,
        ),
      );

      if (soundOn) {
        window.setTimeout(() => {
          try {
            if (voiceRef.current) voiceRef.current.pause();
            const v = getAudio(theme.voices[num]);
            v.volume = 0.8;
            v.currentTime = 0;
            voiceRef.current = v;
            v.play().catch(() => {});
          } catch {}
        }, VOICE_DELAY_MS);
      }
    }, ROLL_DURATION_MS);
  }, [rolling, soundOn, theme, themeKey, getAudio]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      rollDice();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rollDice]);

  const resetHistory = () => {
    setHistory([]);
    setResult(null);
  };

  return (
    <div
      className={styles.page}
      style={{ "--theme-soft": theme.softBg } as React.CSSProperties}
    >
      <div className={styles.heroBg} aria-hidden />

      <header className={styles.topbar}>
        <Link href="/games/dice" className={styles.backLink}>
          <span aria-hidden>←</span>
          <span>게임 상세</span>
        </Link>
        <div className={styles.topbarRight}>
          <button
            type="button"
            className={`${styles.iconBtn} ${soundOn ? "" : styles.iconBtnOff}`}
            onClick={() => setSoundOn((v) => !v)}
            aria-label={soundOn ? "사운드 끄기" : "사운드 켜기"}
          >
            <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
          </button>
          <span className={styles.kbdHint}>
            <kbd>SPACE</kbd>
            <span className={styles.kbdLabel}>로 굴리기</span>
          </span>
        </div>
      </header>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          주사위 굴리기
          <span className={styles.titleDot} aria-hidden>
            🎲
          </span>
        </h1>
        <p className={styles.subtitle}>
          <span aria-hidden>{theme.emoji}</span>
          <span>{theme.name}</span>
        </p>
      </div>

      <div className={styles.mainGrid}>
        {/* ============ LEFT: DICE STAGE ============ */}
        <section className={styles.leftCol}>
          <div className={styles.diceStage}>
            <div className={styles.sparkleA} aria-hidden>
              ✦
            </div>
            <div className={styles.sparkleB} aria-hidden>
              ✦
            </div>
            <div className={styles.sparkleC} aria-hidden>
              ✦
            </div>
            <div className={styles.diceShadow} aria-hidden />
            <div
              className={`${styles.dice3d} ${
                styles[`theme_${themeKey}` as keyof typeof styles] ?? ""
              } ${rolling ? styles.rolling : ""}`}
              style={!rolling ? { transform: FACE_ROTATIONS[face] } : undefined}
            >
              <div className={`${styles.face} ${styles.faceFront}`}>1</div>
              <div className={`${styles.face} ${styles.faceRight}`}>2</div>
              <div className={`${styles.face} ${styles.faceBack}`}>3</div>
              <div className={`${styles.face} ${styles.faceLeft}`}>4</div>
              <div className={`${styles.face} ${styles.faceTop}`}>5</div>
              <div className={`${styles.face} ${styles.faceBottom}`}>6</div>
            </div>
          </div>

          <div className={styles.resultArea}>
            <AnimatePresence mode="wait">
              {result !== null && !rolling && (
                <motion.div
                  key={`result-${idRef.current}`}
                  className={styles.resultBubble}
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, scale: 0.9 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <span className={styles.resultLabel}>결과</span>
                  <span
                    className={styles.resultNum}
                    style={{ color: theme.resultColor }}
                  >
                    {result}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Magnetic strength={0.2}>
            <button
              type="button"
              className={styles.rollBtn}
              style={{ background: theme.buttonGradient }}
              onClick={rollDice}
              disabled={rolling}
            >
              <span className={styles.rollBtnLabel}>
                <span aria-hidden>🎲</span>
                {rolling ? "굴리는 중..." : "굴리기"}
              </span>
            </button>
          </Magnetic>
        </section>

        {/* ============ RIGHT: PANEL ============ */}
        <aside className={styles.rightCol}>
          <div className={styles.panel}>
            {/* THEMES */}
            <div className={styles.panelSection}>
              <h3 className={styles.sectionLabel}>
                <span aria-hidden>🎨</span> 테마 선택
              </h3>
              <div className={styles.themeGrid}>
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`${styles.themeCard} ${
                      themeKey === t.key ? styles.themeActive : ""
                    }`}
                    style={
                      {
                        "--theme-gradient": t.buttonGradient,
                        "--theme-soft-card": t.softBg,
                      } as React.CSSProperties
                    }
                    onClick={() => setThemeKey(t.key)}
                    disabled={rolling}
                  >
                    <span className={styles.themeEmoji} aria-hidden>
                      {t.emoji}
                    </span>
                    <span className={styles.themeName}>{t.short}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.panelDivider} aria-hidden />

            {/* STATS */}
            <div className={styles.panelSection}>
              <h3 className={styles.sectionLabel}>
                <span aria-hidden>📊</span> 통계
              </h3>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>횟수</span>
                  <span className={styles.statValue}>{stats.count}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>합계</span>
                  <span className={styles.statValue}>{stats.sum}</span>
                </div>
              </div>
            </div>

            <div className={styles.panelDivider} aria-hidden />

            {/* HISTORY */}
            <div className={styles.panelSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionLabel}>
                  <span aria-hidden>📜</span> 최근 결과
                </h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    className={styles.resetBtn}
                    onClick={resetHistory}
                  >
                    초기화
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className={styles.historyEmpty}>
                  아직 굴린 결과가 없어요
                </p>
              ) : (
                <ul className={styles.historyList}>
                  <AnimatePresence initial={false}>
                    {history.slice(0, 5).map((h) => {
                      const t =
                        THEMES.find((x) => x.key === h.theme) ?? THEMES[0];
                      return (
                        <motion.li
                          key={h.id}
                          className={styles.historyItem}
                          initial={{ opacity: 0, x: -16, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: 16, height: 0 }}
                          transition={{ duration: 0.3, ease }}
                        >
                          <span
                            className={styles.historyDot}
                            style={{ background: t.resultColor }}
                            aria-hidden
                          />
                          <span className={styles.historyEmoji} aria-hidden>
                            {t.emoji}
                          </span>
                          <span className={styles.historyTheme}>
                            {t.short}
                          </span>
                          <span
                            className={styles.historyValue}
                            style={{ color: t.resultColor }}
                          >
                            {h.value}
                          </span>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
