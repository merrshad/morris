/**
 * تابع تصمیم‌گیری پیشرفته‌تر برای هوش مصنوعی دانشجو در بازی نُه‌مرد موریس.
 */
function getStudentDecision(
    board_state,
    current_player_index,
    game_phase,
    my_pieces_in_hand,
    my_pieces_on_board,
    opponent_pieces_on_board,
    adjacency_map,
    mills_configs
) {
    const opponent_player_index = 1 - current_player_index;

    // --- توابع کمکی ---

    /**
     * بررسی می‌کند آیا یک بازیکن با قرار دادن/حرکت دادن مهره به نقطه مشخص شده، میل می‌سازد.
     * @param {Array<number|null>} board - وضعیت صفحه.
     * @param {number} point_index - اندیس نقطه‌ای که مهره در آن قرار گرفته یا به آن منتقل شده.
     * @param {number} player_idx - اندیس بازیکن.
     * @returns {boolean} - True اگر میل ساخته شود، در غیر این صورت False.
     */
    function formsAMill(board, point_index, player_idx) {
        for (const mill of mills_configs) {
            if (mill.includes(point_index) && mill.every(p => board[p] === player_idx)) {
                return true;
            }
        }
        return false;
    }

    /**
     * مهره‌های حریف که قابل حذف هستند را پیدا می‌کند.
     * (مهره‌هایی که در میل نیستند، مگر اینکه همه مهره‌های حریف در میل باشند)
     * @param {Array<number|null>} board - وضعیت صفحه.
     * @param {number} opp_idx - اندیس بازیکن حریف.
     * @returns {Array<number>} - آرایه‌ای از اندیس مهره‌های قابل حذف حریف.
     */
    function getRemovableOpponentPieces(board, opp_idx) {
        const opponent_pieces = [];
        const opponent_pieces_in_mill = [];

        for (let i = 0; i < board.length; i++) {
            if (board[i] === opp_idx) {
                if (formsAMill(board, i, opp_idx)) {
                    opponent_pieces_in_mill.push(i);
                } else {
                    opponent_pieces.push(i);
                }
            }
        }
        // اگر مهره‌ای خارج از میل وجود دارد، فقط آنها قابل حذف هستند.
        // در غیر این صورت، تمام مهره‌های حریف (که در میل هستند) قابل حذفند.
        return opponent_pieces.length > 0 ? opponent_pieces : opponent_pieces_in_mill;
    }


    // --- منطق اصلی تصمیم‌گیری ---

    if (game_phase === 'PLACING') {
        // 1. آیا می‌توانم با قرار دادن مهره، میل بسازم؟
        for (let i = 0; i < board_state.length; i++) {
            if (board_state[i] === null) {
                let temp_board = [...board_state];
                temp_board[i] = current_player_index;
                if (formsAMill(temp_board, i, current_player_index)) {
                    return { action: 'place', at: i };
                }
            }
        }

        // 2. آیا حریف می‌تواند در حرکت بعدی میل بسازد؟ اگر بله، آن نقطه را اشغال کن.
        for (let i = 0; i < board_state.length; i++) {
            if (board_state[i] === null) {
                let temp_board = [...board_state];
                temp_board[i] = opponent_player_index;
                if (formsAMill(temp_board, i, opponent_player_index)) {
                    // نقطه i برای حریف حیاتی است، آن را بگیر
                    return { action: 'place', at: i };
                }
            }
        }
        
        // 3. سعی کن مهره را در نقطه‌ای قرار دهی که به ساخت میل در آینده کمک کند
        // (این بخش می‌تواند بسیار پیچیده‌تر شود، مثلا با ارزیابی نقاط استراتژیک)
        // استراتژی ساده: اولین نقطه خالی
        for (let i = 0; i < board_state.length; i++) {
            if (board_state[i] === null) {
                return { action: 'place', at: i };
            }
        }
    } 
    else if (game_phase === 'MOVING' || game_phase === 'FLYING') {
        // 1. آیا می‌توانم با حرکت دادن مهره، میل بسازم؟
        for (let from_idx = 0; from_idx < board_state.length; from_idx++) {
            if (board_state[from_idx] === current_player_index) {
                const possible_moves = (game_phase === 'FLYING') ?
                    board_state.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                    adjacency_map[from_idx].filter(adj_idx => board_state[adj_idx] === null);

                for (const to_idx of possible_moves) {
                    let temp_board = [...board_state];
                    temp_board[to_idx] = current_player_index;
                    temp_board[from_idx] = null;
                    if (formsAMill(temp_board, to_idx, current_player_index)) {
                        return { action: 'move', from: from_idx, to: to_idx };
                    }
                }
            }
        }

        // 2. آیا حریف می‌تواند در حرکت بعدی میل بسازد؟ اگر بله، سعی کن جلوی آن را بگیری.
        //    الف) با حرکت به نقطه‌ای که او برای ساخت میل نیاز دارد.
        //    ب) با حرکت دادن مهره‌ای که او برای ساخت میل از آن استفاده می‌کند (اگر ممکن باشد و میل خودمان خراب نشود).
        for (let opp_from_idx = 0; opp_from_idx < board_state.length; opp_from_idx++) {
            if (board_state[opp_from_idx] === opponent_player_index) {
                const opp_possible_moves = (my_pieces_on_board <= 3) ? // اگر حریف هم در فاز پرواز است یا نزدیک به آن
                    board_state.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                    adjacency_map[opp_from_idx].filter(adj_idx => board_state[adj_idx] === null);

                for (const opp_to_idx of opp_possible_moves) {
                    let temp_board_opp_mill = [...board_state];
                    temp_board_opp_mill[opp_to_idx] = opponent_player_index;
                    temp_board_opp_mill[opp_from_idx] = null;
                    if (formsAMill(temp_board_opp_mill, opp_to_idx, opponent_player_index)) {
                        // حریف می‌تواند با حرکت از opp_from_idx به opp_to_idx میل بسازد.
                        // آیا ما می‌توانیم به opp_to_idx حرکت کنیم تا جلوی او را بگیریم؟
                        for (let my_from_idx = 0; my_from_idx < board_state.length; my_from_idx++) {
                            if (board_state[my_from_idx] === current_player_index) {
                                const my_blocking_moves = (game_phase === 'FLYING') ?
                                    (board_state[opp_to_idx] === null ? [opp_to_idx] : []) :
                                    adjacency_map[my_from_idx].filter(adj_idx => adj_idx === opp_to_idx && board_state[adj_idx] === null);
                                
                                if (my_blocking_moves.length > 0) {
                                    // حرکت برای بلاک کردن
                                    return { action: 'move', from: my_from_idx, to: opp_to_idx };
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. یک حرکت تصادفی معتبر انجام بده (اگر استراتژی بهتری پیدا نشد)
        let valid_moves = [];
        for (let from_idx = 0; from_idx < board_state.length; from_idx++) {
            if (board_state[from_idx] === current_player_index) {
                const possible_destinations = (game_phase === 'FLYING') ?
                    board_state.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1) :
                    adjacency_map[from_idx].filter(adj_idx => board_state[adj_idx] === null);
                
                possible_destinations.forEach(to_idx => {
                    valid_moves.push({ from: from_idx, to: to_idx });
                });
            }
        }
        if (valid_moves.length > 0) {
            const random_move = valid_moves[Math.floor(Math.random() * valid_moves.length)];
            return { action: 'move', from: random_move.from, to: random_move.to };
        }
    } 
    else if (game_phase === 'REMOVING_PIECE') {
        const removable_pieces = getRemovableOpponentPieces(board_state, opponent_player_index);
        if (removable_pieces.length > 0) {
            // استراتژی حذف:
            // 1. اگر مهره‌ای از حریف هست که با حذف آن، میل بعدی او از بین می‌رود، آن را حذف کن. (پیچیده‌تر)
            // 2. فعلا: به صورت تصادفی یکی از مهره‌های قابل حذف را انتخاب می‌کنیم.
            const random_idx_to_remove = Math.floor(Math.random() * removable_pieces.length);
            return { action: 'remove', removeAt: removable_pieces[random_idx_to_remove] };
        }
        // اگر به اینجا برسد، یعنی مشکلی در منطق getRemovableOpponentPieces یا وضعیت بازی وجود دارد.
        // به عنوان fallback، سعی می‌کنیم اولین مهره حریف را حذف کنیم.
        for(let i=0; i<board_state.length; i++) {
            if(board_state[i] === opponent_player_index) return {action: 'remove', removeAt: i};
        }
    }

    // اگر هیچ تصمیم معتبری گرفته نشد (نباید در حالت عادی رخ دهد)
    console.error("Student AI (Advanced) could not make a decision for phase:", game_phase);
    // بازگشت یک حرکت پیش‌فرض بسیار ساده برای جلوگیری از خطا در بازی (این بخش باید بهبود یابد)
    if (game_phase === 'PLACING') {
        for (let i = 0; i < board_state.length; i++) if (board_state[i] === null) return { action: 'place', at: i };
    } else if (game_phase === 'MOVING' || game_phase === 'FLYING') {
        for (let i = 0; i < board_state.length; i++) {
            if (board_state[i] === current_player_index) {
                const moves = adjacency_map[i].filter(adj => board_state[adj] === null);
                if (moves.length > 0) return { action: 'move', from: i, to: moves[0] };
                 if (game_phase === 'FLYING') { // اگر پرواز است و مجاور خالی نیست، اولین خالی را پیدا کن
                    for(let j=0; j<board_state.length; j++) if(board_state[j] === null) return {action: 'move', from: i, to: j};
                 }
            }
        }
    } else if (game_phase === 'REMOVING_PIECE') {
        for (let i = 0; i < board_state.length; i++) if (board_state[i] === opponent_player_index) return { action: 'remove', removeAt: i };
    }
    return {}; // بازگشت آبجکت خالی منجر به خطا و احتمالا باخت می‌شود.
}
