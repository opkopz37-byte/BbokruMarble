export type Game = {
  slug: string;
  title: string;
  sub: string;
  badge: string;
  badgeTone: "primary" | "pink";
  category: "BOARDGAME" | "TOURNAMENT";
  accent: string;
  available: boolean;
  playHref: string;
  /** Optional secondary entry (e.g. "join as participant") */
  joinHref?: string;
  /** Override label of primary play button */
  playLabel?: string;
  /** Label of join button (when joinHref is set) */
  joinLabel?: string;
  description: string;
  longDescription: string[];
  features: string[];
  howTo: { n: string; title: string; text: string }[];
  meta: { players: string; duration: string; difficulty: string };
};

export const games: Game[] = [
  {
    slug: "boardgame",
    title: "뽁루마블",
    sub: "주사위와 말로 즐기는 클래식 보드게임",
    badge: "AVAILABLE",
    badgeTone: "primary",
    category: "BOARDGAME",
    accent: "🎲",
    available: true,
    playHref: "/boardgame/index.html",
    description:
      "호스트가 게임을 운영하고, 참가자들은 실시간으로 같은 화면을 공유하며 함께 즐기는 보드게임이에요.",
    longDescription: [
      "호스트가 뽀그방을 열고 비밀번호로 보호하면, 친구들이 들어와 같은 보드를 함께 봅니다. 호스트는 말을 옮기고 주사위를 굴리며, 참가자들은 그 모든 진행을 실시간으로 봅니다.",
      "최대 30개의 말을 만들 수 있고, 각 말마다 원하는 이미지를 올릴 수 있어 정말 우리만의 보드게임을 만들 수 있어요.",
    ],
    features: [
      "호스트/참가자 분리",
      "최대 30명 말 생성",
      "실시간 동기화",
      "커스텀 말 이미지",
      "비밀번호 보호",
      "다양한 주사위 타입",
    ],
    howTo: [
      {
        n: "01",
        title: "뽀그방에 입장",
        text: "호스트가 비밀번호로 방을 열어두면, 참가자들이 입장할 수 있어요.",
      },
      {
        n: "02",
        title: "말 꾸미기",
        text: "원하는 만큼 말을 만들고, 각 말에 이미지를 올려서 꾸며줍니다.",
      },
      {
        n: "03",
        title: "보드에 배치",
        text: "말 목록에서 보드 위로 드래그해서 시작 위치에 놓아요.",
      },
      {
        n: "04",
        title: "주사위 굴리기",
        text: "원하는 주사위를 선택하고 굴립니다. 나온 숫자만큼 말을 이동시켜요.",
      },
      {
        n: "05",
        title: "함께 즐기기",
        text: "참가자들도 같은 화면을 보고 있으니, 모두가 같이 응원하며 게임을 진행합니다.",
      },
    ],
    meta: {
      players: "2 - 30명",
      duration: "20 - 60분",
      difficulty: "쉬움",
    },
  },
  {
    slug: "dice",
    title: "주사위 굴리기",
    sub: "4가지 테마 × 6면 × 무한대로",
    badge: "NEW",
    badgeTone: "primary",
    category: "BOARDGAME",
    accent: "🎲",
    available: true,
    playHref: "/games/dice/play",
    playLabel: "주사위 굴리러 가기",
    description:
      "원하는 분위기의 주사위를 골라 굴려보세요. 새벽, 연기, 차분, 촐싹 — 4가지 테마 주사위를 한 페이지에서 모두 즐길 수 있어요.",
    longDescription: [
      "각 테마마다 고유한 음성과 색상이 담긴 주사위. 굴릴 때마다 1~6 중 한 면이 나오고, 결과 숫자에 맞춰 테마 음성이 흘러나옵니다.",
      "굴린 결과는 히스토리에 차곡차곡 쌓이고, 합계를 한눈에 볼 수 있어요. 키보드 스페이스바로도 굴릴 수 있습니다.",
    ],
    features: [
      "4가지 테마 주사위",
      "1~6 면 음성 출력",
      "결과 히스토리",
      "통계 요약",
      "키보드 단축키",
      "3D 회전 애니메이션",
    ],
    howTo: [
      {
        n: "01",
        title: "테마 고르기",
        text: "새벽 / 연기 / 차분 / 촐싹 — 4가지 분위기 중 마음에 드는 주사위를 선택합니다.",
      },
      {
        n: "02",
        title: "굴리기 버튼 클릭",
        text: "버튼을 누르거나 스페이스바를 눌러 주사위를 굴려요.",
      },
      {
        n: "03",
        title: "결과 확인",
        text: "1~6 중 한 면이 나오고, 숫자에 맞는 테마 음성이 재생됩니다.",
      },
      {
        n: "04",
        title: "히스토리 보기",
        text: "굴린 모든 결과가 기록되고, 합계를 함께 확인할 수 있어요.",
      },
    ],
    meta: {
      players: "1명+",
      duration: "자유",
      difficulty: "쉬움",
    },
  },
  {
    slug: "rps",
    title: "가위바위보 토너먼트",
    sub: "1대 다수, 한 명이 남을 때까지",
    badge: "AVAILABLE",
    badgeTone: "pink",
    category: "TOURNAMENT",
    accent: "✊",
    available: true,
    playHref: "/games/rps/host",
    playLabel: "방 만들기",
    joinHref: "/games/rps/play",
    joinLabel: "참가하기",
    description:
      "다수의 참가자가 동시에 가위·바위·보를 선택해서, 마지막 한 명이 남을 때까지 진행되는 배틀로얄 형식의 토너먼트.",
    longDescription: [
      "호스트가 방을 열면 참가자들이 닉네임으로 입장합니다. 호스트가 시작 버튼을 누르면 첫 라운드가 시작돼요.",
      "각 라운드마다 참가자들은 가위/바위/보 중 하나를 선택하고, 카운트다운이 끝나면 모두의 패가 동시에 공개됩니다. 진 사람들은 탈락하고, 남은 사람들이 다음 라운드로 진출해요.",
      "마지막 한 명이 남을 때까지 라운드는 계속됩니다.",
    ],
    features: [
      "호스트 수동 시작",
      "라운드제 토너먼트",
      "동시 공개 시스템",
      "자동 탈락 규칙",
      "닉네임 입장",
      "실시간 결과 발표",
    ],
    howTo: [
      {
        n: "01",
        title: "방 만들기",
        text: "호스트가 방을 열고 참가자들의 입장을 기다립니다.",
      },
      {
        n: "02",
        title: "닉네임으로 입장",
        text: "참가자들은 자신을 식별할 닉네임으로 방에 입장합니다.",
      },
      {
        n: "03",
        title: "호스트가 시작",
        text: "호스트가 시작 버튼을 누르면 첫 라운드가 열려요.",
      },
      {
        n: "04",
        title: "패 선택 → 동시 공개",
        text: "각자 가위/바위/보를 선택하고, 카운트다운 후 모두의 패가 동시에 공개됩니다.",
      },
      {
        n: "05",
        title: "한 명이 남을 때까지",
        text: "진 사람은 탈락. 남은 사람들끼리 다음 라운드. 끝까지 살아남는 한 명이 우승!",
      },
    ],
    meta: {
      players: "3 - 100명",
      duration: "5 - 15분",
      difficulty: "쉬움",
    },
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
