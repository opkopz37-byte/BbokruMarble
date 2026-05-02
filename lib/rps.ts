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

const BEATS: Record<Choice, Choice> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

export function generateClientId(): string {
  return Math.random().toString(36).substring(2, 12);
}

/**
 * Host vs All resolution.
 * - Each participant compared to hostChoice independently.
 * - Draw with host (same choice) → survive
 * - Beats host → survive
 * - Loses to host → eliminated
 * - Didn't pick → eliminated (counts as loss)
 *
 * If alive participants > 0 but ALL would be eliminated this round → isAllEliminated=true
 * (round should be retried, no actual eliminations applied).
 */
export function resolveHostVsAll(
  hostChoice: Choice,
  alive: Participant[]
): { eliminated: string[]; survivors: string[]; isAllEliminated: boolean } {
  const eliminated: string[] = [];
  const survivors: string[] = [];

  alive.forEach((p) => {
    if (!p.currentChoice) {
      eliminated.push(p.id);
      return;
    }
    if (p.currentChoice === hostChoice) {
      survivors.push(p.id); // draw
      return;
    }
    if (BEATS[p.currentChoice] === hostChoice) {
      survivors.push(p.id); // beats host
    } else {
      eliminated.push(p.id); // loses to host
    }
  });

  const isAllEliminated = alive.length > 0 && survivors.length === 0;
  return { eliminated, survivors, isAllEliminated };
}
