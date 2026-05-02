"use client";

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

      {initError && (
        <section className={styles.section}>
          <div className={styles.errorBanner}>
            <strong>방 생성 실패:</strong> {initError}
            <br />
            <span className={styles.errorHint}>
              Firebase 보안 규칙에서 /rps 경로 쓰기가 허용되어 있는지 확인하세요.
            </span>
          </div>
        </section>
      )}

      {/* ============ PARTICIPANTS ============ */}
      <section className={styles.section}>
        <div className={styles.partHead}>
          <SectionLabel index="01" label="/ PARTICIPANTS" />
          <span className={styles.partCount}>{participants.length}명 입장</span>
        </div>

        {participants.length === 0 ? (
          <div className={styles.emptyState}>
            아직 아무도 들어오지 않았어요.<br />
            참가자에게 게임 페이지의 "참가하기" 버튼을 눌러달라고 알려주세요.
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
        <SectionLabel index="02" label="/ START" />
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
      </section>
    </div>
  );
}
