"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { get, onValue, ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  generateClientId,
  RPS_ROOM_PATH,
  type RpsRoom,
  type Participant,
} from "@/lib/rps";
import SectionLabel from "@/components/SectionLabel";
import BackButton from "@/components/BackButton";
import Magnetic from "@/components/Magnetic";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

function generateHostNickname() {
  return "주최자";
}

export default function RpsHostPage() {
  const router = useRouter();
  const [room, setRoom] = useState<RpsRoom | null>(null);
  const [copied, setCopied] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initOnce = useRef(false);

  // Initialize room on mount — only if room doesn't exist or is finished
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    (async () => {
      try {
        const snap = await get(ref(db, RPS_ROOM_PATH));
        const existing = snap.val() as RpsRoom | null;
        if (
          existing &&
          existing.status !== "finished" &&
          existing.status !== "waiting"
        ) {
          // Mid-game: don't overwrite, take over as host
          sessionStorage.setItem("rps:isHost", "true");
          return;
        }

        const hostId = generateClientId();
        const initialRoom: RpsRoom = {
          status: "waiting",
          hostId,
          hostNickname: generateHostNickname(),
          hostChoice: null,
          createdAt: Date.now(),
          currentRound: 0,
          countdownEndsAt: null,
          lastResult: null,
          winner: null,
        };
        await set(ref(db, RPS_ROOM_PATH), initialRoom);
        sessionStorage.setItem("rps:isHost", "true");
      } catch (err) {
        console.error("[rps host] init failed:", err);
        setInitError(
          err instanceof Error
            ? err.message
            : "방을 만들지 못했어요. 잠시 후 다시 시도해주세요."
        );
      }
    })();
  }, []);

  // Subscribe to room
  useEffect(() => {
    const unsub = onValue(ref(db, RPS_ROOM_PATH), (snap) => {
      setRoom(snap.val());
    });
    return () => unsub();
  }, []);

  const participants = useMemo<Participant[]>(() => {
    if (!room?.participants) return [];
    return Object.values(room.participants).sort(
      (a, b) => a.joinedAt - b.joinedAt
    );
  }, [room]);

  function startGame() {
    if (!room) return;
    if (participants.length === 0) return;
    update(ref(db, RPS_ROOM_PATH), {
      status: "selecting",
      currentRound: 1,
      hostChoice: null,
      countdownEndsAt: null,
      lastResult: null,
      winner: null,
    });
    // Reset all participants
    const updates: Record<string, unknown> = {};
    participants.forEach((p) => {
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/alive`] = true;
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/currentChoice`] = null;
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/eliminatedRound`] = null;
    });
    if (Object.keys(updates).length > 0) update(ref(db), updates);
    router.push("/games/rps/arena");
  }

  function addBot() {
    const id = `bot_${generateClientId()}`;
    const num = Math.floor(100 + Math.random() * 900);
    set(ref(db, `${RPS_ROOM_PATH}/participants/${id}`), {
      id,
      nickname: `🤖봇${num}`,
      alive: true,
      currentChoice: null,
      eliminatedRound: null,
      joinedAt: Date.now(),
    });
  }

  function clearBots() {
    const updates: Record<string, unknown> = {};
    participants
      .filter((p) => p.id.startsWith("bot_"))
      .forEach((p) => {
        updates[`${RPS_ROOM_PATH}/participants/${p.id}`] = null;
      });
    if (Object.keys(updates).length === 0) return;
    update(ref(db), updates);
  }

  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => {
    setJoinUrl(`${window.location.origin}/games/rps/play`);
  }, []);

  async function copyJoinUrl() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />

        <div className={styles.heroTop}>
          <BackButton href="/games/rps" label="게임 정보로" />
          <span className={styles.role}>HOST</span>
        </div>

        <h1 className={styles.title}>가위바위보 토너먼트</h1>
        <p className={styles.sub}>
          참가자가 모이면 "게임 시작!"을 눌러 아레나로 들어가세요.
        </p>
      </section>

      {/* ============ JOIN LINK ============ */}
      <section className={styles.section}>
        <SectionLabel index="01" label="/ JOIN LINK" />
        <div className={styles.linkBox}>
          <div className={styles.linkLeft}>
            <span className={styles.linkLabel}>참가 링크</span>
            <span className={styles.linkValue}>{joinUrl || "..."}</span>
          </div>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={copyJoinUrl}
            disabled={!joinUrl}
          >
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
        </div>
        <p className={styles.linkHint}>
          참가자는 게임 페이지의 "참가하기" 버튼만 누르면 자동 입장해요.
        </p>
        {initError && (
          <div className={styles.errorBanner}>
            <strong>방 생성 실패:</strong> {initError}
            <br />
            <span className={styles.errorHint}>
              Firebase 보안 규칙에서 /rps 경로 쓰기가 허용되어 있는지 확인하세요.
            </span>
          </div>
        )}
      </section>

      {/* ============ PARTICIPANTS ============ */}
      <section className={styles.section}>
        <div className={styles.partHead}>
          <SectionLabel index="02" label="/ PARTICIPANTS" />
          <span className={styles.partCount}>{participants.length}명 입장</span>
        </div>

        {participants.length === 0 ? (
          <div className={styles.emptyState}>
            아직 아무도 들어오지 않았어요.<br />
            위의 참가 링크를 공유하세요.
          </div>
        ) : (
          <ul className={styles.partList}>
            <AnimatePresence>
              {participants.map((p) => (
                <motion.li
                  key={p.id}
                  className={styles.partItem}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <div className={styles.partTop}>
                    <span className={styles.partName}>{p.nickname}</span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {/* ============ START ============ */}
      <section className={styles.section}>
        <SectionLabel index="03" label="/ START" />
        <div className={styles.controls}>
          <Magnetic strength={0.3}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={startGame}
              disabled={participants.length === 0}
            >
              🎮 게임 시작! ({participants.length}명)
            </button>
          </Magnetic>
        </div>

        {/* Test bots */}
        <div className={styles.devTools}>
          <span className={styles.devLabel}>🛠 개발용</span>
          <button type="button" className={styles.devBtn} onClick={addBot}>
            🤖 봇 +1
          </button>
          <button
            type="button"
            className={styles.devBtn}
            onClick={clearBots}
            disabled={!participants.some((p) => p.id.startsWith("bot_"))}
          >
            봇 모두 제거
          </button>
        </div>
      </section>
    </div>
  );
}
