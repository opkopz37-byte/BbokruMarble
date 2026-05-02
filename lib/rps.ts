export type Choice = "rock" | "paper" | "scissors";

export type Participant = {
  id: string;
  nickname: string;
  alive: boolean;
  currentChoice: Choice | null;
  eliminatedRound: number | null;
  joinedAt: number;
};

export type RoundResult = {
  round: number;
  hostChoice: Choice;
  isAllEliminated: boolean;
  eliminated: string[];
  survivors: string[];
};

/**
 * Game statuses:
 * - waiting:   lobby phase, before any round, host gathering participants
 * - selecting: round in progress, host + alive participants picking cards
 * - revealing: 3-2-1 countdown after host clicks "패 오픈"
 * - revealed:  result shown, host decides next action
 * - finished:  one survivor remains, winner declared
 */
export type RpsRoom = {
  status: "waiting" | "selecting" | "revealing" | "revealed" | "finished";
  hostId: string;
  hostNickname: string;
  hostChoice: Choice | null;
  createdAt: number;
  currentRound: number;
  /** Unix ms when current countdown ends (used in revealing) */
  countdownEndsAt?: number | null;
  /** Result of most recently revealed round */
  lastResult?: RoundResult | null;
  /** Winner participant id when status==="finished" */
  winner?: string | null;
  participants?: { [id: string]: Participant };
};

/** Single shared room path for the entire app (no codes, one game at a time) */
export const RPS_ROOM_PATH = "rps/main";

/** Reveal countdown seconds (3-2-1) */
export const REVEAL_COUNTDOWN = 3;

export const CHOICES: Choice[] = ["rock", "paper", "scissors"];

export const CHOICE_EMOJI: Record<Choice, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

export const CHOICE_LABEL: Record<Choice, string> = {
  rock: "바위",
  paper: "보",
  scissors: "가위",
};

/**
 * 가위바위보 승부 규칙 (key가 value를 이김):
 *   rock(바위)     이김  scissors(가위)
 *   scissors(가위) 이김  paper(보)
 *   paper(보)      이김  rock(바위)
 */
const BEATS: Record<Choice, Choice> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

/** 두 패의 결과를 평가. left가 right를 이기면 "win", 지면 "lose", 같으면 "draw". */
export function compareChoices(
  left: Choice,
  right: Choice,
): "win" | "lose" | "draw" {
  if (left === right) return "draw";
  return BEATS[left] === right ? "win" : "lose";
}

export function generateClientId(): string {
  return Math.random().toString(36).substring(2, 12);
}

/**
 * Host vs All resolution.
 *
 * 각 참가자를 호스트의 패와 1:1로 비교:
 * - 같은 패(무승부)         → 살아남음
 * - 호스트의 패를 이김       → 살아남음
 * - 호스트의 패에 짐         → 탈락
 * - 패를 안 골랐음(미선택)   → 탈락
 *
 * 살아있는 참가자가 있는데 전원 탈락 → isAllEliminated=true
 * (탈락 적용하지 말고 같은 라운드 다시 진행)
 */
export function resolveHostVsAll(
  hostChoice: Choice,
  alive: Participant[],
): { eliminated: string[]; survivors: string[]; isAllEliminated: boolean } {
  const eliminated: string[] = [];
  const survivors: string[] = [];

  alive.forEach((p) => {
    if (!p.currentChoice) {
      eliminated.push(p.id);
      return;
    }
    // 참가자 입장에서 호스트와 비교: win/draw 면 살아남음, lose 면 탈락
    const result = compareChoices(p.currentChoice, hostChoice);
    if (result === "lose") {
      eliminated.push(p.id);
    } else {
      survivors.push(p.id);
    }
  });

  const isAllEliminated = alive.length > 0 && survivors.length === 0;
  return { eliminated, survivors, isAllEliminated };
}
