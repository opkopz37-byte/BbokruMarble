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
    console.log('✅ Firebase 초기화 완료');
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    alert('Firebase 설정을 확인해주세요. firebase-config.js 파일을 올바르게 설정했는지 확인하세요.');
}

/* ============================================
   🎮 게임 상태 관리
   ============================================ */
let gameState = {
    pieceCount: 4,
    soldoutCount: 5,
    pieceNames: ['말1', '말2', '말3', '말4'],
    pieces: [],
    boardPieces: [],
    soldouts: [
        { id: 'soldout1', image: null },
        { id: 'soldout2', image: null },
        { id: 'soldout3', image: null },
        { id: 'soldout4', image: null },
        { id: 'soldout5', image: null }
    ],
    boardSoldouts: [],
    boardImage: null,
    diceTheme: 'dawn',
    lastDiceRoll: null,
    leftPanelHidden: false,
    rightPanelHidden: false
};

let itemToRemove = null;
const boardEl = document.getElementById('gameBoard');

/* ============================================
   🎲 주사위 테마 설정
   ============================================ */
const diceThemes = {
    dawn: {
        name: '새벽 주사위',
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/a1_융망_새벽.mp3',
            2: 'sounds/a2_딸기_새벽.mp3',
            3: 'sounds/a3_아희_새벽.mp3',
            4: 'sounds/a4_잔디_새벽.mp3',
            5: 'sounds/a5_연우_새벽.mp3',
            6: 'sounds/a6_밍이_새벽.mp3'
        },
        resultColor: '#FF69B4'
    },
    acting: {
        name: '연기 주사위',
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/b1_나찌_연기.mp3',
            2: 'sounds/b2_밍이_연기.mp3',
            3: 'sounds/b3_대니_연기.mp3',
            4: 'sounds/b4_뽀름_연기.mp3',
            5: 'sounds/b5_카즈_연기.mp3',
            6: 'sounds/b6_두식이_연기.mp3'
        },
        resultColor: '#9370DB'
    },
    calm: {
        name: '차분 주사위',
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/c1_키키_차분.mp3',
            2: 'sounds/c2_꽃순이_차분.mp3',
            3: 'sounds/c3_와이비_차분.mp3',
            4: 'sounds/c4_윤정_차분.mp3',
            5: 'sounds/c5_밍이_차분.mp3',
            6: 'sounds/c6_로젬_차분.mp3'
        },
        resultColor: '#4682B4'
    },
    excite: {
        name: '촐싹 주사위',
        rollSound: 'sounds/dice-roll.mp3',
        voices: {
            1: 'sounds/d1_똥깽_촐싹.mp3',
            2: 'sounds/d2_밍이_촐싹.mp3',
            3: 'sounds/d3_뽀끼리_촐싹.mp3',
            4: 'sounds/d4_고도리_촐싹.mp3',
            5: 'sounds/d5_밍이_촐싹.mp3',
            6: 'sounds/d6_꽃순이_촐싹.mp3'
        },
        resultColor: '#ff8855'
    }
};

/* ============================================
   🎯 패널 토글 기능
   ============================================ */
function toggleLeftPanel() {
    gameState.leftPanelHidden = !gameState.leftPanelHidden;
    updatePanelVisibility();
    syncImmediately();
}

function toggleRightPanel() {
    gameState.rightPanelHidden = !gameState.rightPanelHidden;
    updatePanelVisibility();
    syncImmediately();
}

function updatePanelVisibility() {
    const layout = document.getElementById('gameLayout');
    const leftIcon = document.getElementById('leftToggleIcon');
    const rightIcon = document.getElementById('rightToggleIcon');

    // 클래스 초기화
    layout.classList.remove('left-hidden', 'right-hidden', 'both-hidden');

    // 상태에 따라 클래스 추가
    if (gameState.leftPanelHidden && gameState.rightPanelHidden) {
        layout.classList.add('both-hidden');
        leftIcon.textContent = '▶';
        rightIcon.textContent = '◀';
    } else if (gameState.leftPanelHidden) {
        layout.classList.add('left-hidden');
        leftIcon.textContent = '▶';
        rightIcon.textContent = '▶';
    } else if (gameState.rightPanelHidden) {
        layout.classList.add('right-hidden');
        leftIcon.textContent = '◀';
        rightIcon.textContent = '◀';
    } else {
        leftIcon.textContent = '◀';
        rightIcon.textContent = '▶';
    }
}

/* ============================================
   🔐 비밀번호 확인
   ============================================ */
function checkPassword() {
    const input = document.getElementById('passwordInput').value;
    if (input === '4928249486') {
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        initializeGame();
    } else {
        const errorEl = document.getElementById('passwordError');
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
        setTimeout(() => errorEl.style.display = 'none', 2000);
    }
}

/* ============================================
   🚀 게임 초기화
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('passwordInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPassword();
    });

    document.getElementById('boardImageInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                gameState.boardImage = event.target.result;
                document.getElementById('gameBoard').style.backgroundImage = `url(${event.target.result})`;
                document.getElementById('boardPlaceholder').style.display = 'none';
                closeBoardImageModal();
                markAssetsDirty();
                syncImmediately();
            };
            reader.readAsDataURL(file);
        }
    });
});

function initializeGame() {
    // Firebase에서 저장된 게임 로드
    loadInitialState();
}

/* ============================================
   📥 초기 상태 로드 (Firebase) - 개선된 버전!
   ============================================ */
async function loadInitialState() {
    if (!gameStateRef) return;
    
    try {
        const snapshot = await gameStateRef.once('value');
        const data = snapshot.val();
        
        if (data && data.pieces) {
            // 🎉 기존 데이터가 있으면 완전 복원!
            gameState = { ...gameState, ...data };
            
            // UI 업데이트
            document.getElementById('pieceCountDisplay').textContent = gameState.pieceCount;
            document.getElementById('soldoutCountDisplay').textContent = gameState.soldoutCount;
            
            updateNameList();
            updateIconManagementList();
            renderPiecesList();
            renderSoldoutList();
            updateSoldoutIconList();
            
            // 보드 이미지 복원
            if (gameState.boardImage) {
                document.getElementById('gameBoard').style.backgroundImage = `url(${gameState.boardImage})`;
                document.getElementById('boardPlaceholder').style.display = 'none';
            }
            
            // 주사위 테마 복원
            if (gameState.diceTheme) {
                document.getElementById('diceTypeSelect').value = gameState.diceTheme;
                changeDiceTheme();
            }
            
            // 🎯 보드 위 말들 복원!
            if (gameState.boardPieces && gameState.boardPieces.length > 0) {
                gameState.boardPieces.forEach(bp => {
                    const piece = gameState.pieces.find(p => p.id === bp.pieceId);
                    if (piece) {
                        createPieceOnBoard(piece, bp.x, bp.y, true, bp.uniqueId);
                    }
                });
            }
            
            // 🚫 보드 위 솔드아웃 복원!
            if (gameState.boardSoldouts && gameState.boardSoldouts.length > 0) {
                gameState.boardSoldouts.forEach(bs => {
                    const soldout = gameState.soldouts.find(s => s.id === bs.soldoutId);
                    if (soldout) {
                        createSoldoutOnBoard(soldout, bs.x, bs.y, true);  // isRestoring = true
                    }
                });
            }
            
            // 패널 상태 복원
            if (gameState.leftPanelHidden !== undefined || gameState.rightPanelHidden !== undefined) {
                updatePanelVisibility();
            }
            
            console.log('✅ 게임 상태 완전 복원 완료!');
        } else {
            // 새 게임 시작
            console.log('🆕 새로운 게임 시작');
            updateNameList();
            updateIconManagementList();
            generatePieces();
            updateSoldoutIconList();
            showDiceFace(1);
        }
    } catch (error) {
        console.error('❌ 초기 상태 로드 실패:', error);
        // 에러 발생시 기본 초기화
        updateNameList();
        updateIconManagementList();
        generatePieces();
        updateSoldoutIconList();
        showDiceFace(1);
    }
}

/* ============================================
   🍔 햄버거 메뉴 - 보드 이미지 모달
   ============================================ */
function openBoardImageModal() {
    document.getElementById('boardImageModal').style.display = 'flex';
}

function closeBoardImageModal() {
    document.getElementById('boardImageModal').style.display = 'none';
}

/* ============================================
   🏁 말 갯수 조절
   ============================================ */
function adjustPieceCount(delta) {
    gameState.pieceCount = Math.max(1, Math.min(30, gameState.pieceCount + delta));
    document.getElementById('pieceCountDisplay').textContent = gameState.pieceCount;
    updateNameList();
    updateIconManagementList();
    generatePieces();
}

/* ============================================
   📝 말 이름 리스트 업데이트
   ============================================ */
function updateNameList() {
    const list = document.getElementById('nameList');
    list.innerHTML = '';
    
    for (let i = 0; i < gameState.pieceCount; i++) {
        const item = document.createElement('div');
        item.className = 'name-item';
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'name-number';
        numberDiv.textContent = i + 1;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'name-input';
        input.value = gameState.pieceNames[i] || `말${i + 1}`;
        input.placeholder = `말${i + 1}`;
        input.addEventListener('input', function(e) {
            gameState.pieceNames[i] = e.target.value;
            generatePieces();
        });
        
        item.appendChild(numberDiv);
        item.appendChild(input);
        list.appendChild(item);
    }
}

/* ============================================
   🎨 아이콘 관리 리스트
   ============================================ */
function updateIconManagementList() {
    const list = document.getElementById('iconManagementList');
    list.innerHTML = '';
    
    for (let i = 0; i < gameState.pieceCount; i++) {
        const item = document.createElement('div');
        item.className = 'icon-item';
        
        const preview = document.createElement('div');
        preview.className = 'icon-preview';
        const piece = gameState.pieces[i];
        if (piece && piece.image) {
            preview.innerHTML = `<img src="${piece.image}">`;
        } else if (piece && piece.icon) {
            preview.textContent = piece.icon;
        } else {
            preview.textContent = '🎮';
        }
        
        const info = document.createElement('div');
        info.className = 'icon-info';
        
        const name = document.createElement('div');
        name.className = 'icon-name';
        name.textContent = gameState.pieceNames[i] || `말${i + 1}`;
        
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'icon-upload-btn';
        uploadBtn.textContent = '📁 이미지 업로드';
        uploadBtn.onclick = function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        if (!gameState.pieces[i]) {
                            gameState.pieces[i] = {};
                        }
                        gameState.pieces[i].image = event.target.result;
                        updateIconManagementList();
                        renderPiecesList();
                        markAssetsDirty();
                        syncImmediately();
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };
        
        info.appendChild(name);
        info.appendChild(uploadBtn);
        item.appendChild(preview);
        item.appendChild(info);
        list.appendChild(item);
    }
}

/* ============================================
   🎯 말 생성
   ============================================ */
function generatePieces() {
    const oldPieces = [...gameState.pieces];
    gameState.pieces = [];
    for (let i = 0; i < gameState.pieceCount; i++) {
        const existingPiece = oldPieces[i] || {};
        gameState.pieces.push({
            id: `piece${i + 1}`,
            name: gameState.pieceNames[i] || `말${i + 1}`,
            icon: existingPiece.icon || '🎮',
            image: existingPiece.image || null
        });
    }
    renderPiecesList();
    syncImmediately();
}

/* ============================================
   📦 말 팔레트 렌더링
   ============================================ */
function renderPiecesList() {
    const palette = document.getElementById('piecesPalette');
    palette.innerHTML = '';
    
    gameState.pieces.forEach(piece => {
        const item = document.createElement('div');
        item.className = 'piece-item';
        item.draggable = true;
        item.dataset.pieceId = piece.id;
        
        const icon = document.createElement('div');
        icon.className = 'piece-icon-display';
        if (piece.image) {
            icon.innerHTML = `<img src="${piece.image}">`;
        } else {
            icon.textContent = piece.icon;
        }
        
        const name = document.createElement('div');
        name.className = 'piece-name-display';
        name.textContent = piece.name;
        
        item.appendChild(icon);
        item.appendChild(name);
        item.addEventListener('dragstart', onPieceDragStart);
        palette.appendChild(item);
    });
}

/* ============================================
   🚫 솔드아웃 갯수 조절
   ============================================ */
function changeSoldoutCount(delta) {
    gameState.soldoutCount = Math.max(1, Math.min(20, gameState.soldoutCount + delta));
    document.getElementById('soldoutCountDisplay').textContent = gameState.soldoutCount;
    generateSoldouts();
}

function generateSoldouts() {
    const oldSoldouts = [...gameState.soldouts];
    gameState.soldouts = [];
    for (let i = 0; i < gameState.soldoutCount; i++) {
        const existingSoldout = oldSoldouts[i] || {};
        gameState.soldouts.push({
            id: `soldout${i + 1}`,
            image: existingSoldout.image || null
        });
    }
    updateSoldoutIconList();
    renderSoldoutList();
    syncImmediately();
}

function updateSoldoutIconList() {
    const list = document.getElementById('soldoutIconList');
    list.innerHTML = '';
    
    for (let i = 0; i < gameState.soldoutCount; i++) {
        const item = document.createElement('div');
        item.className = 'icon-item';
        
        const preview = document.createElement('div');
        preview.className = 'icon-preview';
        preview.style.borderRadius = '10px';
        const soldout = gameState.soldouts[i];
        if (soldout && soldout.image) {
            preview.innerHTML = `<img src="${soldout.image}" style="border-radius: 10px;">`;
        } else {
            preview.textContent = '🚫';
        }
        
        const info = document.createElement('div');
        info.className = 'icon-info';
        
        const name = document.createElement('div');
        name.className = 'icon-name';
        name.textContent = `솔드아웃 ${i + 1}`;
        
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'icon-upload-btn';
        uploadBtn.textContent = '📁 이미지 업로드';
        uploadBtn.onclick = function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        if (!gameState.soldouts[i]) {
                            gameState.soldouts[i] = { id: `soldout${i + 1}` };
                        }
                        gameState.soldouts[i].image = event.target.result;
                        updateSoldoutIconList();
                        renderSoldoutList();
                        markAssetsDirty();
                        syncImmediately();
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };
        
        info.appendChild(name);
        info.appendChild(uploadBtn);
        item.appendChild(preview);
        item.appendChild(info);
        list.appendChild(item);
    }
}

function renderSoldoutList() {
    const palette = document.getElementById('soldoutPalette');
    palette.innerHTML = '';
    
    gameState.soldouts.forEach(soldout => {
        const item = document.createElement('div');
        item.className = 'soldout-item';
        item.draggable = true;
        item.dataset.soldoutId = soldout.id;
        
        const icon = document.createElement('div');
        icon.className = 'soldout-icon-display';
        if (soldout.image) {
            icon.innerHTML = `<img src="${soldout.image}">`;
        } else {
            icon.textContent = '🚫';
        }
        
        item.appendChild(icon);
        item.addEventListener('dragstart', onSoldoutDragStart);
        palette.appendChild(item);
    });
}

/* ============================================
   🎯 드래그 & 드롭
   ============================================ */
let draggedPieceData = null;
let draggedSoldoutData = null;

function onPieceDragStart(e) {
    const pieceId = e.currentTarget.dataset.pieceId;
    draggedPieceData = gameState.pieces.find(p => p.id === pieceId);
    e.dataTransfer.effectAllowed = 'copy';
}

function onSoldoutDragStart(e) {
    const soldoutId = e.currentTarget.dataset.soldoutId;
    draggedSoldoutData = gameState.soldouts.find(s => s.id === soldoutId);
    e.dataTransfer.effectAllowed = 'copy';
}

boardEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

boardEl.addEventListener('drop', e => {
    e.preventDefault();
    const rect = boardEl.getBoundingClientRect();
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;

    if (draggedPieceData) {
        createPieceOnBoard(draggedPieceData, percentX, percentY);
        draggedPieceData = null;
    } else if (draggedSoldoutData) {
        createSoldoutOnBoard(draggedSoldoutData, percentX, percentY);
        draggedSoldoutData = null;
    }
});

function createPieceOnBoard(piece, percentX, percentY, isRestoring = false, uniqueId = null) {
    // 중복 허용: 같은 말을 여러 개 꺼낼 수 있음
    const pieceUniqueId = uniqueId || `${piece.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pieceEl = document.createElement('div');
    pieceEl.className = 'game-piece-on-board';
    pieceEl.dataset.pieceId = piece.id;
    pieceEl.dataset.uniqueId = pieceUniqueId;
    pieceEl.style.left = `${percentX}%`;
    pieceEl.style.top = `${percentY}%`;
    
    if (piece.image) {
        pieceEl.innerHTML = `<img src="${piece.image}">`;
    } else {
        pieceEl.textContent = piece.icon;
    }
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'piece-remove';
    removeBtn.textContent = '×';
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        itemToRemove = { type: 'piece', element: pieceEl };
        document.getElementById('removeModal').style.display = 'flex';
    };
    
    pieceEl.appendChild(removeBtn);
    pieceEl.addEventListener('mousedown', startDragOnBoard);
    boardEl.appendChild(pieceEl);
    
    // 🎯 복원 중이 아닐 때만 gameState에 추가
    if (!isRestoring) {
        gameState.boardPieces.push({ 
            pieceId: piece.id,
            uniqueId: pieceUniqueId,
            x: percentX, 
            y: percentY 
        });
        syncImmediately();
    }
}

function createSoldoutOnBoard(soldout, percentX, percentY, isRestoring = false) {
    const soldoutEl = document.createElement('div');
    soldoutEl.className = 'soldout-on-board';
    soldoutEl.dataset.soldoutId = soldout.id;
    soldoutEl.style.left = `${percentX}%`;
    soldoutEl.style.top = `${percentY}%`;
    
    if (soldout.image) {
        soldoutEl.innerHTML = `<img src="${soldout.image}">`;
    } else {
        soldoutEl.innerHTML = '<img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E🚫%3C/text%3E%3C/svg%3E">';
    }
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'piece-remove';
    removeBtn.textContent = '×';
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        itemToRemove = { type: 'soldout', element: soldoutEl };
        document.getElementById('removeModal').style.display = 'flex';
    };
    
    soldoutEl.appendChild(removeBtn);
    soldoutEl.addEventListener('mousedown', startDragOnBoard);
    boardEl.appendChild(soldoutEl);
    
    // 🎯 복원 중이 아닐 때만 gameState에 추가
    if (!isRestoring) {
        gameState.boardSoldouts.push({ 
            soldoutId: soldout.id, 
            x: percentX, 
            y: percentY 
        });
        syncImmediately();
    }
}

function startDragOnBoard(e) {
    e.preventDefault();
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const onMove = e => {
        const pixelX = e.clientX - boardRect.left - offsetX;
        const pixelY = e.clientY - boardRect.top - offsetY;

        const percentX = (pixelX / boardRect.width) * 100;
        const percentY = (pixelY / boardRect.height) * 100;

        element.style.left = `${percentX}%`;
        element.style.top = `${percentY}%`;

        // syncToFirebase 내부의 시간 throttle(MIN_SYNC_INTERVAL)이 호출 빈도를 제한함
        syncToFirebase();
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        syncImmediately();
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

/* ============================================
   🗑️ 제거 기능
   ============================================ */
function confirmRemove() {
    if (itemToRemove) {
        itemToRemove.element.remove();
        if (itemToRemove.type === 'piece') {
            const uniqueId = itemToRemove.element.dataset.uniqueId;
            gameState.boardPieces = gameState.boardPieces.filter(bp => bp.uniqueId !== uniqueId);
        } else {
            gameState.boardSoldouts = gameState.boardSoldouts.filter(bs => bs.soldoutId !== itemToRemove.element.dataset.soldoutId);
        }
        syncImmediately();
    }
    cancelRemove();
}

function cancelRemove() {
    itemToRemove = null;
    document.getElementById('removeModal').style.display = 'none';
}

function resetAllPieces() {
    document.querySelectorAll('.game-piece-on-board, .soldout-on-board').forEach(el => el.remove());
    gameState.boardPieces = [];
    gameState.boardSoldouts = [];
    syncImmediately();
}

function removeBoardImage() {
    gameState.boardImage = null;
    boardEl.style.backgroundImage = 'none';
    document.getElementById('boardPlaceholder').style.display = 'block';
    document.getElementById('boardImageInput').value = '';
    closeBoardImageModal();
    markAssetsDirty();
    syncImmediately();
}

/* ============================================
   🎲 주사위 기능
   ============================================ */
function changeDiceTheme() {
    const theme = document.getElementById('diceTypeSelect').value;
    gameState.diceTheme = theme;
    
    const dice = document.getElementById('dice3d');
    const btn = document.getElementById('rollDiceBtn');
    const result = document.getElementById('diceResultText');
    
    dice.className = `dice-3d dice-theme-${theme}`;
    btn.className = `roll-dice-btn btn-theme-${theme}`;
    result.style.color = diceThemes[theme].resultColor;
    
    showDiceFace(1);
    syncImmediately();
}

function rollDice() {
    const dice = document.getElementById('dice3d');
    const button = document.getElementById('rollDiceBtn');
    const result = document.getElementById('diceResultText');
    const theme = gameState.diceTheme;

    button.disabled = true;
    result.textContent = '';

    playRollSound(theme);
    dice.classList.add('rolling');

    // 🎲 정확히 1/6 확률로 주사위 굴리기 (1~6)
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(() => {
        dice.classList.remove('rolling');
        showDiceFace(randomNumber);
        
        result.textContent = `결과: ${randomNumber}`;
        result.style.color = diceThemes[theme].resultColor;
        
        speakNumber(randomNumber, theme);
        
        gameState.lastDiceRoll = randomNumber;
        button.disabled = false;
        
        syncImmediately();
    }, 1200);
}

function showDiceFace(number) {
    const dice = document.getElementById('dice3d');
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(0deg) rotateY(-90deg)',
        3: 'rotateX(0deg) rotateY(-180deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)'
    };
    dice.style.transform = rotations[number];
}

function playRollSound(theme) {
    const sound = new Audio(diceThemes[theme].rollSound);
    sound.volume = 0.7; // 볼륨 70%
    sound.currentTime = 0;
    sound.play().catch(err => {
        console.warn('🔇 주사위 굴리기 소리 재생 실패:', err);
    });
}

function speakNumber(number, theme) {
    const voice = new Audio(diceThemes[theme].voices[number]);
    voice.volume = 0.8; // 볼륨 80%
    setTimeout(() => {
        voice.play().catch(err => {
            console.warn('🔇 숫자 음성 재생 실패:', err);
        });
    }, 600);
}

/* ============================================
   💾 Firebase 동기화
   ============================================ */
let syncTimeout = null;
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 100;
let assetsDirty = false;

function markAssetsDirty() {
    assetsDirty = true;
}

function buildAssetsPayload() {
    const pieceImages = {};
    (gameState.pieces || []).forEach(p => {
        if (p.image) {
            pieceImages[p.id] = p.image;
        }
    });

    const soldoutImages = {};
    (gameState.soldouts || []).forEach(s => {
        if (s.image) {
            soldoutImages[s.id] = s.image;
        }
    });

    return {
        boardImage: gameState.boardImage || null,
        pieces: pieceImages,
        soldouts: soldoutImages,
        hostSecret: 'bbokru_v3_secret_2024_1224'
    };
}

async function syncAssetsToFirebase() {
    if (!assetsRef) {
        return;
    }
    try {
        const payload = buildAssetsPayload();
        await assetsRef.set(payload);
        console.log('✅ Firebase 에셋 동기화 완료');
    } catch (error) {
        console.error('❌ Firebase 에셋 동기화 에러:', error);
    }
}

async function syncToFirebase() {
    if (!gameStateRef) {
        console.warn('⚠️ Firebase가 초기화되지 않았습니다');
        return;
    }
    
    const now = Date.now();
    if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToFirebase(), MIN_SYNC_INTERVAL);
        return;
    }
    
    lastSyncTime = now;
    
    try {
        const boardPiecesWithPosition = [];
        document.querySelectorAll('.game-piece-on-board').forEach(el => {
            const pieceId = el.dataset.pieceId;
            const uniqueId = el.dataset.uniqueId;
            const left = parseFloat(el.style.left) || 0;
            const top = parseFloat(el.style.top) || 0;
            boardPiecesWithPosition.push({
                pieceId: pieceId,
                uniqueId: uniqueId,
                x: left,
                y: top
            });
        });
        
        const boardSoldoutsWithPosition = [];
        document.querySelectorAll('.soldout-on-board').forEach(el => {
            const soldoutId = el.dataset.soldoutId;
            const left = parseFloat(el.style.left) || 0;
            const top = parseFloat(el.style.top) || 0;
            boardSoldoutsWithPosition.push({
                soldoutId: soldoutId,
                x: left,
                y: top
            });
        });
        
        // state 전용 payload (이미지 제외!)
        const statePayload = {
            pieceCount: gameState.pieceCount,
            soldoutCount: gameState.soldoutCount,
            pieceNames: gameState.pieceNames,
            pieces: (gameState.pieces || []).map(p => ({
                id: p.id,
                name: p.name,
                icon: p.icon
                // image는 제외!
            })),
            boardPieces: boardPiecesWithPosition,
            soldouts: (gameState.soldouts || []).map(s => ({
                id: s.id
                // image는 제외!
            })),
            boardSoldouts: boardSoldoutsWithPosition,
            diceTheme: gameState.diceTheme,
            lastDiceRoll: gameState.lastDiceRoll,
            leftPanelHidden: gameState.leftPanelHidden,
            rightPanelHidden: gameState.rightPanelHidden,
            hostSecret: 'bbokru_v3_secret_2024_1224'
            // boardImage도 제외!
        };
        
        await gameStateRef.set(statePayload);
        console.log('✅ Firebase 상태 동기화 완료', new Date().toLocaleTimeString());
        
        // 이미지가 변경되었을 때만 assets 동기화
        if (assetsDirty) {
            await syncAssetsToFirebase();
            assetsDirty = false;
        }
    } catch (error) {
        console.error('❌ Firebase 동기화 에러:', error);
    }
}

async function syncImmediately() {
    lastSyncTime = 0;
    await syncToFirebase();
}

/* ============================================
   💾 수동 저장 기능
   ============================================ */
async function saveGameState() {
    const statusEl = document.getElementById('saveStatus');
    const saveBtn = event.target;
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 저장 중...';
        statusEl.textContent = '';
        
        // 즉시 동기화 실행
        await syncImmediately();
        
        // 성공 메시지
        saveBtn.textContent = '✅ 저장 완료!';
        statusEl.textContent = '✅ 저장되었습니다!';
        statusEl.className = 'save-status success';
        
        // 2초 후 원래 상태로
        setTimeout(() => {
            saveBtn.textContent = '💾 현재 상태 저장하기';
            saveBtn.disabled = false;
            statusEl.textContent = '';
        }, 2000);
        
    } catch (error) {
        console.error('저장 실패:', error);
        saveBtn.textContent = '❌ 저장 실패';
        statusEl.textContent = '❌ 저장에 실패했습니다';
        statusEl.className = 'save-status error';
        
        setTimeout(() => {
            saveBtn.textContent = '💾 현재 상태 저장하기';
            saveBtn.disabled = false;
            statusEl.textContent = '';
        }, 2000);
    }
}
