// نام فایل پیشنهادی: defender_ai.js
function getStudentDecision(board, currentPlayerIndex, gameState, myPiecesInHand, myPiecesOnBoard, opponentPiecesOnBoard, adjacencyMap, millsConfigs) {
  const opponentPlayerIndex = 1 - currentPlayerIndex;

  // --- توابع کمکی مشابه هوش مصنوعی ۱ ---
  function checkMillFormationAfterAction(tempBoard, actionPoint, player) {
    for (const mill of millsConfigs) {
      if (mill.includes(actionPoint) && mill.every(idx => tempBoard[idx] === player)) {
        return true;
      }
    }
    return false;
  }
  function isPieceInMill(tempBoard, pieceIndex, player) {
    if (tempBoard[pieceIndex] !== player) return false;
    for (const mill of millsConfigs) {
      if (mill.includes(pieceIndex) && mill.every(idx => tempBoard[idx] === player)) {
        return true;
      }
    }
    return false;
  }
   function areAllOpponentPiecesInMillsInternal(tempBoard, opponent) {
        let opponentPieceCount = 0;
        let opponentPiecesNotInMill = 0;
        for (let i = 0; i < tempBoard.length; i++) {
            if (tempBoard[i] === opponent) {
                opponentPieceCount++;
                if (!isPieceInMill(tempBoard, i, opponent)) {
                    opponentPiecesNotInMill++;
                }
            }
        }
        if (opponentPieceCount === 0) return false;
        return opponentPiecesNotInMill === 0;
    }

  // --- تابع کمکی برای ارزیابی "خطرناک بودن" یک نقطه برای قرار دادن مهره ---
  function getSpotSafetyScore(spotIndex, tempBoard) {
    let score = 0;
    // آیا قرار دادن مهره در اینجا، به حریف اجازه تشکیل میل در حرکت بعدی را می‌دهد؟
    // این تابع می‌تواند بسیار پیچیده‌تر شود. برای سادگی، فقط همسایه‌ها را چک می‌کنیم.
    for (const neighbor of adjacencyMap[spotIndex]) {
      if (tempBoard[neighbor] === opponentPlayerIndex) {
        score -= 1; // همسایه حریف است، ممکن است خطرناک باشد
      } else if (tempBoard[neighbor] === currentPlayerIndex) {
        score +=1; // همسایه خودی است، خوب است
      }
    }
    return score;
  }


  // -------------------------------------------
  // منطق اصلی تصمیم‌گیری
  // -------------------------------------------

  if (gameState === 'PLACING') {
    // 1. آیا می‌توانم جلوی میل حریف را بگیرم؟ (اولویت اول مدافع)
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        let tempBoard = [...board];
        tempBoard[i] = opponentPlayerIndex;
        if (checkMillFormationAfterAction(tempBoard, i, opponentPlayerIndex)) {
          return { action: 'place', at: i }; // بلاک کن
        }
      }
    }
    // 2. آیا می‌توانم با قرار دادن مهره، میل تشکیل دهم؟
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        let tempBoard = [...board];
        tempBoard[i] = currentPlayerIndex;
        if (checkMillFormationAfterAction(tempBoard, i, currentPlayerIndex)) {
          return { action: 'place', at: i };
        }
      }
    }
    // 3. یک نقطه "امن" یا با پتانسیل دفاعی انتخاب کن
    const emptySpotsWithScores = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        emptySpotsWithScores.push({ spot: i, score: getSpotSafetyScore(i, board) });
      }
    }
    if (emptySpotsWithScores.length > 0) {
      emptySpotsWithScores.sort((a, b) => b.score - a.score); // مرتب‌سازی بر اساس امتیاز امنیت (بیشترین اول)
      return { action: 'place', at: emptySpotsWithScores[0].spot };
    }
  } 
  else if (gameState === 'MOVING' || gameState === 'FLYING') {
    const myCurrentPieces = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === currentPlayerIndex) {
        myCurrentPieces.push(i);
      }
    }
    
    // 1. آیا حریف در شرف تشکیل میل است که بتوانم بلاک کنم؟
    // (این منطق مشابه منطق بلاک در هوش مصنوعی مهاجم است اما با اولویت بالاتر)
     for (const piecePos of myCurrentPieces) {
        const possibleMovesForMe = (gameState === 'FLYING') ?
                                board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                                adjacencyMap[piecePos].filter(adj => board[adj] === null);
        const opponentPieces = [];
        for(let i=0; i<board.length; i++) if(board[i] === opponentPlayerIndex) opponentPieces.push(i);
        for(const oppPiece of opponentPieces) {
            const opponentTargetPhase = 'MOVING'; // ساده‌سازی، باید فاز دقیق حریف بررسی شود
            const opponentPossibleNextMoves = (opponentTargetPhase === 'FLYING') ?
                                            board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                                            adjacencyMap[oppPiece].filter(adj => board[adj] === null);
            for (const oppMoveTo of opponentPossibleNextMoves) {
                let tempBoard = [...board];
                tempBoard[oppMoveTo] = opponentPlayerIndex; tempBoard[oppPiece] = null;
                if (checkMillFormationAfterAction(tempBoard, oppMoveTo, opponentPlayerIndex)) {
                    if (possibleMovesForMe.includes(oppMoveTo)) {
                         for (const myP of myCurrentPieces) {
                            const myMoves = (gameState === 'FLYING') ?
                                            board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                                            adjacencyMap[myP].filter(adj => board[adj] === null);
                            if (myMoves.includes(oppMoveTo)) {
                                return { action: 'move', from: myP, to: oppMoveTo }; // بلاک کن
                            }
                         }
                    }
                }
            }
        }
    }

    // 2. آیا می‌توانم با حرکت یک مهره، میل تشکیل دهم؟
    for (const piecePos of myCurrentPieces) {
      const possibleMoves = (gameState === 'FLYING') ?
                            board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                            adjacencyMap[piecePos].filter(adj => board[adj] === null);
      for (const moveTo of possibleMoves) {
        let tempBoard = [...board];
        tempBoard[moveTo] = currentPlayerIndex;
        tempBoard[piecePos] = null;
        if (checkMillFormationAfterAction(tempBoard, moveTo, currentPlayerIndex)) {
          return { action: 'move', from: piecePos, to: moveTo };
        }
      }
    }

    // 3. حرکت به یک نقطه امن‌تر یا حفظ ساختار دفاعی
    const validMovesWithScores = [];
    for (const piecePos of myCurrentPieces) {
      const possibleMoves = (gameState === 'FLYING') ?
                            board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                            adjacencyMap[piecePos].filter(adj => board[adj] === null);
      for (const moveTo of possibleMoves) {
        let tempBoard = [...board];
        tempBoard[moveTo] = currentPlayerIndex;
        tempBoard[piecePos] = null;
        validMovesWithScores.push({ from: piecePos, to: moveTo, score: getSpotSafetyScore(moveTo, tempBoard) });
      }
    }
    if (validMovesWithScores.length > 0) {
      validMovesWithScores.sort((a, b) => b.score - a.score); // امن‌ترین حرکت اول
      return { action: 'move', from: validMovesWithScores[0].from, to: validMovesWithScores[0].to };
    }
  } 
  else if (gameState === 'REMOVING_PIECE') {
    // سعی کن مهره‌ای از حریف را حذف کنی که بخشی از یک "جفت" است (پتانسیل میل)
    const opponentPieces = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === opponentPlayerIndex) {
        opponentPieces.push(i);
      }
    }
    
    const allOpponentPiecesAreInMills = areAllOpponentPiecesInMillsInternal(board, opponentPlayerIndex);
    let bestPieceToRemove = -1;
    let maxThreatScore = -1;

    for (const pieceIdx of opponentPieces) {
      if (allOpponentPiecesAreInMills || !isPieceInMill(board, pieceIdx, opponentPlayerIndex)) {
        // بررسی کن آیا این مهره بخشی از یک جفت خطرناک است
        let currentThreatScore = 0;
        for (const mill of millsConfigs) {
          if (mill.includes(pieceIdx)) {
            let opponentCountInMill = 0;
            let emptyCountInMill = 0;
            mill.forEach(p => {
              if (board[p] === opponentPlayerIndex) opponentCountInMill++;
              else if (board[p] === null) emptyCountInMill++;
            });
            if (opponentCountInMill === 2 && emptyCountInMill === 1) {
              currentThreatScore += 5; // حذف مهره‌ای که بخشی از یک جفت آماده میل است
            } else if (opponentCountInMill === 1 && emptyCountInMill === 2) {
              currentThreatScore +=1; // مهره ای که می تواند به تشکیل میل کمک کند
            }
          }
        }
        if (currentThreatScore > maxThreatScore) {
          maxThreatScore = currentThreatScore;
          bestPieceToRemove = pieceIdx;
        } else if (bestPieceToRemove === -1) { // اگر هیچ تهدیدی نیست، حداقل یک مهره قابل حذف انتخاب کن
            bestPieceToRemove = pieceIdx;
        }
      }
    }

    if (bestPieceToRemove !== -1) {
      return { action: 'remove', removeAt: bestPieceToRemove };
    }
    // اگر به دلایلی هیچ مهره قابل حذفی پیدا نشد
    for (let i = 0; i < board.length; i++) {
        if (board[i] === opponentPlayerIndex) return { action: 'remove', removeAt: i };
    }
  }

  console.error("AI مدافع محتاط نتوانست حرکتی پیدا کند!", gameState, board, currentPlayerIndex);
  return { action: 'error', message: 'مدافع محتاط حرکتی پیدا نکرد' };
}
