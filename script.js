// --- تنظیمات اولیه، ثابت‌ها، متغیرهای سراسری بازی ---
const CORRECT_POINTS = [
    [0.1,0.1],[0.5,0.1],[0.9,0.1], [0.1,0.5],[0.9,0.5], [0.1,0.9],[0.5,0.9],[0.9,0.9],
    [0.23,0.23],[0.5,0.23],[0.77,0.23], [0.23,0.5],[0.77,0.5], [0.23,0.77],[0.5,0.77],[0.77,0.77],
    [0.36,0.36],[0.5,0.36],[0.64,0.36], [0.36,0.5],[0.64,0.5], [0.36,0.64],[0.5,0.64],[0.64,0.64]
];
const FINAL_CORRECT_LINES = [ 
    [0,1], [1,2], [2,4], [4,7], [7,6], [6,5], [5,3], [3,0], [8,9], [9,10], [10,12], [12,15], [15,14], [14,13], [13,11], [11,8],
    [16,17], [17,18], [18,20], [20,23], [23,22], [22,21], [21,19], [19,16], [1,9], [3,11], [4,12], [6,14], [9,17], [11,19], [12,20], [14,22]
];
const MILLS = [
    [0,1,2],[2,4,7],[7,6,5],[5,3,0],[8,9,10],[10,12,15],[15,14,13],[13,11,8],
    [16,17,18],[18,20,23],[23,22,21],[21,19,16],[0,8,16],[1,9,17],[2,10,18],
    [3,11,19],[4,12,20],[5,13,21],[6,14,22],[7,15,23]
];
const ADJACENCY_MAP = Array(24).fill(null).map(() => []);
FINAL_CORRECT_LINES.forEach(([p1, p2]) => { ADJACENCY_MAP[p1].push(p2); ADJACENCY_MAP[p2].push(p1); });

const MAX_PIECES_TO_PLACE = 9; const PIECES_TO_FLY = 3; const MOVES_FOR_DRAW = 50;
const AI_MOVE_TIMEOUT = 5000; const BASE_INTERNAL_AI_MOVE_DELAY = 700;
const BASE_INTERNAL_AI_REMOVAL_DELAY = 250; const BASE_STUDENT_AI_MOVE_DELAY = 500;
const BASE_STUDENT_AI_REMOVAL_DELAY = 250; const MIN_OBSERVABLE_DELAY = 50; // حداقل تاخیر کمتر شد

let board = Array(24).fill(null); let piecesInHand = [MAX_PIECES_TO_PLACE, MAX_PIECES_TO_PLACE];
let piecesOnBoard = [0,0]; let turn = 0; let scores = [0, 0]; let gameMode = 'human';
let playerColors = ['#e74c3c', '#2980b9']; let gameState = 'NOT_STARTED'; let selectedPieceIndex = -1; let lastMillIndices = [];
let movesSinceLastMillOrCapture = 0; let studentAICode = [null, null]; 
let studentTeamNames = ["تیم دانشجویی ۱", "تیم دانشجویی ۲"]; let gameSpeedMultiplier = 1;
let aiDifficultyLevel = 'medium'; let lastMovedPieceInfo = { from: -1, to: -1 };
let isGameActuallyStarted = false; let currentRoundMoveHistory = [];
let totalRoundsInSeries = 1;
let currentRoundNumber = 0;
let piecesLostByPlayer = [0, 0];

const gameBoardEl = document.getElementById('gameBoard'); const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2'); const player1NameEl = document.getElementById('player1Name');
const player2NameEl = document.getElementById('player2Name'); const turnInfoEl = document.getElementById('turnInfo');
const drawCounterInfoEl = document.getElementById('drawCounterInfo'); const gameMessageEl = document.getElementById('gameMessage');
const winnerModalEl = new bootstrap.Modal(document.getElementById('winnerModal'));
const winnerTextEl = document.getElementById('winnerText'); const gameModeSelect = document.getElementById('gameMode');
const player1ColorInput = document.getElementById('player1Color'); const player2ColorInput = document.getElementById('player2Color');
const resetGameBtn = document.getElementById('resetGameBtn');
const newGameBtn = document.getElementById('newGameBtn'); const startNewRoundBtn = document.getElementById('startNewRoundBtn');
const studentAIUploadContainer = document.getElementById('studentAIUploadContainer');
const studentAIUploadSection = document.getElementById('studentAIUploadSection');
const teamName0Input = document.getElementById('teamName0'); const studentAIFile0 = document.getElementById('studentAIFile0');
const loadAI0Btn = document.getElementById('loadAI0Btn'); const ai0Status = document.getElementById('ai0Status');
const teamName1Input = document.getElementById('teamName1'); const studentAIFile1 = document.getElementById('studentAIFile1');
const loadAI1Btn = document.getElementById('loadAI1Btn'); const ai1Status = document.getElementById('ai1Status');
const gameSpeedInput = document.getElementById('gameSpeed'); const gameSpeedLabel = document.getElementById('gameSpeedLabel');
const aiDifficultySelect = document.getElementById('aiDifficulty');
const player1Title = document.getElementById('player1Title'); const player2Title = document.getElementById('player2Title');
const studentAI0InputGroup = document.getElementById('studentAI0InputGroup');
const studentAI1InputGroup = document.getElementById('studentAI1InputGroup');
const startGameUserBtn = document.getElementById('startGameUserBtn'); 
const settingsModalBtn = document.getElementById('settingsModalBtn');
const gameSettingsModalEl = document.getElementById('gameSettingsModal');
let gameSettingsModal; // To be initialized later
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// New DOM Elements for Reset and History Modals
const openResetModalBtn = document.getElementById('openResetModalBtn');
const resetOptionsModalEl = document.getElementById('resetOptionsModal');
const confirmResetRoundBtn = document.getElementById('confirmResetRoundBtn');
const confirmNewSeriesBtn = document.getElementById('confirmNewSeriesBtn');
const openHistoryModalBtn = document.getElementById('openHistoryModalBtn');
const moveHistoryModalEl = document.getElementById('moveHistoryModal');
const historyListDisplayEl = document.getElementById('historyListDisplay');
const numRoundsInputEl = document.getElementById('numRoundsInput');
const roundInfoDisplayEl = document.getElementById('roundInfoDisplay');
const player0ReserveEl = document.getElementById('player0Reserve');
const player1ReserveEl = document.getElementById('player1Reserve');
const player0CapturedDisplayEl = document.getElementById('player0CapturedDisplay');
const player1CapturedDisplayEl = document.getElementById('player1CapturedDisplay');

let resetOptionsModalInstance, moveHistoryModalInstance;

function createPieceSVG(playerIndex, isSmall = false) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    const pieceSize = isSmall ? 20 : 14; // radius for small piece, keep original for board
    const viewBoxSize = isSmall ? 40 : 28; // if r=20, diameter is 40. if r=14, diameter 28
    svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);
    
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute('cx', viewBoxSize / 2);
    c.setAttribute('cy', viewBoxSize / 2);
    c.setAttribute('r', pieceSize * 0.9); // Slightly smaller than half of viewBox for some padding/stroke room
    c.setAttribute('fill', playerColors[playerIndex]);
    c.setAttribute('stroke', '#333');
    c.setAttribute('stroke-width', '1.5');
    svg.appendChild(c);
    return svg;
}

function drawPieceReserves() {
    if (!player0ReserveEl || !player1ReserveEl) return;
    player0ReserveEl.innerHTML = '';
    player1ReserveEl.innerHTML = '';

    for (let i = 0; i < piecesInHand[0]; i++) {
        player0ReserveEl.appendChild(createPieceSVG(0, true));
    }
    for (let i = 0; i < piecesInHand[1]; i++) {
        player1ReserveEl.appendChild(createPieceSVG(1, true));
    }
}

function drawCapturedPiecesDisplay() {
    if (!player0CapturedDisplayEl || !player1CapturedDisplayEl) return;
    player0CapturedDisplayEl.innerHTML = '';
    player1CapturedDisplayEl.innerHTML = '';

    // Player 0's pieces that were captured by Player 1
    for (let i = 0; i < piecesLostByPlayer[0]; i++) {
        player0CapturedDisplayEl.appendChild(createPieceSVG(0, true)); // Player 0's color, styled by CSS as captured
    }
    // Player 1's pieces that were captured by Player 0
    for (let i = 0; i < piecesLostByPlayer[1]; i++) {
        player1CapturedDisplayEl.appendChild(createPieceSVG(1, true)); // Player 1's color, styled by CSS as captured
    }
}

function updateScoreboardColors() {
    if (score1El && playerColors[0]) {
        score1El.style.backgroundColor = playerColors[0];
    }
    if (score2El && playerColors[1]) {
        score2El.style.backgroundColor = playerColors[1];
    }
}

function calculateDelay(baseDelay) {
    if (gameSpeedMultiplier <= 0.01) return MIN_OBSERVABLE_DELAY; // خیلی سریع اما نه صفر
    return Math.max(MIN_OBSERVABLE_DELAY, baseDelay / gameSpeedMultiplier);
}
function getPhaseDisplayName(gs) { return gs==='PLACING'?'قرار دادن':gs==='MOVING'?'حرکت':gs==='FLYING'?'پرواز':gs==='NOT_STARTED'?'شروع نشده':gs; }
function isCurrentPlayerAIInternal() { return (gameMode === 'ai' && turn === 1) || (gameMode === 'ai_vs_ai') || (gameMode === 'student_vs_internal_ai' && turn === 1); }
function isCurrentPlayerStudentAI() { return ((gameMode === 'student_vs_student' || (gameMode === 'student_vs_internal_ai' && turn === 0)) && studentAICode[turn] !== null) ; }
function getCurrentPlayerName() { return turn === 0 ? player1NameEl.textContent : player2NameEl.textContent; }

function drawBoard() {
    gameBoardEl.innerHTML = ''; const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 400 400');
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    svg.appendChild(defs);
    FINAL_CORRECT_LINES.forEach(([p1, p2]) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', CORRECT_POINTS[p1][0] * 400); line.setAttribute('y1', CORRECT_POINTS[p1][1] * 400);
        line.setAttribute('x2', CORRECT_POINTS[p2][0] * 400); line.setAttribute('y2', CORRECT_POINTS[p2][1] * 400);
        svg.appendChild(line); // استایل از CSS
    });
    if (isGameActuallyStarted && selectedPieceIndex !== -1 && (gameState === 'MOVING' || gameState === 'FLYING') && !isCurrentPlayerAIInternal() && !isCurrentPlayerStudentAI()) {
        const currentPhaseForPlayer = (piecesInHand[turn] === 0 && piecesOnBoard[turn] <= PIECES_TO_FLY) ? 'FLYING' : 'MOVING';
        let validTargets = (currentPhaseForPlayer === 'FLYING') ? board.map((v,i)=>v===null?i:-1).filter(i=>i!==-1) : ADJACENCY_MAP[selectedPieceIndex].filter(idx => board[idx] === null);
        validTargets.forEach(targetIdx => {
            const hc = document.createElementNS(svgNS, 'circle');
            hc.setAttribute('cx', CORRECT_POINTS[targetIdx][0] * 400); hc.setAttribute('cy', CORRECT_POINTS[targetIdx][1] * 400);
            hc.setAttribute('r', '17'); hc.classList.add('valid-move-highlight'); svg.appendChild(hc);
        });
    }
    CORRECT_POINTS.forEach((p, i) => {
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', p[0] * 400); c.setAttribute('cy', p[1] * 400); c.setAttribute('r', '14'); // اندازه جدید مهره
        c.setAttribute('stroke', '#333'); c.setAttribute('stroke-width', '2'); c.dataset.index = i;
        if (board[i] !== null) {
            c.setAttribute('fill', playerColors[board[i]]); c.classList.add('player-piece');
            if (gameState==='REMOVING_PIECE' && board[i]===1-turn && (!isPieceInAnyMill(i,1-turn)||areAllOpponentPiecesInMills(1-turn))) c.classList.add('removable');
            else if (gameState==='REMOVING_PIECE' && board[i]===1-turn) c.classList.add('in-mill-not-removable');
            if (lastMillIndices.includes(i)) c.classList.add('glow-effect');
            if (i === lastMovedPieceInfo.to || (lastMovedPieceInfo.from === i && board[i] !== null) ) c.classList.add('last-move-highlight');
        } else { c.setAttribute('fill', '#fff'); c.classList.add('point-empty'); }
        if (i === selectedPieceIndex && !isCurrentPlayerAIInternal() && !isCurrentPlayerStudentAI()) c.classList.add('selected');
        c.addEventListener('click', () => handlePointClick(i)); svg.appendChild(c);
    });
    gameBoardEl.appendChild(svg);
}
function updateScores() { 
    score1El.textContent = scores[0]; 
    score2El.textContent = scores[1]; 
    updateScoreboardColors(); // Call to update colors when scores change
}
function updateTurnInfo() {
    let msg; const name = getCurrentPlayerName();
    if (gameState === 'NOT_STARTED') msg = "برای شروع، تنظیمات را انجام داده و دکمه 'شروع بازی' را بزنید.";
    else if (gameState === 'REMOVING_PIECE') msg = `${name} در حال انتخاب مهره برای حذف...`;
    else if (gameState === 'GAME_OVER') msg = "بازی تمام شد!";
    else { const phase = (piecesInHand[turn]===0)?((piecesOnBoard[turn]<=PIECES_TO_FLY)?'FLYING':'MOVING'):'PLACING';
           let disp = getPhaseDisplayName(phase); if(phase==='PLACING') disp+=` (${piecesInHand[turn]} مانده)`;
           msg = `نوبت ${name}: فاز ${disp}`; }
    turnInfoEl.textContent = msg;
}
function updateDrawCounterInfo() {
    if(isGameActuallyStarted && gameState!=='PLACING' && gameState!=='GAME_OVER' && gameState!=='REMOVING_PIECE') {
        drawCounterInfoEl.textContent = `حرکت بدون میل/حذف: ${movesSinceLastMillOrCapture}/${MOVES_FOR_DRAW}`;
        drawCounterInfoEl.style.display = 'block';
    } else drawCounterInfoEl.style.display = 'none';
}
function showMessage(text, type = 'info') {
    // If AI vs AI mode, suppress all game messages from this function
    if (gameMode === 'ai_vs_ai') {
        // Optionally, still log to console if needed for debugging, but don't show on UI
        // console.log(`AIvsAI Message Suppressed: ${text}`);
        gameMessageEl.style.display = 'none'; // Ensure it's hidden if it was somehow shown before
        return;
    }

    console.log("Showing message:", text, "Type:", type); // Keep this for general debug
    gameMessageEl.textContent = text;
    gameMessageEl.className = `alert alert-${type} mt-2`;
    gameMessageEl.style.display = 'block';
}

function handlePointClick(index) {
    if (!isGameActuallyStarted || gameState==='GAME_OVER' || isCurrentPlayerAIInternal() || isCurrentPlayerStudentAI()) return;
    lastMillIndices=[]; clearLastMoveHighlight();
    if(gameState==='REMOVING_PIECE'){ const opp=1-turn; if(board[index]===opp && (!isPieceInAnyMill(index,opp)||areAllOpponentPiecesInMills(opp))) removeOpponentPiece(index); else showMessage("انتخاب نامعتبر برای حذف.", "warning"); }
    else if(gameState==='PLACING'){ if(board[index]===null) placePiece(index); else showMessage("نقطه اشغال شده!", "warning"); }
    else if(gameState==='MOVING'||gameState==='FLYING'){
        if(selectedPieceIndex===-1){ if(board[index]===turn){selectedPieceIndex=index; showMessage(`مهره انتخاب شد. به یک نقطه خالی ${getPhaseDisplayName(gameState)} حرکت دهید.`, "info");} else showMessage("مهره خودتان را انتخاب کنید.", "warning");}
        else{ if(index===selectedPieceIndex) {selectedPieceIndex=-1; showMessage("انتخاب لغو شد.", "info");}
              else if(board[index]===null){ const phase=(piecesInHand[turn]===0&&piecesOnBoard[turn]<=PIECES_TO_FLY)?'FLYING':'MOVING'; const valid=(phase==='FLYING')||(phase==='MOVING'&&ADJACENCY_MAP[selectedPieceIndex].includes(index)); if(valid){movePiece(selectedPieceIndex,index);selectedPieceIndex=-1;} else showMessage("حرکت نامعتبر!", "danger");}
              else showMessage("به نقطه خالی حرکت کنید.", "warning");}}
    drawBoard(); updateTurnInfo();
}
function setLastMoveHighlight(from, to) { lastMovedPieceInfo = { from, to }; }
function clearLastMoveHighlight() { lastMovedPieceInfo = { from: -1, to: -1 }; }

function logMoveToHistory(moveDescription) {
    console.log("Logging to history:", moveDescription); // DEBUG
    currentRoundMoveHistory.push(moveDescription);
    console.log("Current history array:", currentRoundMoveHistory); // DEBUG
}

function placePiece(index) {
    if(!isGameActuallyStarted || !(piecesInHand[turn]>0 && board[index]===null)) return;
    board[index]=turn; piecesInHand[turn]--; piecesOnBoard[turn]++; movesSinceLastMillOrCapture=0; setLastMoveHighlight(-1,index);
    logMoveToHistory(`${getCurrentPlayerName()} مهره‌ای در نقطه ${index + 1} قرار داد.`);
    if(checkMillFormation(index,turn)){ gameState='REMOVING_PIECE';
        logMoveToHistory(`${getCurrentPlayerName()} با قرار دادن مهره در ${index + 1} میل ساخت.`);
        if(isCurrentPlayerStudentAI()) setTimeout(()=>invokeStudentAIForRemoval(turn), calculateDelay(BASE_STUDENT_AI_REMOVAL_DELAY));
        else if(isCurrentPlayerAIInternal()) setTimeout(aiRemoveOpponentPieceEnhanced, calculateDelay(BASE_INTERNAL_AI_REMOVAL_DELAY));
    } else { switchTurn(); }
    if(piecesInHand[0]===0 && piecesInHand[1]===0 && gameState==='PLACING') gameState='MOVING';
    updateDrawCounterInfo(); drawBoard(); updateTurnInfo(); drawPieceReserves(); drawCapturedPiecesDisplay(); // Update reserve and captured display
}
function movePiece(from, to) {
    if(!isGameActuallyStarted || board[from]!==turn || board[to]!==null) return;
    board[to]=turn; board[from]=null; movesSinceLastMillOrCapture++; setLastMoveHighlight(from,to);
    logMoveToHistory(`${getCurrentPlayerName()} مهره خود را از ${from + 1} به ${to + 1} حرکت داد.`);
    if(checkMillFormation(to,turn)){ gameState='REMOVING_PIECE';
        movesSinceLastMillOrCapture=0;
        logMoveToHistory(`${getCurrentPlayerName()} با حرکت از ${from + 1} به ${to + 1} میل ساخت.`);
        if(isCurrentPlayerStudentAI()) setTimeout(()=>invokeStudentAIForRemoval(turn), calculateDelay(BASE_STUDENT_AI_REMOVAL_DELAY));
        else if(isCurrentPlayerAIInternal()) setTimeout(aiRemoveOpponentPieceEnhanced, calculateDelay(BASE_INTERNAL_AI_REMOVAL_DELAY));
    } else { switchTurn(); }
    if(gameState!=='REMOVING_PIECE' && checkWinConditions()) return;
    if(movesSinceLastMillOrCapture>=MOVES_FOR_DRAW && gameState!=='REMOVING_PIECE') {endGame(-1,"تساوی: حرکات زیاد بدون نتیجه"); return;}
    updateDrawCounterInfo(); drawBoard(); updateTurnInfo(); drawPieceReserves(); drawCapturedPiecesDisplay(); // Update reserve and captured display
}
function removeOpponentPiece(index) {
    if(!isGameActuallyStarted || board[index]===null || board[index]===turn) return;
    const removedPlayerName = board[index] === 0 ? player1NameEl.textContent : player2NameEl.textContent; // Get name of player whose piece is removed
    logMoveToHistory(`${getCurrentPlayerName()} مهره بازیکن ${removedPlayerName} را از نقطه ${index + 1} حذف کرد.`);
    const opponentPlayerIndex = board[index]; // Get the index of the player whose piece is being removed
    board[index]=null; 
    piecesOnBoard[opponentPlayerIndex]--;
    piecesLostByPlayer[opponentPlayerIndex]++; // Increment lost pieces for that player
    movesSinceLastMillOrCapture=0; lastMillIndices=[];
    if(piecesInHand[turn]===0) gameState=(piecesOnBoard[turn]<=PIECES_TO_FLY)?'FLYING':'MOVING'; else gameState='PLACING';
    if(checkWinConditions()) return; 
    switchTurn();
    updateDrawCounterInfo(); drawBoard(); updateTurnInfo(); drawPieceReserves(); drawCapturedPiecesDisplay(); // Update reserve and captured display
}
function checkMillFormation(pt, plr) {let f=false; for(const m of MILLS) if(m.includes(pt)&&m.every(i=>board[i]===plr)){lastMillIndices=m;f=true;break;} return f;}
function isPieceInAnyMill(pt, plr) {if(board[pt]!==plr)return false; return MILLS.some(m=>m.includes(pt)&&m.every(i=>board[i]===plr));}
function areAllOpponentPiecesInMills(opp) {let c=0; for(let i=0;i<board.length;i++)if(board[i]===opp){c++;if(!isPieceInAnyMill(i,opp))return false;} return c>0&&c===piecesOnBoard[opp];}

function switchTurn() {
    if (!isGameActuallyStarted || gameState === 'GAME_OVER') return;
    turn = 1 - turn; selectedPieceIndex = -1; 
    if (gameState !== 'REMOVING_PIECE') lastMillIndices = [];
    clearLastMoveHighlight(); 
    if (piecesInHand[turn] === 0) gameState = (piecesOnBoard[turn] <= PIECES_TO_FLY) ? 'FLYING' : 'MOVING';
    else gameState = 'PLACING';
    updateTurnInfo(); drawBoard(); 
    if (gameState !== 'PLACING' && !playerHasMoves(turn)) { endGame(1 - turn, `${getCurrentPlayerName()} حرکتی ندارد`); return; }
    if (gameState === 'GAME_OVER') return; // بررسی مجدد پس از playerHasMoves
    console.log(`SwitchTurn: New turn for player ${turn + 1} (${getCurrentPlayerName()}). GameState: ${gameState}`); // Log turn switch
    if (gameState !== 'REMOVING_PIECE') { // فقط اگر در حال حذف نیستیم، AI بعدی را فراخوانی کن
        if (isCurrentPlayerStudentAI()) {
            console.log("SwitchTurn: Invoking Student AI for move.");
            setTimeout(() => invokeStudentAIForMove(turn), calculateDelay(BASE_STUDENT_AI_MOVE_DELAY));
        } else if (isCurrentPlayerAIInternal()) {
            console.log("SwitchTurn: Invoking Internal AI for move.");
            setTimeout(aiMove, calculateDelay(BASE_INTERNAL_AI_MOVE_DELAY));
        }
    }
}
function checkWinConditions() {
    if(gameState==='GAME_OVER')return false;
    for(let p of [0,1]){ const opp=1-p; if(piecesInHand[opp]===0 && piecesOnBoard[opp]<3 && piecesOnBoard[opp]>=0){endGame(p,`${p===0?player1NameEl.textContent:player2NameEl.textContent} برد، ${opp===0?player1NameEl.textContent:player2NameEl.textContent} کمتر از ۳ مهره دارد.`); return true;}}
    return false;
}
function playerHasMoves(plr) {
    if(piecesInHand[plr]>0)return true; if(piecesOnBoard[plr]===0)return false;
    const phase=(piecesOnBoard[plr]<=PIECES_TO_FLY)?'FLYING':'MOVING';
    for(let i=0;i<board.length;i++)if(board[i]===plr){if(phase==='FLYING'){for(let j=0;j<board.length;j++)if(board[j]===null)return true;}else{for(const adj of ADJACENCY_MAP[i])if(board[adj]===null)return true;}}
    return false;
}
function endGame(winner, reason) {
    if (gameState === 'GAME_OVER') return; // Simplified condition
    isGameActuallyStarted = false; gameState = 'GAME_OVER'; let msg;

    // Increment score for the winner of the round and update display
    if (winner === 0 || winner === 1) {
        scores[winner]++;
        updateScores(); // Update the scoreboard UI
    }

    if(winner===-1){msg=`تساوی! ${reason}`;}
    else{ const winnerName = winner===0?player1NameEl.textContent:player2NameEl.textContent; msg=`${winnerName} برد! ${reason}`;}    
    winnerTextEl.textContent = msg;
    winnerModalEl.show(); 
    updateTurnInfo();lastMillIndices=[];drawBoard();drawCounterInfoEl.style.display='none';
    startGameUserBtn.disabled=false; 
    if(openResetModalBtn) openResetModalBtn.disabled=false; 
    if(openHistoryModalBtn) openHistoryModalBtn.disabled=false; 
}

function updateRoundDisplay() {
    if (totalRoundsInSeries > 1 && currentRoundNumber > 0 && currentRoundNumber <= totalRoundsInSeries) {
        roundInfoDisplayEl.textContent = `دور ${currentRoundNumber} از ${totalRoundsInSeries}`;
        roundInfoDisplayEl.style.display = 'block';
    } else {
        roundInfoDisplayEl.style.display = 'none';
    }
}

function initializeNewRoundState() {
    board.fill(null);piecesInHand=[MAX_PIECES_TO_PLACE,MAX_PIECES_TO_PLACE];piecesOnBoard=[0,0];turn=0;
    selectedPieceIndex=-1;lastMillIndices=[];movesSinceLastMillOrCapture=0;
    clearLastMoveHighlight();isGameActuallyStarted=false;
    currentRoundMoveHistory = [];
    piecesLostByPlayer = [0, 0]; // Reset lost pieces count
    if (historyListDisplayEl) { 
        historyListDisplayEl.innerHTML = '<li class="list-group-item">تاریخچه‌ای برای نمایش وجود ندارد.</li>'; 
    }
    if(openHistoryModalBtn) openHistoryModalBtn.disabled = true;
    updateRoundDisplay(); // Update display based on current/total rounds
    drawPieceReserves(); 
    drawCapturedPiecesDisplay(); // Clear/update captured display
}
function setupUIForGameMode() {
    const isSVS = gameMode==='student_vs_student'; const isSVIA = gameMode==='student_vs_internal_ai'; const isSM = isSVS||isSVIA;
    studentAIUploadContainer.style.display = isSM ? 'block' : 'none';
    if(isSVS){ player1NameEl.textContent=teamName0Input.value.trim()||studentTeamNames[0]; player2NameEl.textContent=teamName1Input.value.trim()||studentTeamNames[1];
        studentAI0InputGroup.style.display='block'; studentAI1InputGroup.style.display='block';
        player1Title.textContent=`تیم ۱ (${playerColors[0]})`; player2Title.textContent=`تیم ۲ (${playerColors[1]})`;
        [teamName0Input,studentAIFile0,loadAI0Btn,teamName1Input,studentAIFile1,loadAI1Btn].forEach(el=>el.disabled=false);
        aiDifficultySelect.disabled=true;}
    else if(isSVIA){ player1NameEl.textContent=teamName0Input.value.trim()||studentTeamNames[0]; player2NameEl.textContent=`هوش داخلی (${aiDifficultySelect.options[aiDifficultySelect.selectedIndex].text})`;
        studentAI0InputGroup.style.display='block'; studentAI1InputGroup.style.display='none';
        player1Title.textContent=`تیم دانشجو (${playerColors[0]})`;
        [teamName0Input,studentAIFile0,loadAI0Btn].forEach(el=>el.disabled=false); aiDifficultySelect.disabled=false;}
    else{ aiDifficultySelect.disabled=(gameMode==='human');
          if(gameMode==='ai_vs_ai'){player1NameEl.textContent=`هوش داخلی ۱ (${aiDifficultySelect.options[aiDifficultySelect.selectedIndex].text})`; player2NameEl.textContent=`هوش داخلی ۲ (${aiDifficultySelect.options[aiDifficultySelect.selectedIndex].text})`;}
          else if(gameMode==='ai'){player1NameEl.textContent="بازیکن (انسان)"; player2NameEl.textContent=`هوش داخلی (${aiDifficultySelect.options[aiDifficultySelect.selectedIndex].text})`;}
          else{player1NameEl.textContent="بازیکن ۱"; player2NameEl.textContent="بازیکن ۲";}}
    updateStartButtonStatus();
    if(openHistoryModalBtn) openHistoryModalBtn.disabled=!isGameActuallyStarted;
    drawPieceReserves(); // Update reserves if colors changed things
    drawCapturedPiecesDisplay(); // Initial call for captured display
}
function updateStartButtonStatus() {
    let canStart=true;
    if(gameMode==='student_vs_student'&&(!studentAICode[0]||!studentAICode[1]))canStart=false;
    else if(gameMode==='student_vs_internal_ai'&&!studentAICode[0])canStart=false;
    startGameUserBtn.disabled=!canStart||isGameActuallyStarted; 
    if(openResetModalBtn) openResetModalBtn.disabled=!isGameActuallyStarted; 
    if(openHistoryModalBtn) openHistoryModalBtn.disabled=!isGameActuallyStarted;
}
function startGameUserControl(calledFromTournament=false) { // parameter calledFromTournament will be unused
    if (currentRoundNumber === 0 && totalRoundsInSeries > 0) { // Starting a new series fresh
        currentRoundNumber = 1;
    }

    if (currentRoundNumber > totalRoundsInSeries) {
        // This case should ideally be handled by the end-of-series logic, 
        // but as a safeguard:
        showMessage("تمام دورهای این سری بازی شده است. لطفاً سری جدید را شروع کنید.", "warning");
        if(openResetModalBtn) openResetModalBtn.disabled = false; // Allow starting new series
        return; 
    }

    if(isGameActuallyStarted && !confirm("بازی در جریان است. شروع مجدد این دور؟")) return; 
    initializeNewRoundState(); isGameActuallyStarted=true; gameState='PLACING';
    setupUIForGameMode(); // Removed conditional logic for calledFromTournament
    drawBoard();updateTurnInfo();updateDrawCounterInfo();gameMessageEl.style.display='none';
    console.log(`StartGame: Player ${turn + 1} (${getCurrentPlayerName()}) starts. GameState: ${gameState}`); // Log game start
    if(turn===0 && gameState==='PLACING'){
        if(isCurrentPlayerStudentAI()){
            console.log("StartGame: Invoking Student AI for initial move (Player 0).");
            if(studentAICode[0])setTimeout(()=>invokeStudentAIForMove(0),calculateDelay(BASE_STUDENT_AI_MOVE_DELAY));else console.error("هوش دانشجوی اول بارگذاری نشده!");}
        else if(isCurrentPlayerAIInternal()){
            console.log("StartGame: Invoking Internal AI for initial move (Player 0).");
            setTimeout(aiMove,calculateDelay(BASE_INTERNAL_AI_MOVE_DELAY));}}
    updateStartButtonStatus();
    updateRoundDisplay(); // Ensure round display is updated when a round starts
}
function restartCurrentGame(calledFromTournament=false) { // parameter calledFromTournament will be unused
    // This function now just re-initializes for the *current* round number if called mid-game.
    // Or prepares for the first round if currentRoundNumber is 0 or 1.
    initializeNewRoundState(); gameState='NOT_STARTED';
    setupUIForGameMode(); drawBoard(); updateTurnInfo(); updateDrawCounterInfo(); updateStartButtonStatus();
    updateRoundDisplay();
}
function startNewGameSeries() {
    scores=[0,0];updateScores(); 
    currentRoundNumber = 0; // Reset for a new series counting
    // totalRoundsInSeries is already set from settings, or defaults to 1
    studentAICode=[null,null];ai0Status.textContent='';ai1Status.textContent='';
    studentAIFile0.value='';studentAIFile1.value='';teamName0Input.value='';teamName1Input.value='';
    restartCurrentGame(false);
}

function loadStudentAI(playerIndex, codeString, teamName) {
    const statusEl = playerIndex === 0 ? ai0Status : ai1Status;
    try {
        const studentFuncWrapper = new Function( 'board_state', 'current_player_index', 'game_phase', 'my_pieces_in_hand', 'my_pieces_on_board', 'opponent_pieces_on_board', 'adjacency_map', 'mills_configs', codeString + '\nif(typeof getStudentDecision !== "function") throw new Error(" تابع getStudentDecision یافت نشد."); return getStudentDecision;');
        const aiFunc = studentFuncWrapper();
        if (typeof aiFunc !== 'function') throw new Error("فایل باید تابع getStudentDecision را برگرداند.");
        studentAICode[playerIndex] = aiFunc; studentTeamNames[playerIndex] = teamName || `دانشجوی ${playerIndex + 1}`;
        if(playerIndex === 0) teamName0Input.value = studentTeamNames[playerIndex]; else teamName1Input.value = studentTeamNames[playerIndex];
        statusEl.textContent = `هوش "${studentTeamNames[playerIndex]}" بارگذاری شد ✔️`; statusEl.className = 'ms-2 small text-success';
        updateStartButtonStatus();
    } catch (error) { studentAICode[playerIndex] = null; statusEl.textContent = `خطا: ${error.message}`; statusEl.className = 'ms-2 small text-danger'; console.error(`Error loading AI for player ${playerIndex + 1}:`, error); updateStartButtonStatus(); }
}
async function invokeStudentAIForMove(playerIndex) {
    console.log(`invokeStudentAIForMove: Called for player ${playerIndex + 1}. Current turn: ${turn + 1}. GameState: ${gameState}`);
    if (!isGameActuallyStarted || gameState==='GAME_OVER' || !studentAICode[playerIndex] || turn!==playerIndex) {
        console.warn(`invokeStudentAIForMove: Aborted. isGameStarted: ${isGameActuallyStarted}, gameState: ${gameState}, studentAICode: ${!!studentAICode[playerIndex]}, turnOK: ${turn===playerIndex}`);
        return;
    }
    if (gameState==='REMOVING_PIECE'){console.log("invokeStudentAIForMove: gameState is REMOVING_PIECE, calling invokeStudentAIForRemoval."); await invokeStudentAIForRemoval(playerIndex); return;}
    showMessage(`${getCurrentPlayerName()} در حال فکر کردن برای ${getPhaseDisplayName(gameState)}...`, "light");
    try {
        const snapshot={board:[...board],piecesInHand:[...piecesInHand],piecesOnBoard:[...piecesOnBoard]}; const oppIdx=1-playerIndex;
        const adjMapCopy=JSON.parse(JSON.stringify(ADJACENCY_MAP)); const millsCopy=JSON.parse(JSON.stringify(MILLS));
        const aiPromise=new Promise((res,rej)=>{try{const d=studentAICode[playerIndex](snapshot.board,playerIndex,gameState,snapshot.piecesInHand[playerIndex],snapshot.piecesOnBoard[playerIndex],snapshot.piecesOnBoard[oppIdx],adjMapCopy,millsCopy);res(d);}catch(e){rej(e);}});
        const timeoutPromise=new Promise((_,rej)=>setTimeout(()=>rej(new Error("Timeout!")),AI_MOVE_TIMEOUT));
        const decision=await Promise.race([aiPromise,timeoutPromise]); gameMessageEl.style.display='none';
        if(!decision||decision.action===undefined)throw new Error("پاسخ نامعتبر.");
        console.log(`invokeStudentAIForMove: Player ${playerIndex + 1} decision:`, decision); // Log AI decision
        if(gameState==='PLACING'){if(decision.action==='place'&&typeof decision.at==='number'&&board[decision.at]===null&&piecesInHand[playerIndex]>0)placePiece(decision.at);else throw new Error(`حرکت قرار دادن نامعتبر: ${JSON.stringify(decision)}`);}
        else if(gameState==='MOVING'||gameState==='FLYING'){if(decision.action==='move'&&typeof decision.from==='number'&&typeof decision.to==='number'&&board[decision.from]===playerIndex&&board[decision.to]===null){const phase=(piecesInHand[playerIndex]===0&&piecesOnBoard[playerIndex]<=PIECES_TO_FLY)?'FLYING':'MOVING';const valid=(phase==='FLYING')||(phase==='MOVING'&&ADJACENCY_MAP[decision.from].includes(decision.to));if(valid)movePiece(decision.from,decision.to);else throw new Error(`حرکت جابجایی منطقاً نامعتبر: ${JSON.stringify(decision)}`);}else throw new Error(`حرکت جابجایی نامعتبر: ${JSON.stringify(decision)}`);}
        else throw new Error(`وضعیت نامشخص (${gameState})`);
    }catch(err){gameMessageEl.style.display='none';showMessage(`خطا از ${getCurrentPlayerName()}: ${err.message}`,"danger");endGame(1-playerIndex,`خطا/حرکت نامعتبر از ${getCurrentPlayerName()}`);
        console.error(`invokeStudentAIForMove: Error for player ${playerIndex + 1}`, err); // Prominent error log
    }
}
async function invokeStudentAIForRemoval(playerIndex) {
    console.log(`invokeStudentAIForRemoval: Called for player ${playerIndex + 1}. Current turn: ${turn + 1}. GameState: ${gameState}`);
    if (!isGameActuallyStarted || gameState!=='REMOVING_PIECE' || !studentAICode[playerIndex] || turn!==playerIndex) {
        console.warn(`invokeStudentAIForRemoval: Aborted. isGameStarted: ${isGameActuallyStarted}, gameState: ${gameState}, studentAICode: ${!!studentAICode[playerIndex]}, turnOK: ${turn===playerIndex}`);
        return;
    }
    showMessage(`${getCurrentPlayerName()} در حال انتخاب برای حذف...`, "light");
    try {
        const snapshot={board:[...board],piecesInHand:[...piecesInHand],piecesOnBoard:[...piecesOnBoard]}; const oppIdx=1-playerIndex;
        const adjMapCopy=JSON.parse(JSON.stringify(ADJACENCY_MAP)); const millsCopy=JSON.parse(JSON.stringify(MILLS));
        const aiPromise=new Promise((res,rej)=>{try{const d=studentAICode[playerIndex](snapshot.board,playerIndex,'REMOVING_PIECE',snapshot.piecesInHand[playerIndex],snapshot.piecesOnBoard[playerIndex],snapshot.piecesOnBoard[oppIdx],adjMapCopy,millsCopy);res(d);}catch(e){rej(e);}});
        const timeoutPromise=new Promise((_,rej)=>setTimeout(()=>rej(new Error("Timeout!")),AI_MOVE_TIMEOUT));
        const decision=await Promise.race([aiPromise,timeoutPromise]); gameMessageEl.style.display='none';
        if(!decision||decision.action!=='remove'||typeof decision.removeAt!=='number')throw new Error(`پاسخ نامعتبر برای حذف: ${JSON.stringify(decision)}`);
        console.log(`invokeStudentAIForRemoval: Player ${playerIndex + 1} decision:`, decision); // Log AI decision
        const removeIdx=decision.removeAt;
        if(board[removeIdx]===oppIdx&&(!isPieceInAnyMill(removeIdx,oppIdx)||areAllOpponentPiecesInMills(oppIdx)))removeOpponentPiece(removeIdx);
        else throw new Error(`انتخاب نامعتبر برای حذف: ${removeIdx}`);
    }catch(err){gameMessageEl.style.display='none';showMessage(`خطا از ${getCurrentPlayerName()} هنگام حذف: ${err.message}`,"danger");endGame(1-playerIndex,`خطا/انتخاب نامعتبر برای حذف از ${getCurrentPlayerName()}`);
        console.error(`invokeStudentAIForRemoval: Error for player ${playerIndex + 1}`, err); // Prominent error log
    }
}

// --- Internal AI Logic ---
function getPotentialMills(player, currentGameStateForEval) {
    // console.log(`getPotentialMills for player ${player} in state ${currentGameStateForEval}`);
    const potentials = []; 
    // Check for placing a piece to form a mill
    if (piecesInHand[player] > 0 && currentGameStateForEval === 'PLACING') {
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = player; // Temporarily place piece
                if (checkMillFormation(i, player)) {
                    potentials.push({ type: (player === turn ? 'form_mill_place' : 'block_mill_place'), at: i });
                }
                board[i] = null; // Revert
            }
        }
    }
    // Check for moving a piece to form a mill
    const playerPiecesIndices = [];
    for(let i=0; i<board.length; i++) if(board[i] === player) playerPiecesIndices.push(i);
    const phaseForPlayer = (piecesInHand[player] === 0 && piecesOnBoard[player] <= PIECES_TO_FLY) ? 'FLYING' : 'MOVING';

    if (currentGameStateForEval === 'MOVING' || currentGameStateForEval === 'FLYING') { // Only for AI's own move evaluation or blocking opponent's move
        for (const pieceIdx of playerPiecesIndices) {
            const possibleNextMoves = (phaseForPlayer === 'FLYING') ?
                                      board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                                      ADJACENCY_MAP[pieceIdx].filter(adj => board[adj] === null);
            for (const moveIdx of possibleNextMoves) {
                board[moveIdx] = player;    // Temporarily move
                board[pieceIdx] = null;
                if (checkMillFormation(moveIdx, player)) {
                     potentials.push({ type: (player === turn ? 'form_mill_move' : 'block_mill_move'), at: moveIdx, moveFrom: pieceIdx });
                }
                board[moveIdx] = null;    // Revert move
                board[pieceIdx] = player;
            }
        }
    }
    return potentials;
}

function aiMove() {
    console.log(`aiMove: Called. Current turn: ${turn + 1} (${getCurrentPlayerName()}). GameState: ${gameState}`); // Log AI move entry
    if (!isGameActuallyStarted || gameState === 'GAME_OVER' || !isCurrentPlayerAIInternal() || gameState === 'REMOVING_PIECE') {
        console.warn(`aiMove: Aborted. isGameStarted: ${isGameActuallyStarted}, gameState: ${gameState}, isInternalAI: ${isCurrentPlayerAIInternal()}, isRemoving: ${gameState === 'REMOVING_PIECE'}`);
        return;
    }
    showMessage(`هوش داخلی (${getCurrentPlayerName()}) سطح ${aiDifficultySelect.options[aiDifficultySelect.selectedIndex].text} در حال فکر کردن...`, "light");
    const currentPhaseForAI = (piecesInHand[turn] === 0) ? ((piecesOnBoard[turn] <= PIECES_TO_FLY) ? 'FLYING' : 'MOVING') : 'PLACING';
    // Short delay to ensure message is shown and to simulate thinking, then make the move.
    setTimeout(() => {
        if (!isGameActuallyStarted || gameState === 'GAME_OVER' || !isCurrentPlayerAIInternal() || gameState === 'REMOVING_PIECE' || turn !== (isCurrentPlayerAIInternal() ? turn : -1) ) return; // Re-check critical conditions before executing
        if (currentPhaseForAI === 'PLACING') {
            aiPlacePieceEnhanced();
        } else if (currentPhaseForAI === 'MOVING' || currentPhaseForAI === 'FLYING') {
            aiMovePieceEnhanced(currentPhaseForAI);
        }
        gameMessageEl.style.display = 'none'; // Clear thinking message
    }, 50); // Reduced base delay, actual delay managed by calculateDelay wrapper already for first call
}

function aiPlacePieceEnhanced() {
    console.log("aiPlacePieceEnhanced: Executing."); // Log specific AI action
    const opponent = 1 - turn;
    // 1. Win: Can I place a piece to make a mill?
    let formMillMoves = getPotentialMills(turn, 'PLACING').filter(m => m.type === 'form_mill_place');
    if (formMillMoves.length > 0) {
        placePiece(formMillMoves[0].at); return;
    }
    // 2. Block: Can opponent make a mill next turn by placing? If so, block it.
    let blockMillMoves = getPotentialMills(opponent, 'PLACING'); // Opponent is placing
    if (blockMillMoves.length > 0) {
        placePiece(blockMillMoves[0].at); return;
    }

    // Difficulty-based strategies
    if (aiDifficultyLevel === 'easy') {
        // Easy: Randomly place in any empty spot
        const emptySpots = board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);
        if (emptySpots.length > 0) placePiece(emptySpots[Math.floor(Math.random() * emptySpots.length)]);
        return;
    }

    if (aiDifficultyLevel === 'medium' || aiDifficultyLevel === 'hard') {
        // 3. Setup: Place to create a two-in-a-row for next mill
        const myPairSpots = findPotentialPairSpots(board, turn); // Finds spots that would make a 2-in-a-row for AI
        if (myPairSpots.length > 0) {
            placePiece(myPairSpots[Math.floor(Math.random() * myPairSpots.length)]); return;
        }
        if (aiDifficultyLevel === 'hard') {
            // 4. Hard: Block opponent's 2-in-a-row setup
            const opponentPairSpots = findPotentialPairSpots(board, opponent);
            if (opponentPairSpots.length > 0) {
                placePiece(opponentPairSpots[Math.floor(Math.random() * opponentPairSpots.length)]); return;
            }
        }
    }
    // Default/Fallback: Randomly place in any empty spot (also for medium if no pair spot)
    const emptySpots = board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);
    if (emptySpots.length > 0) placePiece(emptySpots[Math.floor(Math.random() * emptySpots.length)]);
}

function findPotentialPairSpots(currentBoard, player) {
    // console.log(`findPotentialPairSpots for player ${player}`); // Can be too verbose, uncomment if needed
    const pairSpots = [];
    for (let i = 0; i < currentBoard.length; i++) {
        if (currentBoard[i] === null) { // If I place a piece at i
            for (const mill of MILLS) {
                if (mill.includes(i)) {
                    const otherPointsInMill = mill.filter(p => p !== i);
                    // Check if one of the other points is mine, and the third is empty
                    const p1 = currentBoard[otherPointsInMill[0]];
                    const p2 = currentBoard[otherPointsInMill[1]];
                    if ((p1 === player && p2 === null) || (p2 === player && p1 === null)) {
                        pairSpots.push(i); // Placing at i would create a pair for this mill line
                    }
                }
            }
        }
    }
    return [...new Set(pairSpots)]; // Remove duplicates
}

function aiMovePieceEnhanced(currentPhaseForAI) {
    console.log(`aiMovePieceEnhanced: Executing for phase ${currentPhaseForAI}.`); // Log specific AI action
    const opponent = 1 - turn;

    // 1. Win: Can I move a piece to make a mill?
    let formMillMoves = getPotentialMills(turn, currentPhaseForAI).filter(m => m.type === 'form_mill_move');
    if (formMillMoves.length > 0) {
        movePiece(formMillMoves[0].moveFrom, formMillMoves[0].at); return;
    }

    // 2. Block: Can opponent make a mill by moving? Block the target spot if possible.
    //    This needs to evaluate opponent's potential moves.
    const opponentPhase = (piecesInHand[opponent] === 0) ? ((piecesOnBoard[opponent] <= PIECES_TO_FLY) ? 'FLYING' : 'MOVING') : 'PLACING';
    let blockMillMoves = getPotentialMills(opponent, opponentPhase).filter(m => m.type === 'form_mill_move' || m.type === 'block_mill_move'); // opponent is moving
    if (blockMillMoves.length > 0 && blockMillMoves[0].type === 'form_mill_move') { // Opponent can form a mill by moving
        const blockAt = blockMillMoves[0].at; // This is the spot opponent wants to move TO
        const aiPieces = []; for(let i=0; i<board.length; i++) if(board[i] === turn) aiPieces.push(i);
        // Find if any of AI's pieces can move to 'blockAt'
        for (const aiPiece of aiPieces) {
            const canAiMoveToBlock = (currentPhaseForAI === 'FLYING') ? (board[blockAt] === null) :
                                     (ADJACENCY_MAP[aiPiece].includes(blockAt) && board[blockAt] === null);
            if (canAiMoveToBlock) {
                movePiece(aiPiece, blockAt); return;
            }
        }
    }

    if (aiDifficultyLevel === 'easy') {
        // Easy: Random valid move
    } else if (aiDifficultyLevel === 'medium' || aiDifficultyLevel === 'hard') {
        // 3. Setup: Move to create a two-in-a-row for the AI
        const myCurrentPieces = []; for(let i=0; i<board.length; i++) if(board[i] === turn) myCurrentPieces.push(i);
        const myPairMoves = findMovesToCreatePair(board, turn, myCurrentPieces, currentPhaseForAI); 
        if (myPairMoves.length > 0) {
            const move = myPairMoves[Math.floor(Math.random() * myPairMoves.length)];
            movePiece(move.from, move.to); return;
        }
        if (aiDifficultyLevel === 'hard') {
            // 4. Hard: Proactively block opponent's attempt to create a pair (more complex)
            // This can be a simplified version: if opponent has a piece that is one move away from forming a pair for THEM,
            // and we can move to one of the spots involved in THAT pair (either the piece's current spot or the target empty spot),
            // it might be a good defensive move. For now, this is complex and omitted for brevity.
        }
    }

    // Default/Fallback: Make any valid random move
    const myPieces = []; for(let i=0; i<board.length; i++) if(board[i] === turn) myPieces.push(i);
    const movablePieces = []; // Stores {from, to}
    for (const pieceIdx of myPieces) {
        const possibleMoves = (currentPhaseForAI === 'FLYING') ?
                              board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                              ADJACENCY_MAP[pieceIdx].filter(adj => board[adj] === null);
        if (possibleMoves.length > 0) {
            movablePieces.push({ from: pieceIdx, to: possibleMoves[Math.floor(Math.random() * possibleMoves.length)] });
        }
    }
    if (movablePieces.length > 0) {
        const randomMove = movablePieces[Math.floor(Math.random() * movablePieces.length)];
        movePiece(randomMove.from, randomMove.to);
    } else if(!playerHasMoves(turn) && gameState !== 'GAME_OVER') {
        // This should ideally be caught by playerHasMoves in switchTurn, but as a safeguard:
        endGame(1-turn, `${getCurrentPlayerName()} حرکتی ندارد`);
    }
}

function findMovesToCreatePair(currentBoard, player, playerPiecesIndices, playerPhase) {
    // console.log(`findMovesToCreatePair for player ${player}, phase ${playerPhase}`); // Can be too verbose
    const pairMoves = []; // Stores {from, to}
    for (const pieceIdx of playerPiecesIndices) {
        // What spots can pieceIdx move to?
        const possibleMoves = (playerPhase === 'FLYING') ?
                              currentBoard.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                              ADJACENCY_MAP[pieceIdx].filter(adj => currentBoard[adj] === null);

        for (const moveTo of possibleMoves) {
            // If I move pieceIdx to moveTo, will it form a pair?
            let testBoard = [...currentBoard];
            testBoard[moveTo] = player;
            testBoard[pieceIdx] = null; // Original spot is now empty

            // Check if spot moveTo is now part of a potential mill (a 2-in-a-row)
            for (const mill of MILLS) {
                if (mill.includes(moveTo)) {
                    const otherPointsInMill = mill.filter(p => p !== moveTo);
                    if (otherPointsInMill.length === 2) { // Should always be true
                        const p1_val = testBoard[otherPointsInMill[0]];
                        const p2_val = testBoard[otherPointsInMill[1]];
                        // If one is player and other is null, moving to moveTo created a pair
                        if ((p1_val === player && p2_val === null) || (p2_val === player && p1_val === null)) {
                        if (!pairMoves.some(m => m.from === pieceIdx && m.to === moveTo)) {
                           pairMoves.push({ from: pieceIdx, to: moveTo });
                            }
                            break; // Found a pair for this moveTo, no need to check other mills for this moveTo
                        }
                    }
                }
            }
        }
    }
    return pairMoves;
}

function aiRemoveOpponentPieceEnhanced() {
    console.log("aiRemoveOpponentPieceEnhanced: Executing."); // Log specific AI action
    if (gameState !== 'REMOVING_PIECE' || !isCurrentPlayerAIInternal()) return;
    const opponent = 1 - turn;
    let piecesToRemove = [];
    const allOpponentInMills = areAllOpponentPiecesInMills(opponent);

    // Strategy: Prioritize breaking opponent's potential next mill if hard/medium
    if (aiDifficultyLevel === 'medium' || aiDifficultyLevel === 'hard') {
        if (aiDifficultyLevel === 'hard') {
            const opponentPiecesIndices = [];
            for(let i=0; i<board.length; i++) if(board[i] === opponent) opponentPiecesIndices.push(i);

            for (const oppPieceIdx of opponentPiecesIndices) {
                if (allOpponentInMills || !isPieceInAnyMill(oppPieceIdx, opponent)) {
                    for (const mill of MILLS) {
                        if (mill.includes(oppPieceIdx)) {
                            const others = mill.filter(p => p !== oppPieceIdx);
                            if (board[others[0]] === opponent && board[others[1]] === null && (allOpponentInMills || !isPieceInAnyMill(others[0], opponent))) {
                                piecesToRemove.push(oppPieceIdx); piecesToRemove.push(others[0]); break;
                            } else if (board[others[1]] === opponent && board[others[0]] === null && (allOpponentInMills || !isPieceInAnyMill(others[1], opponent))){
                                piecesToRemove.push(oppPieceIdx); piecesToRemove.push(others[1]); break;
                            }
                        }
                    }
                }
                if(piecesToRemove.length > 0) break; 
            }
            if (piecesToRemove.length > 0) {
                let pieceToActuallyRemove = piecesToRemove.find(p => p === board[piecesToRemove[0]] ? p : piecesToRemove[1]); 
                if (board[pieceToActuallyRemove] === opponent && (allOpponentInMills || !isPieceInAnyMill(pieceToActuallyRemove, opponent))) {
                     removeOpponentPiece(pieceToActuallyRemove); return;
                }
            } 
             piecesToRemove = []; 
        }
    }

    for (let i = 0; i < board.length; i++) {
        if (board[i] === opponent && (allOpponentInMills || !isPieceInAnyMill(i, opponent))) {
            piecesToRemove.push(i);
        }
    }

    if (piecesToRemove.length > 0) {
        removeOpponentPiece(piecesToRemove[Math.floor(Math.random() * piecesToRemove.length)]);
    } else {
        const allOpponentPiecesCurrent = [];
        for(let i=0; i<board.length; i++) if(board[i] === opponent) allOpponentPiecesCurrent.push(i);
        if(allOpponentPiecesCurrent.length > 0){
             removeOpponentPiece(allOpponentPiecesCurrent[Math.floor(Math.random() * allOpponentPiecesCurrent.length)]);
        } else {
            const nextState = (piecesInHand[turn] === 0 && piecesOnBoard[turn] <= PIECES_TO_FLY) ? 'FLYING' : ((piecesInHand[turn] === 0) ? 'MOVING' : 'PLACING');
            gameState = nextState;
            switchTurn();
        }
    }
}


// --- Event Listeners ---
gameModeSelect.addEventListener('change', (e) => {
    gameMode = e.target.value; 
    setupUIForGameMode();
    initializeNewRoundState(); 
    drawBoard(); updateTurnInfo(); 
    updateStartButtonStatus();
});
aiDifficultySelect.addEventListener('change', (e) => {
    aiDifficultyLevel = e.target.value;
    setupUIForGameMode(); 
    showMessage(`سطح دشواری هوش داخلی به "${e.target.options[e.target.selectedIndex].text}" تغییر کرد.`, 'info');
});
gameSpeedInput.addEventListener('input', (e) => {
    gameSpeedMultiplier = parseFloat(e.target.value);
    if (gameSpeedMultiplier <= 0.01) gameSpeedLabel.textContent = "خیلی سریع";
    else gameSpeedLabel.textContent = `${gameSpeedMultiplier.toFixed(2)} برابر`;
});
player1ColorInput.addEventListener('input', (e) => { playerColors[0] = e.target.value; drawBoard(); });
player2ColorInput.addEventListener('input', (e) => { playerColors[1] = e.target.value; drawBoard(); });

startGameUserBtn.addEventListener('click', () => startGameUserControl(false));
startNewRoundBtn.addEventListener('click', () => { 
    winnerModalEl.hide(); 
    currentRoundNumber++; // Increment round number

    if (currentRoundNumber <= totalRoundsInSeries) {
        // Proceed to the next round of the current series
        showMessage(`دور ${currentRoundNumber} از ${totalRoundsInSeries} شروع می‌شود...`, 'info', 2000); // Show for 2s
        setTimeout(() => { 
            startGameUserControl(); 
        }, 500); // Short delay before starting next round to allow message to be seen
    } else {
        // Series is over
        let seriesWinnerMsg;
        const player1CurrentName = player1NameEl.textContent;
        const player2CurrentName = player2NameEl.textContent;

        if (scores[0] > scores[1]) {
            seriesWinnerMsg = `${player1CurrentName} سری را با نتیجه ${scores[0]} به ${scores[1]} برد!`;
        } else if (scores[1] > scores[0]) {
            seriesWinnerMsg = `${player2CurrentName} سری را با نتیجه ${scores[1]} به ${scores[0]} برد!`;
        } else {
            seriesWinnerMsg = `سری با نتیجه ${scores[0]} به ${scores[0]} مساوی شد!`;
        }
        
        // Display series end message (e.g., in the turn info or game message area)
        // For simplicity, we can use showMessage or update turnInfoEl directly.
        // Let's use showMessage for consistency, it will persist until next action.
        showMessage(seriesWinnerMsg, "success");
        turnInfoEl.textContent = "سری تمام شد. برای بازی جدید، از تنظیمات اقدام کنید یا سری جدید شروع کنید.";
        roundInfoDisplayEl.style.display = 'none'; // Hide round counter as series is over
        
        // Update button states: Disable start game, enable reset modal to start new series.
        if(startGameUserBtn) startGameUserBtn.disabled = true;
        if(openResetModalBtn) openResetModalBtn.disabled = false;
        if(openHistoryModalBtn) openHistoryModalBtn.disabled = true; // History is per round, new series will clear it.
        isGameActuallyStarted = false; // Mark game as not active until a new series/round starts explicitly
    }
});
loadAI0Btn.addEventListener('click', () => {
    const file = studentAIFile0.files[0]; const teamName = teamName0Input.value.trim() || "دانشجوی ۱";
    if (file) { const reader = new FileReader(); reader.onload = (e) => loadStudentAI(0, e.target.result, teamName); reader.readAsText(file); }
    else { ai0Status.textContent = "فایلی انتخاب نشده"; ai0Status.className = 'ms-2 small text-warning';}
});
loadAI1Btn.addEventListener('click', () => {
    const file = studentAIFile1.files[0]; const teamName = teamName1Input.value.trim() || "دانشجوی ۲";
    if (file) { const reader = new FileReader(); reader.onload = (e) => loadStudentAI(1, e.target.result, teamName); reader.readAsText(file); }
    else { ai1Status.textContent = "فایلی انتخاب نشده"; ai1Status.className = 'ms-2 small text-warning';}
});

// Add event listener for the new settings button
if (settingsModalBtn) {
    settingsModalBtn.addEventListener('click', () => {
        console.log("Settings button clicked"); // DEBUG
        if (gameSettingsModal) {
            gameSettingsModal.show();
        } else {
            console.error("gameSettingsModal instance not found!"); // DEBUG
        }
    });
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
        // Apply the selected settings
        gameMode = gameModeSelect.value;
        aiDifficultyLevel = aiDifficultySelect.value; // Make sure this global var is updated
        playerColors[0] = player1ColorInput.value;
        playerColors[1] = player2ColorInput.value;

        // If student AI modes are active, potentially update team names from inputs
        if (gameMode === 'student_vs_student' || gameMode === 'student_vs_internal_ai') {
            studentTeamNames[0] = teamName0Input.value.trim() || "تیم ۱"; // Default if empty
            if (gameMode === 'student_vs_student') {
                studentTeamNames[1] = teamName1Input.value.trim() || "تیم ۲"; // Default if empty
            }
        }

        setupUIForGameMode(); // This will update player names, AI settings display, etc.
        updateStartButtonStatus(); // Crucial to enable/disable start button based on new settings
        drawBoard(); // Reflect color changes immediately

        if (gameSettingsModal) {
            gameSettingsModal.hide();
        }
        // Update totalRoundsInSeries from input
        let newTotalRounds = parseInt(numRoundsInputEl.value, 10);
        if (isNaN(newTotalRounds) || newTotalRounds < 1) newTotalRounds = 1;
        if (newTotalRounds > 10) newTotalRounds = 10; // Max 10 rounds
        numRoundsInputEl.value = newTotalRounds; // Reflect cleaned value in input
        totalRoundsInSeries = newTotalRounds;
        
        // If a game was in progress and settings are changed mid-series,
        // it might be complex. For now, changing number of rounds applies best to a new series.
        // We could reset currentRoundNumber here if settings are saved, to force a new series start.
        // Or, leave it, and startGameUserControl will handle if currentRound > newTotalRounds.
        // Let's reset currentRoundNumber if totalRoundsInSeries changes, to signify a new series logic.
        // This assumes saving settings with a new round count implies wanting to start that setup fresh.
        currentRoundNumber = 0; // Reset to start fresh with new round count setting
        updateRoundDisplay(); // Update display based on new total rounds (will likely hide it as currentRound is 0)
        drawPieceReserves(); // Update reserves if colors changed things
        drawCapturedPiecesDisplay(); // Clear/update captured display

        showMessage("تنظیمات ذخیره و اعمال شد.", "success");
        updateScoreboardColors(); // Call to update colors when settings are saved
    });
}

// Event Listeners for Reset Modal
if (confirmResetRoundBtn) {
    confirmResetRoundBtn.addEventListener('click', () => {
        console.log("Confirm Reset Round button clicked"); // DEBUG
        restartCurrentGame(false);
        if (resetOptionsModalInstance) {
            resetOptionsModalInstance.hide();
        } else {
            console.error("resetOptionsModalInstance not found!"); // DEBUG
        }
    });
}
if (confirmNewSeriesBtn) {
    confirmNewSeriesBtn.addEventListener('click', () => {
        console.log("Confirm New Series button clicked"); // DEBUG
        startNewGameSeries();
        if (resetOptionsModalInstance) {
            resetOptionsModalInstance.hide();
        } else {
            console.error("resetOptionsModalInstance not found!"); // DEBUG
        }
    });
}

// Event Listener for History Modal
if (openHistoryModalBtn) {
    openHistoryModalBtn.addEventListener('click', () => {
        console.log("Open History Modal button clicked"); // DEBUG
        console.log("History array at display time:", currentRoundMoveHistory); // DEBUG
        if (historyListDisplayEl && moveHistoryModalInstance) {
            if (currentRoundMoveHistory.length === 0) {
                historyListDisplayEl.innerHTML = '<li class="list-group-item">تاریخچه‌ای برای نمایش وجود ندارد.</li>';
            } else {
                historyListDisplayEl.innerHTML = ''; // Clear previous
                currentRoundMoveHistory.forEach(move => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = move;
                    historyListDisplayEl.appendChild(li);
                });
            }
            moveHistoryModalInstance.show();
        }
    });
}

// --- Initial Setup ---
window.onload = () => {
    // Initialize the settings modal instance
    if (gameSettingsModalEl) {
        gameSettingsModal = new bootstrap.Modal(gameSettingsModalEl);
    }
    // Initialize new modals
    if (resetOptionsModalEl) {
        resetOptionsModalInstance = new bootstrap.Modal(resetOptionsModalEl);
    }
    if (moveHistoryModalEl) {
        moveHistoryModalInstance = new bootstrap.Modal(moveHistoryModalEl);
    }

    totalRoundsInSeries = parseInt(numRoundsInputEl.value, 10) || 1; // Initialize from default HTML value
    if (totalRoundsInSeries < 1) totalRoundsInSeries = 1;
    if (totalRoundsInSeries > 10) totalRoundsInSeries = 10;
    numRoundsInputEl.value = totalRoundsInSeries;

    gameMode = gameModeSelect.value; 
    aiDifficultyLevel = aiDifficultySelect.value;
    gameSpeedMultiplier = parseFloat(gameSpeedInput.value);
    gameSpeedLabel.textContent = `${gameSpeedMultiplier.toFixed(2)} برابر`;
    
    initializeNewRoundState(); 
    setupUIForGameMode(); 
    updateScores(); 
    drawBoard(); 
    updateTurnInfo(); 
    updateStartButtonStatus();
    updateRoundDisplay(); // Initial call to set/hide round display
    updateScoreboardColors(); // Initial call to set scoreboard colors
    drawPieceReserves(); // Initial call to draw reserves
    drawCapturedPiecesDisplay(); // Initial call for captured display
    // renderTournamentTeams(); // Removed call
};