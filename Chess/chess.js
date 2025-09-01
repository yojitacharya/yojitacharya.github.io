// The functions in the following code were debugged by ChatGPT and Claude

let blockSize = 90;

let rows = 8;
let cols = 8;

let context;
let board;

let gameOver = false;

let position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
// Position is set Traditional FEN Notation (FEN)

let pieces = Array.from({ length: rows }, () => Array(cols).fill(null));
// The one (1) line above was written with the assistance of Blackbox AI

let difficulty = 0;

let move = 1;
let playerColorWhite = false;

let selectedPiece = null;
let selectedPiecePosition = null;

let validMoves = [];

let showingPromotionAlert = false;

let blackKingside = true;
let blackQueenside = true;
let whiteKingside = true;
let whiteQueenside = true;


window.onload = function() {
    board = document.getElementById("chessboard");

    board.width = cols * blockSize;
    board.height = rows * blockSize;
    context = board.getContext("2d");

    document.getElementById("reset").onclick = reset;
    
    // this was never used, but an ai is planned to be added.
    var difficulty = document.getElementById("difficulty");

    board.addEventListener("click", handleBoardClick);


    drawBoard();
    parseFEN(position);
    drawPieces();
}

function drawBoard(validMoves = [], selectedPiecePosition = null) {
    // Drawing the board
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, board.width, board.height);
    context.strokeStyle = "#000000";
    
    // Alternating between light and dark squares
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if ((i + j) % 2 == 0) {
                context.fillStyle = "#f0d4b4"; // Light square
            } else {
                context.fillStyle = "#c08464"; // Dark square
            }
            // Fill in squares
            context.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);
        }
    }
    context.strokeRect(0, 0, board.width, board.height);

    // Highlight valid moves in red
    validMoves.forEach(([row, col]) => {
        context.fillStyle = "rgba(255, 0, 0, 0.7)";
        context.fillRect(col * blockSize, row * blockSize, blockSize, blockSize);
    });

    // Highlight selected piece in orange
    if (selectedPiecePosition) {
        context.fillStyle = "#f58142";
        context.fillRect(selectedPiecePosition[1] * blockSize, selectedPiecePosition[0] * blockSize, blockSize, blockSize);
    }
}

function parseFEN(fen) {
    let ranks = fen.split(' ')[0].split('/');
    for (let i = 0; i < ranks.length; i++) {
        let rank = ranks[i];
        let fileIndex = 0;
        for (let char of rank) {
            if (isNaN(char)) {
                pieces[i][fileIndex] = char; // Set the piece
                fileIndex++;
            } else {
                fileIndex += parseInt(char); // Skip empty squares
            }
        }
    }
}


function drawPieces() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let piece = pieces[i][j];
            if (piece) {
                let pieceImg = new Image();
                if(piece == piece.toLowerCase()) {
                    pieceImg.src = "./Chess_Pieces/" + piece + piece + ".png";
                }
                else{
                    pieceImg.src = "./Chess_Pieces/" + piece + ".png";
                }

                pieceImg.onload = function() {
                    context.drawImage(pieceImg, j * blockSize, i * blockSize, blockSize, blockSize);
                }
            }
        }
    }
}

function handleBoardClick(event) {
    if (showingPromotionAlert) return; // Ignore clicks while promotion dialog is showing
    
    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / blockSize);
    const row = Math.floor(y / blockSize);

    if (selectedPiece) {
        // Attempt to move the piece
        if (isValidMove(selectedPiece, selectedPiecePosition, [row, col])) {
            if (needsPromotion(selectedPiece, [row, col])) {
                // Show promotion dialog
                showingPromotionAlert = true;
                const isWhite = selectedPiece === selectedPiece.toUpperCase();
                
                showPromotionDialog(isWhite, (promotedPiece) => {
                    // Complete the move with the promoted piece
                    pieces[row][col] = promotedPiece;
                    pieces[selectedPiecePosition[0]][selectedPiecePosition[1]] = null;

                    // Clean up
                    showingPromotionAlert = false;
                    selectedPiece = null;
                    validMoves = [];
                    
                    // Redraw and continue game
                    drawBoard();
                    drawPieces();
                    move++;
                    
                    // Check for checkmate
                    if (isCheckmate()) {
                        const winner = move % 2 === 0 ? "White" : "Black";
                        setTimeout(() => {
                            alert("Checkmate! " + winner + " wins!");
                            gameOver = true;
                        }, 500);
                    }
                });
            } else {

                // Moving the rook after castling.
                if (selectedPiece.toLowerCase() === 'k' && Math.abs(col - selectedPiecePosition[1]) === 2) {
                    // Check for castling move (rook should not have moved, and no pieces in between)
                    if (col === 6) { // Kingside
                        pieces[selectedPiecePosition[0]][5] = pieces[selectedPiecePosition[0]][7];  // Move rook to kingside
                        pieces[selectedPiecePosition[0]][7] = null;                // Clear old rook position
                    } else if (col === 2) { // Queenside
                        pieces[selectedPiecePosition[0]][3] = pieces[selectedPiecePosition[0]][0];  // Move rook to queenside
                        pieces[selectedPiecePosition[0]][0] = null;                // Clear old rook position
                    }
                }

                // Normal move without promotion
                pieces[row][col] = selectedPiece;
                pieces[selectedPiecePosition[0]][selectedPiecePosition[1]] = null;
                
                
                if(selectedPiece === "k") {
                    blackKingside = false;
                    blackQueenside = false;
                }
                else if(selectedPiece == "K") {
                    whiteKingside = false;
                    whiteQueenside = false;
                }

                selectedPiece = null;
                validMoves = [];
                drawBoard();
                drawPieces();
                move++;
                if (isCheckmate()) {
                    const winner = move % 2 === 0 ? "White" : "Black";
                    setTimeout(() => {
                        alert("Checkmate! " + winner + " wins!");
                        gameOver = true;
                    }, 500);
                }
            }
        } else {
            // Invalid move, deselect the piece
            selectedPiece = null;
            validMoves = [];
            drawBoard();
            drawPieces();
        }
    } else {
        // Select a piece   
        selectedPiece = pieces[row][col];
        selectedPiecePosition = [row, col];

        // Highlight valid moves for the selected piece
        if (selectedPiece) {
            validMoves = getValidMoves(selectedPiece, selectedPiecePosition);
            drawBoard(validMoves, selectedPiecePosition);
            drawPieces();
        }
    }
}
function getValidMoves(piece, position) {
    const validMoves = [];
    const [fromRow, fromCol] = position;
    const isKing = piece.toLowerCase() === 'k';
    const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
    const enemyColor = pieceColor === 'w' ? 'b' : 'w';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (isValidMove(piece, position, [row, col])) {
                // For kings, we already check in isValidKingMove
                if (isKing) {
                    validMoves.push([row, col]);
                } else {
                    // For other pieces, we need to verify the move doesn't put our king in check
                    const originalTargetPiece = pieces[row][col];
                    pieces[row][col] = piece;
                    pieces[fromRow][fromCol] = null;

                    // Find our king's position
                    let kingPos = null;
                    for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) {
                            if (pieces[i][j] && 
                                pieces[i][j].toLowerCase() === 'k' && 
                                ((pieceColor === 'w' && pieces[i][j] === pieces[i][j].toUpperCase()) ||
                                 (pieceColor === 'b' && pieces[i][j] === pieces[i][j].toLowerCase()))) {
                                kingPos = [i, j];
                                break;
                            }
                        }
                        if (kingPos) break;
                    }

                    // Check if our king would be in check after this move
                    const wouldPutKingInCheck = isSquareUnderAttack(enemyColor, kingPos);

                    // Undo temporary move
                    pieces[fromRow][fromCol] = piece;
                    pieces[row][col] = originalTargetPiece;

                    if (!wouldPutKingInCheck) {
                        validMoves.push([row, col]);
                    }
                }
            }
        }
    }

    return validMoves;
}



function isValidMove(piece, from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    if (!piece) return false; // No piece selected
    if (toRow < 0 || toRow >= rows || toCol < 0 || toCol >= cols) return false; // Move out of bounds

    const targetPiece = pieces[toRow][toCol];
    if(targetPiece !== null) {
        if ((targetPiece == targetPiece.toLowerCase() && piece.toLowerCase() == piece) || 
            targetPiece == targetPiece.toUpperCase() && piece.toUpperCase() == piece) {
            return false; // Can't capture your own piece
        }
    }
    
    if(piece && (move % 2 === 0 && piece === piece.toUpperCase()) || 
       (move % 2 === 1 && piece === piece.toLowerCase())) {
        return false; // Can't move if it's not your turn
    }

    // Check if the move is valid according to piece rules
    let isValidPieceMove = false;
    switch (piece.toLowerCase()) {
        case 'p':
            isValidPieceMove = isValidPawnMove(piece, from, to);
            break;
        case 'r':
            isValidPieceMove = isValidRookMove(from, to);
            break;
        case 'n':
            isValidPieceMove = isValidKnightMove(from, to);
            break;
        case 'b':
            isValidPieceMove = isValidBishopMove(from, to);
            break;
        case 'q':
            isValidPieceMove = isValidQueenMove(from, to);
            break;
        case 'k':
            isValidPieceMove = isValidKingMove(piece, from, to);
            break;
        default:
            return false;
    }

    if (!isValidPieceMove) return false;

    // If it's not a king move, check if this move would put our own king in check
    if (piece.toLowerCase() !== 'k') {
        // Make temporary move
        const originalTargetPiece = pieces[toRow][toCol];
        pieces[toRow][toCol] = piece;
        pieces[fromRow][fromCol] = null;

        // Find our king's position
        const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
        const enemyColor = pieceColor === 'w' ? 'b' : 'w';
        let kingPos = null;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (pieces[i][j] && 
                    pieces[i][j].toLowerCase() === 'k' && 
                    ((pieceColor === 'w' && pieces[i][j] === pieces[i][j].toUpperCase()) ||
                     (pieceColor === 'b' && pieces[i][j] === pieces[i][j].toLowerCase()))) {
                    kingPos = [i, j];
                    break;
                }
            }
            if (kingPos) break;
        }

        // Check if our king would be in check after this move
        const wouldPutKingInCheck = isSquareUnderAttack(enemyColor, kingPos);

        // Undo temporary move
        pieces[fromRow][fromCol] = piece;
        pieces[toRow][toCol] = originalTargetPiece;

        if (wouldPutKingInCheck) {
            return false;
        }
    }

    return true;
}

// Pawn move validation
function isValidPawnMove(piece, from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    const direction = (piece === 'p' ? 1 : -1);
    
    // Normal move (one square forward)
    if (toCol === fromCol && pieces[toRow][toCol] === null) {
        if (toRow === fromRow + direction) {
                if(toRow === (piece === 'p' ? 8 : 1)){
                    
                }
            return true; // Move forward one square
        }
        // First move can be two squares
        if (fromRow === (piece === 'p' ? 1 : 6) && toRow === fromRow + 2 * direction) {
            return pieces[fromRow + direction][fromCol] === null; // Ensure the square in front is empty
        }
    }

    // Capture
    if ((Math.abs(toCol - fromCol) == 1) && toRow == (fromRow + direction) && pieces[toRow][toCol]!== null) {
        const targetPiece = pieces[toRow][toCol];
        return true; // Ensure there's an opponent's piece
    }
    return false; // Invalid move
}

// Rook move validation
function isValidRookMove(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    if (fromRow !== toRow && fromCol !== toCol) return false; // Must move in a straight line

    // Check for obstacles
    const stepRow = (toRow - fromRow) === 0 ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const stepCol = (toCol - fromCol) === 0 ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    let currentRow = fromRow + stepRow;
    let currentCol = fromCol + stepCol;

    while (currentRow !== toRow || currentCol !== toCol) {
        if (pieces[currentRow][currentCol] !== null) return false; // Obstacle found
        currentRow += stepRow;
        currentCol += stepCol;
    }
    if(currentCol === 7 || 0 && currentRow === 7 || 0) {
        if (currentRow === 0) {
            if(currentCol === 7) blackKingside = false;
            else blackQueenside = false;
        }
        else {
            if(currentCol === 7) whiteKingside = false;
            else whiteQueenside = false;
        }
    }
    return true;
}

// Knight move validation
function isValidKnightMove(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Bishop move validation
function isValidBishopMove(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    // Must move diagonally
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;

    // Check for obstacles
    const stepRow = (toRow - fromRow) > 0 ? 1 : -1; // Moving down or up
    const stepCol = (toCol - fromCol) > 0 ? 1 : -1; // Moving right or left
    let currentRow = fromRow + stepRow;
    let currentCol = fromCol + stepCol;

    // Move along the diagonal and check if there are any pieces blocking the way
    while (currentRow !== toRow && currentCol !== toCol) {
        if (pieces[currentRow][currentCol] !== null) {
            return false; // An obstacle is found
        }
        currentRow += stepRow;
        currentCol += stepCol;
    }

    return true; // No obstacles found
}

// Queen move validation
function isValidQueenMove(from, to) {
    return isValidRookMove(from, to) || isValidBishopMove(from, to); // Queen can move like, both, rooks, and bishops
}

// King move validation
function isValidKingMove(piece, from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    const kingColor = piece === piece.toUpperCase() ? 'w' : 'b';
    const enemyColor = kingColor === 'w' ? 'b' : 'w';

    if (rowDiff > 1 || colDiff > 1) {
        if (rowDiff === 0 && colDiff === 2) {
            let stepCol = (toCol - fromCol) === 0 ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
            let currentCol = fromCol + stepCol;
    
            // Check squares between start and end for being under attack
            while (currentCol !== toCol) {
                if (isSquareUnderAttack(enemyColor, [toRow, currentCol])) {
                    return false; // A square in the path is under attack, move is invalid
                }
                currentCol += stepCol;
            }
            
            if ((toCol === 6 && toRow === 7 && whiteKingside) || 
                (toCol === 2 && toRow === 7 && whiteQueenside) ||
                (toCol === 6 && toRow === 0 && blackKingside) ||
                (toCol === 2 && toRow === 0 && blackQueenside)) {
                
            }
            else {
                return false;
            }
        }
        else return false;
    }
    

    // Make temporary move
    const originalTargetPiece = pieces[toRow][toCol];
    pieces[toRow][toCol] = piece;
    pieces[fromRow][fromCol] = null;

    // Check if the new position would put the king in check
    const wouldBeInCheck = isSquareUnderAttack(enemyColor, [toRow, toCol]);

    // Undo temporary move
    pieces[fromRow][fromCol] = piece;
    pieces[toRow][toCol] = originalTargetPiece;

    return !wouldBeInCheck;
}
function isSquareUnderAttack(attackingColor, square) {
    const [targetRow, targetCol] = square;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let piece = pieces[row][col];
            // Skip empty squares and pieces of wrong color
            if (!piece) continue;
            
            // Check if this is an attacking piece of the right color
            if ((attackingColor === 'b' && piece === piece.toLowerCase()) || 
                (attackingColor === 'w' && piece === piece.toUpperCase())) {
                
                // Create a temporary version of isValidMove that doesn't recurse
                let from = [row, col];
                let to = [targetRow, targetCol];
                
                // Check piece movement without considering check
                switch (piece.toLowerCase()) {
                    case 'p':
                        if (isValidPawnMove(piece, from, to)) return true;
                        break;
                    case 'r':
                        if (isValidRookMove(from, to)) return true;
                        break;
                    case 'n':
                        if (isValidKnightMove(from, to)) return true;
                        break;
                    case 'b':
                        if (isValidBishopMove(from, to)) return true;
                        break;
                    case 'q':
                        if (isValidQueenMove(from, to)) return true;
                        break;
                    case 'k':
                        // For king attacks, just check one square distance
                        const rowDiff = Math.abs(targetRow - row);
                        const colDiff = Math.abs(targetCol - col);
                        if (rowDiff <= 1 && colDiff <= 1) return true;
                        break;
                }
            }
        }
    }
    return false;
}
function isSquareDefended(color, square) {
    const [targetRow, targetCol] = square;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const piece = pieces[row][col];
            if (piece && ((color === 'b' && piece === piece.toLowerCase()) || 
                           (color === 'w' && piece === piece.toUpperCase()))) {
                const fromPosition = [row, col];
                if (isValidMove(piece, fromPosition, square)) {
                    return true; // The square is defended
                }
            }
        }
    }

    return false; // The square is not defended
}

function isCheckmate() {
    // Find the king that's currently being checked
    const isWhiteTurn = move % 2 === 1;
    const kingToFind = isWhiteTurn ? 'K' : 'k';
    let kingPos = null;

    // Find the current player's king position
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (pieces[row][col] === kingToFind) {
                kingPos = [row, col];
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return false;

    // Check if king is in check
    const enemyColor = isWhiteTurn ? 'b' : 'w';
    if (!isSquareUnderAttack(enemyColor, kingPos)) {
        return false;
    }

    // Try every possible move for the current player's pieces
    for (let fromRow = 0; fromRow < rows; fromRow++) {
        for (let fromCol = 0; fromCol < cols; fromCol++) {
            const piece = pieces[fromRow][fromCol];
            
            if (!piece || (isWhiteTurn && piece === piece.toLowerCase()) || 
                (!isWhiteTurn && piece === piece.toUpperCase())) {
                continue;
            }

            for (let toRow = 0; toRow < rows; toRow++) {
                for (let toCol = 0; toCol < cols; toCol++) {
                    if (isValidMove(piece, [fromRow, fromCol], [toRow, toCol])) {
                        // Make temporary move
                        const originalTargetPiece = pieces[toRow][toCol];
                        pieces[toRow][toCol] = piece;
                        pieces[fromRow][fromCol] = null;

                        // Find new king position (it might have moved)
                        let newKingPos = piece.toLowerCase() === 'k' ? [toRow, toCol] : kingPos;

                        // Check if king is still in check after this move
                        const stillInCheck = isSquareUnderAttack(enemyColor, newKingPos);

                        // Undo temporary move
                        pieces[fromRow][fromCol] = piece;
                        pieces[toRow][toCol] = originalTargetPiece;

                        // If we found any move that gets us out of check, it's not checkmate
                        if (!stillInCheck) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    // If we haven't found any valid moves, it's checkmate
    return true;
}

// This function has all the css stuff that displays the promotion dialog
function showPromotionDialog(isWhite, callback) {
    const pieces = ['q', 'r', 'b', 'n'];

    // Create dialog container (this dialog container was created with the assistanc of Claude AI)
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '0';
    dialog.style.left = '0';
    dialog.style.right = '0';
    dialog.style.bottom = '0';
    dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    
    // Create dialog content
    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.padding = '15px';
    content.style.borderRadius = '8px';
    content.style.textAlign = 'center';
    
    const title = document.createElement('h2');
    title.textContent = 'Choose promotion piece:';
    title.style.marginBottom = '10px';
    content.appendChild(title);
    
    // Create piece buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';
    
    pieces.forEach(piece => {
        const button = document.createElement('button');
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.border = '1px solid #ccc';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        const img = new Image();
        img.src = `./Chess_Pieces/${isWhite ? piece.toUpperCase() : piece + piece}.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        button.appendChild(img);
        button.onclick = () => {
            callback(isWhite ? piece.toUpperCase() : piece);
            document.body.removeChild(dialog);
        };
        
        buttonContainer.appendChild(button);
    });
    
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

function needsPromotion(piece, position) {
    const [row, col] = position;
    return piece.toLowerCase() === 'p' && (row === 0 || row === 7);
}

function canCastle(color, position) {
    const [row, col] = position;
    if (color === 'w') {
        return (col === 4 && pieces[row][0] === null && pieces[row][1] === null && pieces[row][2] === null && pieces[row][3] === 'R') &&
            isSquareDefended('w', [row, 1]) && isSquareDefended('w', [row, 2]);
    } else {
        return (col === 4 && pieces[row][7] === null && pieces[row][6] === null && pieces[row][5] === null && pieces[row][4] === 'r') &&
            isSquareDefended('b', [row, 5]) && isSquareDefended('b', [row, 6]);
    }
}

function reset() {
    location.reload();
}
