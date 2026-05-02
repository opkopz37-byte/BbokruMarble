/* ============================================
   🔥 Firebase 초기화
   ============================================ */
let database = null;
let gameStateRef = null;
let assetsRef = null;

try {
    firebase.initializeApp(FIREBASE_CONFIG);
    database = firebase.database();
    gameStateRef = database.ref('game/state');
    assetsRef = database.ref('game/assets');
    console.log('✅ Firebase 초기화 완료 (관람 모드)');
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
}

/* ============================================
   🎮 로컬 상태 관리
   ============================================ */
let localState = {
    leftPanelHidden: false,
    rightPanelHidden: false
};

const boardEl = document.getElementById('gameBoard');

const diceThemeNames = {
    dawn: '새벽 주사위 💗',
    acting: '연기 주사위 💜',
    calm: '차분 주사위 💙',
    excite: '촐싹 주사위 🧡'
};

/* ============================================
   🎲 주사위 테마별 소리 설정
   ============================================ */
const diceThemes = {
    dawn: {
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/a1_융망_새벽.mp3',
            2: 'sounds/a2_딸기_새벽.mp3',
            3: 'sounds/a3_아희_새벽.mp3',
            4: 'sounds/a4_잔디_새벽.mp3',
            5: 'sounds/a5_연우_새벽.mp3',
            6: 'sounds/a6_밍이_새벽.mp3'
        }
    },
    acting: {
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/b1_나찌_연기.mp3',
            2: 'sounds/b2_밍이_연기.mp3',
            3: 'sounds/b3_대니_연기.mp3',
            4: 'sounds/b4_뽀름_연기.mp3',
            5: 'sounds/b5_카즈_연기.mp3',
            6: 'sounds/b6_두식이_연기.mp3'
        }
    },
    calm: {
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/c1_키키_차분.mp3',
            2: 'sounds/c2_꽃순이_차분.mp3',
            3: 'sounds/c3_와이비_차분.mp3',
            4: 'sounds/c4_윤정_차분.mp3',
            5: 'sounds/c5_밍이_차분.mp3',
            6: 'sounds/c6_로젬_차분.mp3'
        }
    },
    excite: {
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/d1_똥깽_촐싹.mp3',
            2: 'sounds/d2_밍이_촐싹.mp3',
            3: 'sounds/d3_뽀끼리_촐싹.mp3',
            4: 'sounds/d4_고도리_촐싹.mp3',
            5: 'sounds/d5_밍이_촐싹.mp3',
            6: 'sounds/d6_꽃순이_촐싹.mp3'
        }
    }
};

let currentTheme = 'dawn'; // 현재 주사위 테마
let lastDiceRoll = null; // 이전 주사위 결과 (중복 재생 방지)

/* ============================================
   🎯 패널 토글 기능
   ============================================ */
function toggleLeftPanel() {
    localState.leftPanelHidden = !localState.leftPanelHidden;
    updatePanelVisibility();
}

function toggleRightPanel() {
    localState.rightPanelHidden = !localState.rightPanelHidden;
    updatePanelVisibility();
}

function updatePanelVisibility() {
    const layout = document.getElementById('gameLayout');
    const leftIcon = document.getElementById('leftToggleIcon');
    const rightIcon = document.getElementById('rightToggleIcon');

    layout.classList.remove('left-hidden', 'right-hidden', 'both-hidden');

    if (localState.leftPanelHidden && localState.rightPanelHidden) {
        layout.classList.add('both-hidden');
        leftIcon.textContent = '▶';
        rightIcon.textContent = '◀';
    } else if (localState.leftPanelHidden) {
        layout.classList.add('left-hidden');
        leftIcon.textContent = '▶';
        rightIcon.textContent = '▶';
    } else if (localState.rightPanelHidden) {
        layout.classList.add('right-hidden');
        leftIcon.textContent = '◀';
        rightIcon.textContent = '◀';
    } else {
        leftIcon.textContent = '◀';
        rightIcon.textContent = '▶';
    }
}

/* ============================================
   📡 Firebase 실시간 동기화
   ============================================ */
let latestState = {};
let latestAssets = {};

function renderCombinedState() {
    const base = latestState || {};
    const combined = { ...base };

    // 에셋 쪽에 보드 이미지가 있으면 우선 사용
    if (latestAssets.boardImage) {
        combined.boardImage = latestAssets.boardImage;
    }

    // 말 이미지 병합
    if (Array.isArray(base.pieces)) {
        combined.pieces = base.pieces.map(p => {
            const cloned = { ...p };
            if (latestAssets.pieces && latestAssets.pieces[p.id]) {
                cloned.image = latestAssets.pieces[p.id];
            }
            return cloned;
        });
    }

    // 솔드아웃 이미지 병합
    if (Array.isArray(base.soldouts)) {
        combined.soldouts = base.soldouts.map(s => {
            const cloned = { ...s };
            if (latestAssets.soldouts && latestAssets.soldouts[s.id]) {
                cloned.image = latestAssets.soldouts[s.id];
            }
            return cloned;
        });
    }

    updateGameUI(combined);
}

if (gameStateRef) {
    gameStateRef.on('value', (snapshot) => {
        latestState = snapshot.val() || {};
        console.log('🔄 게임 상태 업데이트 (state)', latestState);
        renderCombinedState();
    });
}
if (assetsRef) {
    assetsRef.on('value', (snapshot) => {
        latestAssets = snapshot.val() || {};
        console.log('🎨 에셋 상태 업데이트 (assets)', latestAssets);
        renderCombinedState();
    });
}

function updateGameUI(gameState) {
    // 보드 이미지 업데이트
    if (gameState.boardImage) {
        boardEl.style.backgroundImage = `url(${gameState.boardImage})`;
        document.getElementById('boardPlaceholder').style.display = 'none';
    } else {
        boardEl.style.backgroundImage = 'none';
        document.getElementById('boardPlaceholder').style.display = 'block';
    }

    // 말 목록 정보 업데이트
    updatePieceListInfo(gameState.pieces || []);

    // 보드 위 말들 업데이트
    updateBoardPieces(gameState.boardPieces || [], gameState.pieces || []);

    // 보드 위 솔드아웃 업데이트
    updateBoardSoldouts(gameState.boardSoldouts || [], gameState.soldouts || []);

    // 주사위 상태 업데이트
    if (gameState.diceTheme) {
        currentTheme = gameState.diceTheme; // 현재 테마 저장
        const dice = document.getElementById('dice3d');
        dice.className = `dice-3d dice-theme-${gameState.diceTheme}`;
        document.getElementById('diceThemeDisplay').textContent = diceThemeNames[gameState.diceTheme] || '새벽 주사위 💗';
    }

    // 주사위 결과 업데이트 - 값이 바뀔 때만 애니메이션과 소리 재생
    if (gameState.lastDiceRoll) {
        document.getElementById('diceResult').textContent = `결과: ${gameState.lastDiceRoll}`;
        
        // 🎯 새로운 주사위 결과일 때만 애니메이션과 소리 재생
        if (lastDiceRoll !== gameState.lastDiceRoll) {
            console.log('🎲 새로운 주사위 결과:', gameState.lastDiceRoll);
            lastDiceRoll = gameState.lastDiceRoll;
            showDiceFace(gameState.lastDiceRoll);
        } else {
            // 이미 표시된 결과면 애니메이션과 소리 없이 주사위 면만 표시
            console.log('📌 이미 표시된 주사위 결과:', gameState.lastDiceRoll);
            showDiceFaceQuietly(gameState.lastDiceRoll);
        }
    }
}

function updatePieceListInfo(pieces) {
    const list = document.getElementById('pieceListInfo');
    list.innerHTML = '';

    if (pieces.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">말이 없습니다</div>';
        return;
    }

    pieces.forEach(piece => {
        const item = document.createElement('div');
        item.className = 'piece-info-item';

        const icon = document.createElement('div');
        icon.className = 'piece-icon-small';
        if (piece.image) {
            icon.innerHTML = `<img src="${piece.image}">`;
        } else {
            icon.textContent = piece.icon || '🎮';
        }

        const name = document.createElement('div');
        name.className = 'piece-name-small';
        name.textContent = piece.name || '말';

        item.appendChild(icon);
        item.appendChild(name);
        list.appendChild(item);
    });
}

function updateBoardPieces(boardPieces, pieces) {
    // 기존 말들 제거
    document.querySelectorAll('.game-piece-on-board').forEach(el => el.remove());

    // 새로운 말들 추가
    boardPieces.forEach(bp => {
        const piece = pieces.find(p => p.id === bp.pieceId);
        if (piece) {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'game-piece-on-board';
            pieceEl.style.left = `${bp.x}%`;
            pieceEl.style.top = `${bp.y}%`;

            if (piece.image) {
                pieceEl.innerHTML = `<img src="${piece.image}">`;
            } else {
                pieceEl.textContent = piece.icon || '🎮';
            }

            boardEl.appendChild(pieceEl);
        }
    });
}

function updateBoardSoldouts(boardSoldouts, soldouts) {
    // 기존 솔드아웃 제거
    document.querySelectorAll('.soldout-on-board').forEach(el => el.remove());

    // 새로운 솔드아웃 추가
    boardSoldouts.forEach(bs => {
        const soldout = soldouts.find(s => s.id === bs.soldoutId);
        if (soldout) {
            const soldoutEl = document.createElement('div');
            soldoutEl.className = 'soldout-on-board';
            soldoutEl.style.left = `${bs.x}%`;
            soldoutEl.style.top = `${bs.y}%`;

            if (soldout.image) {
                soldoutEl.innerHTML = `<img src="${soldout.image}">`;
            } else {
                soldoutEl.innerHTML = '<img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E🚫%3C/text%3E%3C/svg%3E">';
            }

            boardEl.appendChild(soldoutEl);
        }
    });
}

function showDiceFace(number) {
    const dice = document.getElementById('dice3d');
    
    // 🔊 주사위 굴리는 소리 재생
    playRollSound(currentTheme);
    
    // 🎲 주사위 굴리기 애니메이션 추가
    dice.classList.add('rolling');
    
    // 1초 후에 rolling 클래스 제거하고 최종 결과 표시
    setTimeout(() => {
        dice.classList.remove('rolling');
        
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateX(0deg) rotateY(-90deg)',
            3: 'rotateX(0deg) rotateY(-180deg)',
            4: 'rotateX(0deg) rotateY(90deg)',
            5: 'rotateX(-90deg) rotateY(0deg)',
            6: 'rotateX(90deg) rotateY(0deg)'
        };
        dice.style.transform = rotations[number] || rotations[1];
        
        // 🔊 숫자 음성 재생
        speakNumber(number, currentTheme);
    }, 1000);
}

// 소리 없이 주사위 면만 조용히 표시 (페이지 로드 시나 이미 표시된 결과)
function showDiceFaceQuietly(number) {
    const dice = document.getElementById('dice3d');
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(0deg) rotateY(-90deg)',
        3: 'rotateX(0deg) rotateY(-180deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)'
    };
    dice.style.transform = rotations[number] || rotations[1];
}

/* ============================================
   🔊 소리 재생 함수들
   ============================================ */
function playRollSound(theme) {
    console.log('🎲 주사위 굴리는 소리 재생 시도:', theme);
    if (!diceThemes[theme]) {
        console.error('❌ 테마가 존재하지 않음:', theme);
        return;
    }
    console.log('🔊 소리 파일:', diceThemes[theme].rollSound);
    const sound = new Audio(diceThemes[theme].rollSound);
    sound.volume = 0.7;
    sound.currentTime = 0;
    sound.play()
        .then(() => console.log('✅ 주사위 소리 재생 성공'))
        .catch(err => {
            console.error('🔇 주사위 굴리기 소리 재생 실패:', err);
        });
}

function speakNumber(number, theme) {
    console.log('🔢 숫자 음성 재생 시도:', number, theme);
    if (!diceThemes[theme] || !diceThemes[theme].voices[number]) {
        console.error('❌ 음성이 존재하지 않음:', theme, number);
        return;
    }
    console.log('🔊 음성 파일:', diceThemes[theme].voices[number]);
    const voice = new Audio(diceThemes[theme].voices[number]);
    voice.volume = 0.8;
    setTimeout(() => {
        voice.play()
            .then(() => console.log('✅ 숫자 음성 재생 성공'))
            .catch(err => {
                console.error('🔇 숫자 음성 재생 실패:', err);
            });
    }, 600);
}

/* ============================================
   🎬 페이지 로드 시 초기화
   ============================================ */
window.addEventListener('load', () => {
    console.log('👀 관람 모드로 실행 중...');
});
