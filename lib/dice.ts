export type DiceThemeKey = "dawn" | "acting" | "calm" | "excite";

export type DiceHistoryEntry = {
  id: number;
  theme: DiceThemeKey;
  value: number;
  ts: number;
};

export type DiceRoom = {
  hostId: string | null;
  hostNickname: string;
  theme: DiceThemeKey;
  rollSeq: number;
  rolling: boolean;
  face: number;
  result: number | null;
  history: DiceHistoryEntry[];
  createdAt: number;
  updatedAt: number;
};

export const DICE_ROOM_PATH = "dice/main";

export const DICE_HISTORY_LIMIT = 30;

export function generateDiceClientId(): string {
  return Math.random().toString(36).substring(2, 12);
}

export function createInitialDiceRoom(
  hostId: string | null,
  theme: DiceThemeKey = "dawn",
): DiceRoom {
  const now = Date.now();
  return {
    hostId,
    hostNickname: "주최자",
    theme,
    rollSeq: 0,
    rolling: false,
    face: 1,
    result: null,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}
