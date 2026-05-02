"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { get, onDisconnect, onValue, ref, remove, set } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  generateClientId,
  RPS_ROOM_PATH,
  type RpsRoom,
} from "@/lib/rps";
import styles from "./page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

function suggestNickname() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `팬${num}`;
}

export default function RpsPlayPage() {
  const router = useRouter();
  const [room, setRoom] = useState<RpsRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [noRoom, setNoRoom] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [lateJoiner, setLateJoiner] = useState(false);

  // Nickname form state
  const [needsNickname, setNeedsNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const initOnce = useRef(false);

  // Initial check: existing identity OR ready to show nickname form
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    const existingId = sessionStorage.getItem("rps:participantId");
    const existingName = sessionStorage.getItem("rps:nickname");
    if (existingId && existingName) {
      setParticipantId(existingId);
      setNickname(existingName);
      sessionStorage.setItem("rps:isHost", "false");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const snap = await get(ref(db, RPS_ROOM_PATH));
        const value = snap.val() as RpsRoom | null;
        if (!value) {
          setNoRoom(true);
          setLoading(false);
          return;
        }
        if (value.status !== "waiting") {
          setLateJoiner(true);
          setLoading(false);
          return;
        }
        setNicknameInput(suggestNickname());
        setNeedsNickname(true);
        setLoading(false);
      } catch (err) {
        console.error("[rps play] init failed:", err);
        setJoinError("입장에 실패했어요. 새로고침 해주세요.");
        setLoading(false);
      }
    })();
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);

    const name = nicknameInput.trim();
    if (!name) {
      setJoinError("닉네임을 입력해주세요.");
      return;
    }
    if (name.length > 12) {
      setJoinError("닉네임은 12자 이하로 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const newId = generateClientId();
      await set(ref(db, `${RPS_ROOM_PATH}/participants/${newId}`), {
        id: newId,
        nickname: name,
        alive: true,
        currentChoice: null,
        eliminatedRound: null,
        joinedAt: Date.now(),
      });
      sessionStorage.setItem("rps:participantId", newId);
      sessionStorage.setItem("rps:nickname", name);
      sessionStorage.setItem("rps:isHost", "false");
      setParticipantId(newId);
      setNickname(name);
      setNeedsNickname(false);
    } catch (err) {
      console.error(err);
      setJoinError("입장에 실패했어요. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  // Subscribe to room
  useEffect(() => {
    const unsub = onValue(ref(db, RPS_ROOM_PATH), (snap) => {
      setRoom(snap.val());
    });
    return () => unsub();
  }, []);

  // Auto-remove participant from Firebase when browser disconnects
  useEffect(() => {
    if (!participantId) return;
    const partRef = ref(db, `${RPS_ROOM_PATH}/participants/${participantId}`);
    onDisconnect(partRef).remove();
  }, [participantId]);

  // Auto-redirect to arena when game starts
  useEffect(() => {
    if (!room || !participantId) return;
    if (room.status !== "waiting") {
      router.replace("/games/rps/arena");
    }
  }, [room, participantId, router]);

  /** 나가기: 입장한 상태였으면 Firebase에서 자기 자신 제거 후 이동 */
  async function handleExit() {
    try {
      if (participantId) {
        const partRef = ref(
          db,
          `${RPS_ROOM_PATH}/participants/${participantId}`,
        );
        await onDisconnect(partRef).cancel();
        await remove(partRef);
        sessionStorage.removeItem("rps:participantId");
        sessionStorage.removeItem("rps:nickname");
      }
    } catch (err) {
      console.error("[rps play] exit failed:", err);
    } finally {
      router.push("/games/rps");
    }
  }

  const allParticipants = useMemo(() => {
    if (!room?.participants) return [];
    return Object.values(room.participants);
  }, [room]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.loader}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (joinError && !needsNickname) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.errorBox}>
            <h1 className={styles.errorTitle}>문제가 생겼어요</h1>
            <p className={styles.errorText}>{joinError}</p>
            <Link href="/games/rps" className={styles.backBtn}>
              돌아가기 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (noRoom) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.errorBox}>
            <h1 className={styles.errorTitle}>지금은 열려있는 방이 없어요</h1>
            <p className={styles.errorText}>
              호스트가 게임을 시작해야 입장할 수 있어요.
            </p>
            <Link href="/games/rps" className={styles.backBtn}>
              돌아가기 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lateJoiner) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.errorBox}>
            <h1 className={styles.errorTitle}>게임이 진행 중이에요</h1>
            <p className={styles.errorText}>
              지금 라운드가 진행 중이라 입장할 수 없어요.<br />
              다음 게임을 기다려주세요.
            </p>
            <Link href="/games/rps" className={styles.backBtn}>
              돌아가기 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ NICKNAME FORM ============
  if (needsNickname) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={handleExit}
            className={styles.exitBtn}
            aria-label="나가기"
          >
            <span aria-hidden>←</span>
            <span>나가기</span>
          </button>
        </div>
        <div className={styles.center}>
          <motion.form
            className={styles.joinForm}
            onSubmit={handleJoin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className={styles.joinEmoji}>🎮</div>
            <h1 className={styles.joinTitle}>닉네임을 입력하세요</h1>
            <p className={styles.joinHint}>
              화면에 표시되는 이름이에요. 다른 사람들이 보게 돼요.
            </p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>닉네임</span>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) =>
                  setNicknameInput(e.target.value.slice(0, 12))
                }
                placeholder="화면에 표시될 이름"
                className={styles.input}
                autoComplete="off"
                autoFocus
                maxLength={12}
              />
              <span className={styles.fieldMeta}>
                {nicknameInput.length}/12
              </span>
            </label>

            {joinError && (
              <div className={styles.errorBanner}>{joinError}</div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? "입장 중..." : "입장하기 →"}
            </button>

            <button
              type="button"
              className={styles.suggestBtn}
              onClick={() => setNicknameInput(suggestNickname())}
              disabled={submitting}
            >
              🎲 다른 닉네임 추천
            </button>
          </motion.form>
        </div>
      </div>
    );
  }

  // ============ WAITING (after join) ============
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button
          type="button"
          onClick={handleExit}
          className={styles.exitBtn}
          aria-label="나가기"
        >
          <span aria-hidden>←</span>
          <span>나가기</span>
        </button>
        <span className={styles.nickBadge}>{nickname ?? "..."}</span>
      </div>

      <div className={styles.center}>
        <motion.div
          className={styles.stateBox}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className={styles.bigEmoji}>⏳</div>
          <h1 className={styles.stateTitle}>입장 완료!</h1>
          <p className={styles.stateText}>
            주최자가 게임을 시작하면<br />
            아레나로 자동 이동해요.
          </p>
          <div className={styles.othersRow}>
            <span className={styles.othersLabel}>현재 입장자</span>
            <span className={styles.othersValue}>
              {allParticipants.length}명
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
