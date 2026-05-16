"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { get, onDisconnect, onValue, ref, set, update } from "firebase/database";
import Magnetic from "@/components/Magnetic";
import ConfirmModal from "@/components/ConfirmModal";
import { db } from "@/lib/firebase";
import {
  createInitialDiceRoom,
  DICE_HISTORY_LIMIT,
  DICE_ROOM_PATH,
  generateDiceClientId,
  type DiceHistoryEntry,
  type DiceRoom,
  type DiceThemeKey,
} from "@/lib/dice";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

type ThemeConfig = {
  key: DiceThemeKey;
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

function DicePlayPageInner() {
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");

  const [room, setRoom] = useState<DiceRoom | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [hostBusy, setHostBusy] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const initOnce = useRef(false);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const lastRollSeqRef = useRef<number>(-1);
  const lastResultSeqRef = useRef<number>(-1);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------- AUDIO HELPERS --------
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

  const playRollSound = useCallback(
    (theme: ThemeConfig) => {
      try {
        if (rollSoundRef.current) rollSoundRef.current.pause();
        const audio = getAudio(theme.rollSound);
        audio.volume = 0.7;
        audio.currentTime = 0;
        rollSoundRef.current = audio;
        audio.play().catch(() => {});
      } catch {}
    },
    [getAudio],
  );

  const playVoice = useCallback(
    (theme: ThemeConfig, value: number) => {
      try {
        if (voiceRef.current) voiceRef.current.pause();
        const v = getAudio(theme.voices[value]);
        v.volume = 0.8;
        v.currentTime = 0;
        voiceRef.current = v;
        v.play().catch(() => {});
      } catch {}
    },
    [getAudio],
  );

  // -------- ROLE INIT --------
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    const id = generateDiceClientId();
    setClientId(id);

    (async () => {
      try {
        const snap = await get(ref(db, DICE_ROOM_PATH));
        const existing = snap.val() as DiceRoom | null;

        if (requestedRole === "host") {
          if (!existing || !existing.hostId) {
            const initial = createInitialDiceRoom(id);
            await set(ref(db, DICE_ROOM_PATH), initial);
            setIsHost(true);
          } else if (existing.hostId === id) {
            setIsHost(true);
          } else {
            // 다른 호스트가 이미 있음 → 관전 모드로 다운그레이드
            setIsHost(false);
          }
        } else {
          setIsHost(false);
        }
      } catch (e) {
        console.error("[dice] init failed", e);
        setIsHost(false);
      }
    })();
  }, [requestedRole]);

  // -------- SUBSCRIBE --------
  useEffect(() => {
    const unsub = onValue(ref(db, DICE_ROOM_PATH), (snap) => {
      const data = snap.val() as DiceRoom | null;
      setRoom(data);
      setRoomLoaded(true);
    });
    return () => unsub();
  }, []);

  // -------- HOST onDisconnect CLEANUP --------
  useEffect(() => {
    if (!isHost || !clientId) return;
    const hostIdRef = ref(db, `${DICE_ROOM_PATH}/hostId`);
    const rollingRef = ref(db, `${DICE_ROOM_PATH}/rolling`);
    onDisconnect(hostIdRef).set(null);
    onDisconnect(rollingRef).set(false);
  }, [isHost, clientId]);

  // -------- REACT TO ROLL EVENTS (sound + animation drives off room state) --------
  useEffect(() => {
    if (!room) return;
    const themeCfg = THEMES.find((t) => t.key === room.theme) ?? THEMES[0];

    // rolling 시작 — 관전자만 소리 (호스트는 클릭 시점에 이미 재생)
    if (room.rolling && room.rollSeq !== lastRollSeqRef.current) {
      lastRollSeqRef.current = room.rollSeq;
      if (!isHost && soundOn) playRollSound(themeCfg);
    }

    // 결과 도착 — 보이스 재생 (호스트/관전자 동일하게 반응)
    if (
      !room.rolling &&
      room.result !== null &&
      room.rollSeq !== lastResultSeqRef.current
    ) {
      lastResultSeqRef.current = room.rollSeq;
      if (soundOn) {
        if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
        const finalResult = room.result;
        voiceTimerRef.current = setTimeout(() => {
          playVoice(themeCfg, finalResult);
        }, VOICE_DELAY_MS);
      }
    }
  }, [room, isHost, soundOn, playRollSound, playVoice]);

  // -------- CLEANUP TIMERS --------
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    };
  }, []);

  // -------- DERIVED STATE --------
  const themeKey: DiceThemeKey = room?.theme ?? "dawn";
  const theme = useMemo(
    () => THEMES.find((t) => t.key === themeKey) ?? THEMES[0],
    [themeKey],
  );
  const face = room?.face ?? 1;
  const rolling = room?.rolling ?? false;
  const result = room?.result ?? null;
  const history: DiceHistoryEntry[] = room?.history ?? [];

  const stats = useMemo(() => {
    const count = history.length;
    const sum = history.reduce((a, b) => a + b.value, 0);
    return { count, sum };
  }, [history]);

  // -------- HOST ACTIONS --------
  const rollDice = useCallback(async () => {
    if (!isHost || !room || rolling || hostBusy) return;
    setHostBusy(true);

    const num = Math.floor(Math.random() * 6) + 1;
    const newSeq = (room.rollSeq ?? 0) + 1;

    if (soundOn) playRollSound(theme);

    try {
      await update(ref(db, DICE_ROOM_PATH), {
        rolling: true,
        rollSeq: newSeq,
        result: null,
        updatedAt: Date.now(),
      });

      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
      rollTimerRef.current = setTimeout(async () => {
        const newEntry: DiceHistoryEntry = {
          id: newSeq,
          theme: theme.key,
          value: num,
          ts: Date.now(),
        };
        const newHistory = [newEntry, ...history].slice(0, DICE_HISTORY_LIMIT);
        try {
          await update(ref(db, DICE_ROOM_PATH), {
            rolling: false,
            face: num,
            result: num,
            history: newHistory,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.error("[dice] commit roll failed", e);
        } finally {
          setHostBusy(false);
        }
      }, ROLL_DURATION_MS);
    } catch (e) {
      console.error("[dice] start roll failed", e);
      setHostBusy(false);
    }
  }, [isHost, room, rolling, hostBusy, soundOn, theme, history, playRollSound]);

  const changeTheme = useCallback(
    async (key: DiceThemeKey) => {
      if (!isHost || rolling) return;
      try {
        await update(ref(db, DICE_ROOM_PATH), {
          theme: key,
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.error("[dice] change theme failed", e);
      }
    },
    [isHost, rolling],
  );

  const resetHistory = useCallback(async () => {
    if (!isHost) return;
    try {
      await update(ref(db, DICE_ROOM_PATH), {
        history: [],
        result: null,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error("[dice] reset history failed", e);
    }
  }, [isHost]);

  // -------- KEYBOARD --------
  useEffect(() => {
    if (!isHost) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      rollDice();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isHost, rollDice]);

  // -------- RENDER STATES --------
  if (isHost === null || !roomLoaded) {
    return (
      <div className={styles.page}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.titleBlock}>
          <p className={styles.subtitle}>연결 중...</p>
        </div>
      </div>
    );
  }

  // 관전자인데 방이 아예 없거나 호스트가 없는 경우
  const noHost = !room || !room.hostId;
  const downgraded = requestedRole === "host" && !isHost;

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
          <span className={styles.kbdHint} aria-label={isHost ? "호스트 모드" : "관전 모드"}>
            <span aria-hidden>{isHost ? "🎤" : "👀"}</span>
            <span className={styles.kbdLabel}>
              {isHost ? "호스트" : "관전 중"}
            </span>
          </span>
          <button
            type="button"
            className={`${styles.iconBtn} ${soundOn ? "" : styles.iconBtnOff}`}
            onClick={() => setSoundOn((v) => !v)}
            aria-label={soundOn ? "사운드 끄기" : "사운드 켜기"}
          >
            <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
          </button>
          {isHost && (
            <span className={styles.kbdHint}>
              <kbd>SPACE</kbd>
              <span className={styles.kbdLabel}>로 굴리기</span>
            </span>
          )}
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
          {downgraded && (
            <span className={styles.kbdLabel} style={{ marginLeft: 12 }}>
              · 이미 호스트가 있어 관전 모드로 입장했어요
            </span>
          )}
          {!isHost && noHost && (
            <span className={styles.kbdLabel} style={{ marginLeft: 12 }}>
              · 호스트 대기중
            </span>
          )}
        </p>
      </div>

      <div className={styles.mainGrid}>
        {/* ============ LEFT: DICE STAGE ============ */}
        <section className={styles.leftCol}>
          <div className={styles.diceStage}>
            <div className={styles.sparkleA} aria-hidden>✦</div>
            <div className={styles.sparkleB} aria-hidden>✦</div>
            <div className={styles.sparkleC} aria-hidden>✦</div>
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
                  key={`result-${room?.rollSeq ?? 0}`}
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
              disabled={!isHost || rolling || hostBusy}
              aria-disabled={!isHost}
              title={isHost ? undefined : "호스트만 굴릴 수 있어요"}
            >
              <span className={styles.rollBtnLabel}>
                <span aria-hidden>🎲</span>
                {!isHost
                  ? "호스트가 굴립니다"
                  : rolling
                    ? "굴리는 중..."
                    : "굴리기"}
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
                    onClick={() => changeTheme(t.key)}
                    disabled={!isHost || rolling}
                    aria-disabled={!isHost}
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
                {isHost && history.length > 0 && (
                  <button
                    type="button"
                    className={styles.resetBtn}
                    onClick={() => setResetConfirmOpen(true)}
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

      <ConfirmModal
        open={resetConfirmOpen}
        title="히스토리 초기화"
        message="지금까지 굴린 결과를 모두 지울까요? 모든 관전자 화면에서도 함께 사라져요."
        confirmLabel="초기화"
        cancelLabel="취소"
        onConfirm={async () => {
          setResetConfirmOpen(false);
          await resetHistory();
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}

export default function DicePlayPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.heroBg} aria-hidden />
        </div>
      }
    >
      <DicePlayPageInner />
    </Suspense>
  );
}
