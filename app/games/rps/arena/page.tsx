"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onDisconnect, onValue, ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  CHOICES,
  CHOICE_EMOJI,
  CHOICE_LABEL,
  REVEAL_COUNTDOWN,
  resolveHostVsAll,
  RPS_ROOM_PATH,
  type Choice,
  type Participant,
  type RpsRoom,
} from "@/lib/rps";
import BackButton from "@/components/BackButton";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function ArenaPage() {
  const router = useRouter();
  const [room, setRoom] = useState<RpsRoom | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  // Tracking time as null until client-side mount avoids hydration mismatch
  const [now, setNow] = useState<number | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect role from sessionStorage (client only)
  useEffect(() => {
    const hostFlag = sessionStorage.getItem("rps:isHost") === "true";
    if (hostFlag) {
      setIsHost(true);
      return;
    }
    const id = sessionStorage.getItem("rps:participantId");
    if (id) {
      setIsHost(false);
      setParticipantId(id);
    } else {
      router.push("/games/rps");
    }
  }, [router]);

  // Subscribe to room
  useEffect(() => {
    const unsub = onValue(ref(db, RPS_ROOM_PATH), (snap) => {
      setRoom(snap.val());
    });
    return () => unsub();
  }, []);

  // Auto-remove participant from Firebase when browser disconnects (participant only)
  useEffect(() => {
    if (!participantId || isHost) return;
    const partRef = ref(db, `${RPS_ROOM_PATH}/participants/${participantId}`);
    onDisconnect(partRef).remove();
  }, [participantId, isHost]);

  // Tick clock for countdown — initialize on client only.
  // 1초 단위 표시이므로 250ms면 충분 (불필요한 리렌더 ↓).
  // revealing 상태가 아닐 땐 굳이 매 프레임 갱신할 필요 없음 → 인터벌 자체를 멈춤.
  useEffect(() => {
    if (room?.status !== "revealing") {
      setNow(Date.now());
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [room?.status]);

  // If room returns to "waiting", redirect to lobby
  useEffect(() => {
    if (!room || isHost === null) return;
    if (room.status === "waiting") {
      router.replace(isHost ? "/games/rps/host" : "/games/rps/play");
    }
  }, [room?.status, isHost, router]);

  const allParticipants = useMemo<Participant[]>(() => {
    if (!room?.participants) return [];
    return Object.values(room.participants).sort(
      (a, b) => a.joinedAt - b.joinedAt
    );
  }, [room]);

  const aliveParticipants = useMemo(
    () => allParticipants.filter((p) => p.alive),
    [allParticipants]
  );

  const me = useMemo<Participant | null>(() => {
    if (!participantId || !room?.participants) return null;
    return room.participants[participantId] ?? null;
  }, [room, participantId]);

  const myChoice: Choice | null = isHost
    ? room?.hostChoice ?? null
    : me?.currentChoice ?? null;

  const allReady = useMemo(() => {
    if (!room?.hostChoice) return false;
    if (aliveParticipants.length === 0) return false;
    return aliveParticipants.every((p) => p.currentChoice !== null);
  }, [room?.hostChoice, aliveParticipants]);

  const remainingSeconds = useMemo(() => {
    if (!room?.countdownEndsAt || now === null) return null;
    const sec = Math.ceil((room.countdownEndsAt - now) / 1000);
    return sec > 0 ? sec : 0;
  }, [room?.countdownEndsAt, now]);

  // Bot auto-pick (host only)
  useEffect(() => {
    if (!isHost || room?.status !== "selecting") return;
    const bots = aliveParticipants.filter(
      (p) => p.id.startsWith("bot_") && !p.currentChoice
    );
    if (bots.length === 0) return;
    const timers = bots.map((b) => {
      const delay = 800 + Math.random() * 3500;
      return setTimeout(() => {
        const choice = CHOICES[Math.floor(Math.random() * 3)];
        update(ref(db, `${RPS_ROOM_PATH}/participants/${b.id}`), {
          currentChoice: choice,
        });
      }, delay);
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, [isHost, room?.status, aliveParticipants]);

  // Auto-apply reveal when countdown ends (host only)
  useEffect(() => {
    if (!isHost || room?.status !== "revealing" || !room.hostChoice) return;
    const remain = (room.countdownEndsAt ?? 0) - Date.now();
    if (remain <= 0) {
      applyReveal();
      return;
    }
    revealTimerRef.current = setTimeout(applyReveal, remain + 80);
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, room?.status, room?.countdownEndsAt]);

  // ============ ACTIONS ============

  function pick(choice: Choice) {
    if (!room || room.status !== "selecting") return;
    if (isHost) {
      if (room.hostChoice) return;
      update(ref(db, RPS_ROOM_PATH), { hostChoice: choice });
    } else {
      if (!participantId || !me?.alive || me.currentChoice) return;
      update(ref(db, `${RPS_ROOM_PATH}/participants/${participantId}`), {
        currentChoice: choice,
      });
    }
  }

  function startReveal() {
    if (!isHost || !room || room.status !== "selecting" || !allReady) return;
    update(ref(db, RPS_ROOM_PATH), {
      status: "revealing",
      countdownEndsAt: Date.now() + REVEAL_COUNTDOWN * 1000,
    });
  }

  function applyReveal() {
    if (!isHost || !room) return;
    if (room.status !== "revealing" || !room.hostChoice) return;
    const result = resolveHostVsAll(room.hostChoice, aliveParticipants);

    const updates: Record<string, unknown> = {
      [`${RPS_ROOM_PATH}/status`]: "revealed",
      [`${RPS_ROOM_PATH}/countdownEndsAt`]: null,
      [`${RPS_ROOM_PATH}/lastResult`]: {
        round: room.currentRound,
        hostChoice: room.hostChoice,
        isAllEliminated: result.isAllEliminated,
        eliminated: result.eliminated,
        survivors: result.survivors,
      },
    };

    if (!result.isAllEliminated) {
      result.eliminated.forEach((id) => {
        updates[`${RPS_ROOM_PATH}/participants/${id}/alive`] = false;
        updates[`${RPS_ROOM_PATH}/participants/${id}/eliminatedRound`] =
          room.currentRound;
      });
      if (result.survivors.length === 1) {
        updates[`${RPS_ROOM_PATH}/status`] = "finished";
        updates[`${RPS_ROOM_PATH}/winner`] = result.survivors[0];
      }
    }
    update(ref(db), updates);
  }

  function nextRound() {
    if (!isHost || !room) return;
    const updates: Record<string, unknown> = {
      [`${RPS_ROOM_PATH}/status`]: "selecting",
      [`${RPS_ROOM_PATH}/currentRound`]: (room.currentRound ?? 0) + 1,
      [`${RPS_ROOM_PATH}/hostChoice`]: null,
      [`${RPS_ROOM_PATH}/countdownEndsAt`]: null,
      [`${RPS_ROOM_PATH}/lastResult`]: null,
    };
    aliveParticipants.forEach((p) => {
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/currentChoice`] = null;
    });
    update(ref(db), updates);
  }

  function endGame() {
    if (!isHost || !room) return;
    const updates: Record<string, unknown> = {
      [`${RPS_ROOM_PATH}/status`]: "waiting",
      [`${RPS_ROOM_PATH}/currentRound`]: 0,
      [`${RPS_ROOM_PATH}/hostChoice`]: null,
      [`${RPS_ROOM_PATH}/countdownEndsAt`]: null,
      [`${RPS_ROOM_PATH}/lastResult`]: null,
      [`${RPS_ROOM_PATH}/winner`]: null,
    };
    Object.values(room.participants ?? {}).forEach((p) => {
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/alive`] = true;
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/currentChoice`] = null;
      updates[`${RPS_ROOM_PATH}/participants/${p.id}/eliminatedRound`] = null;
    });
    update(ref(db), updates);
  }

  // ============ RENDER ============

  if (!room || isHost === null) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.loader}>아레나 입장 중...</div>
        </div>
      </div>
    );
  }

  const status = room.status;
  const isWinner = status === "finished" && room.winner === participantId;
  const isMeEliminated = !isHost && me ? !me.alive : false;
  const winnerParticipant = room.winner
    ? room.participants?.[room.winner]
    : null;
  const showFaceUp = status === "revealed" || status === "finished";
  const otherParticipants = isHost
    ? allParticipants
    : allParticipants.filter((p) => p.id !== participantId);

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <BackButton
          href={isHost ? "/games/rps/host" : "/games/rps/play"}
          label="나가기"
        />
        <div className={styles.topInfo}>
          <span className={styles.roundBadge}>
            ROUND {room.currentRound || 1}
          </span>
          <span className={styles.statusBadge}>{statusLabel(status)}</span>
          <span className={styles.aliveBadge}>
            생존 {aliveParticipants.length}
          </span>
        </div>
      </div>

      {/* HOST SEAT (top center) */}
      <div className={styles.hostSeat}>
        <PlayerCard
          name={room.hostNickname}
          isHost
          isMe={!!isHost}
          alive
          choice={room.hostChoice ?? null}
          showFaceUp={showFaceUp || !!isHost} // host always sees own pick
          picked={!!room.hostChoice}
          eliminated={false}
          isWinner={false}
          big
        />
      </div>

      {/* CENTER STAGE */}
      <div className={styles.center}>
        <AnimatePresence mode="wait">
          {status === "selecting" && (
            <motion.div
              key="sel"
              className={styles.stageMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className={styles.stageHint}>
                {isHost
                  ? room.hostChoice
                    ? `참가자들 기다리는 중 (${
                        aliveParticipants.filter((p) => p.currentChoice).length
                      }/${aliveParticipants.length})`
                    : "내 패를 골라주세요 ↓"
                  : myChoice
                  ? `${CHOICE_LABEL[myChoice]} 선택 완료. 다른 사람들 기다리는 중...`
                  : "패를 골라주세요 ↓"}
              </p>
            </motion.div>
          )}

          {status === "revealing" && (
            <motion.div
              key="rev"
              className={styles.countdownStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className={styles.countdownLabel}>패 공개까지</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={remainingSeconds ?? REVEAL_COUNTDOWN}
                  className={styles.countdownNumber}
                  initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                >
                  {(remainingSeconds ?? REVEAL_COUNTDOWN) === 0
                    ? "GO!"
                    : remainingSeconds ?? REVEAL_COUNTDOWN}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {status === "revealed" && room.lastResult && (() => {
            const eliminated = room.lastResult.eliminated ?? [];
            const survivors = room.lastResult.survivors ?? [];
            return (
              <motion.div
                key="rsd"
                className={styles.resultBanner}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.5 }}
              >
                {room.lastResult.isAllEliminated ? (
                  <span className={styles.resultBadgePink}>
                    전원 탈락! 같은 라운드 다시
                  </span>
                ) : eliminated.length === 0 ? (
                  <span className={styles.resultBadgePink}>
                    탈락자 없음 — 모두 생존
                  </span>
                ) : (
                  <span className={styles.resultBadge}>
                    {eliminated.length}명 탈락 · {survivors.length}명 생존
                  </span>
                )}
              </motion.div>
            );
          })()}

          {status === "finished" && (
            <motion.div
              key="fin"
              className={styles.winnerStage}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
            >
              <motion.div
                className={styles.winnerCrown}
                initial={{ scale: 0.4, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease }}
              >
                👑
              </motion.div>
              <div className={styles.winnerLabel}>WINNER</div>
              <div className={styles.winnerName}>
                {winnerParticipant?.nickname ?? "—"}
              </div>
              <div className={styles.winnerSub}>
                {isWinner
                  ? "🎉 축하해요! 끝까지 살아남았어요"
                  : `총 ${room.currentRound}라운드 · 주최자: ${room.hostNickname}`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OTHER PLAYERS ROW */}
      {otherParticipants.length > 0 && (
        <div className={styles.playersRow}>
          {otherParticipants.map((p, i) => {
            const wasEliminatedThisRound =
              room.lastResult?.eliminated?.includes(p.id) ?? false;
            const isSurvivorThisRound =
              room.lastResult?.survivors?.includes(p.id) ?? false;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <PlayerCard
                  name={p.nickname}
                  isHost={false}
                  isMe={p.id === participantId}
                  alive={p.alive}
                  choice={p.currentChoice}
                  showFaceUp={showFaceUp}
                  picked={!!p.currentChoice}
                  eliminated={!p.alive}
                  justEliminated={wasEliminatedThisRound}
                  justSurvived={isSurvivorThisRound}
                  isWinner={status === "finished" && room.winner === p.id}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MY HAND */}
      {!isMeEliminated && status === "selecting" && (
        <div className={styles.myHand}>
          <div className={styles.myHandLabel}>내 손패</div>
          <div className={styles.cards}>
            {CHOICES.map((c, i) => {
              const selected = myChoice === c;
              const dim = myChoice !== null && !selected;
              return (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => pick(c)}
                  disabled={!!myChoice}
                  className={`${styles.handCard} ${
                    selected ? styles.handCardSelected : ""
                  } ${dim ? styles.handCardDim : ""}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                  whileHover={!myChoice ? { y: -10, scale: 1.04 } : {}}
                  whileTap={!myChoice ? { scale: 0.94 } : {}}
                >
                  <span className={styles.handCardEmoji}>
                    {CHOICE_EMOJI[c]}
                  </span>
                  <span className={styles.handCardLabel}>
                    {CHOICE_LABEL[c]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* HOST CONTROLS */}
      {isHost && (
        <div className={styles.controls}>
          {status === "selecting" && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={startReveal}
              disabled={!allReady}
            >
              {!room.hostChoice
                ? "내 패부터 골라주세요"
                : !allReady
                ? `대기 중 (${
                    aliveParticipants.filter((p) => p.currentChoice).length
                  }/${aliveParticipants.length})`
                : "패 오픈 →"}
            </button>
          )}
          {status === "revealed" && room.lastResult && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={nextRound}
            >
              {room.lastResult.isAllEliminated
                ? "다시 진행"
                : "다음 라운드 →"}
            </button>
          )}
          {status === "finished" && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={endGame}
            >
              새 게임
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============ COMPONENTS ============

function statusLabel(s: RpsRoom["status"]) {
  switch (s) {
    case "waiting":
      return "대기";
    case "selecting":
      return "선택 중";
    case "revealing":
      return "공개 중";
    case "revealed":
      return "결과";
    case "finished":
      return "게임 종료";
    default:
      return "";
  }
}

type PlayerCardProps = {
  name: string;
  isHost: boolean;
  isMe: boolean;
  alive: boolean;
  choice: Choice | null;
  showFaceUp: boolean;
  picked: boolean;
  eliminated: boolean;
  justEliminated?: boolean;
  justSurvived?: boolean;
  isWinner: boolean;
  big?: boolean;
};

function PlayerCard({
  name,
  isHost,
  isMe,
  alive,
  choice,
  showFaceUp,
  picked,
  eliminated,
  justEliminated,
  justSurvived,
  isWinner,
  big,
}: PlayerCardProps) {
  const showCard = picked || (showFaceUp && choice);
  const cardFaceUp = showFaceUp && !!choice;

  return (
    <div
      className={`${styles.seat} ${big ? styles.seatBig : ""} ${
        isMe ? styles.seatMe : ""
      } ${isHost ? styles.seatHost : ""} ${eliminated ? styles.seatKO : ""} ${
        justEliminated ? styles.seatJustKO : ""
      } ${justSurvived ? styles.seatJustSurvive : ""} ${
        isWinner ? styles.seatWinner : ""
      }`}
    >
      <div className={styles.seatHead}>
        <span className={styles.seatBadge}>
          {isHost ? "👑" : eliminated ? "💔" : "🎮"}
        </span>
        <span className={styles.seatName}>
          {name}
          {isMe && <span className={styles.meDot}> · 나</span>}
        </span>
      </div>

      <div className={styles.seatCardSlot}>
        {!showCard ? (
          <div className={`${styles.miniCard} ${styles.miniCardEmpty}`}>
            <span className={styles.miniCardSlash}>—</span>
          </div>
        ) : (
          <div className={styles.flipWrap}>
            <motion.div
              className={styles.flipInner}
              initial={false}
              animate={{ rotateY: cardFaceUp ? 0 : 180 }}
              transition={{ duration: 0.7, ease }}
            >
              <div className={`${styles.miniCard} ${styles.miniCardFront}`}>
                <span className={styles.miniCardEmoji}>
                  {choice ? CHOICE_EMOJI[choice] : ""}
                </span>
              </div>
              <div className={`${styles.miniCard} ${styles.miniCardBack}`}>
                <span className={styles.miniCardBackMark}>?</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className={styles.seatStatus}>
        {eliminated
          ? "KO"
          : justSurvived
          ? "✓ 생존"
          : justEliminated
          ? "✗ 탈락"
          : picked
          ? "준비"
          : "선택 중"}
      </div>
    </div>
  );
}
