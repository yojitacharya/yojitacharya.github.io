document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameBoard = document.getElementById('game-board');
    const blocksContainer = document.getElementById('blocks-container');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    
    // Game settings
    const BOARD_SIZE = 9;
    let score = 0;
    let bestScore = localStorage.getItem('blockBlastBestScore') || 0;
    let gameBoard2D = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    let isGameOver = false;
    let selectedBlock = null;
    let floatingBlock = null;
    let comboLevel = 1;
    let turnsSinceLastClear = 0;
    
    // Block colors (vibrant palette)
    const blockColors = [
        '#FF5252', // Red
        '#FF9800', // Orange
        '#FFEB3B', // Yellow
        '#4CAF50', // Green
        '#2196F3', // Blue
        '#673AB7', // Purple
        '#E91E63', // Pink
        '#00BCD4', // Cyan
        '#009688', // Teal
        '#8BC34A'  // Light Green
    ];
    
    // Block shapes (each is a 2D array representing the shape)
    const blockShapes = [
        // Single block
        [[1]],
        
        // 2-block shapes
        [[1, 1]],
        [[1], [1]],
        [[1, 0], [0, 1]],
        
        // 3-block shapes
        [[1, 1, 1]],
        [[1], [1], [1]],
        [[1, 1], [1, 0]],
        [[1, 1], [0, 1]],
        [[1, 0], [1, 1]],
        [[0, 1], [1, 1]],
        
        // 4-block shapes
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
        [[1, 1], [1, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    ];
    
    // Initialize the game
    function initGame() {
        createBoard();
        updateBestScore();
        generateBlockOptions();
        
        // Add event listener for restart button
        restartBtn.addEventListener('click', restartGame);
        
        // Add event listeners for tracking mouse movement
        document.addEventListener('mousemove', handleMouseMove);
        
        // Add event listener for game board clicks
        gameBoard.addEventListener('click', handleBoardClick);
        
        // Add resize handler
        window.addEventListener('resize', resizeBoard);
        window.addEventListener('orientationchange', resizeBoard);
        
        // Initial board sizing
        resizeBoard();
    }
    
    // Create the game board
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                gameBoard.appendChild(cell);
            }
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score} (Combo: ${comboLevel})`;
    }

    // Resize board based on viewport
    function resizeBoard() {
        const containerWidth = Math.min(window.innerWidth - 20, 500);
        const cellSize = Math.floor((containerWidth - 20) / BOARD_SIZE - 3);
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
        });
        
        // Adjust block options size
        const blockCellSize = window.innerHeight < 700 ? 15 : 20;
        document.querySelectorAll('.block-cell').forEach(cell => {
            cell.style.width = `${blockCellSize}px`;
            cell.style.height = `${blockCellSize}px`;
        });
    }
    
    // Generate new block options
    function generateBlockOptions() {
        blocksContainer.innerHTML = '';
        
        // Generate 3 random blocks
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * blockShapes.length);
            const blockShape = blockShapes[randomIndex];
            const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];
            
            createBlockOption(blockShape, i, randomColor);
        }
    }
    
    // Create a block option element
    function createBlockOption(shape, index, color) {
        const blockOption = document.createElement('div');
        blockOption.classList.add('block-option');
        blockOption.dataset.index = index;
        
        // Determine grid dimensions based on shape
        const rows = shape.length;
        const cols = Math.max(...shape.map(row => row.length));
        
        blockOption.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        blockOption.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        // Create cells for the block
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (shape[row] && shape[row][col]) {
                    const blockCell = document.createElement('div');
                    blockCell.classList.add('block-cell');
                    blockCell.style.backgroundColor = color;
                    blockOption.appendChild(blockCell);
                } else {
                    const emptyCell = document.createElement('div');
                    emptyCell.style.visibility = 'hidden';
                    blockOption.appendChild(emptyCell);
                }
            }
        }
        
        // Store the shape data and color on the element
        blockOption.dataset.shape = JSON.stringify(shape);
        blockOption.dataset.color = color;
        
        // Add click event for selection
        blockOption.addEventListener('click', selectBlock);
        
        blocksContainer.appendChild(blockOption);
    }
    
    // Handle block selection (first click)
    function selectBlock(e) {
        if (isGameOver) return;
        e.stopPropagation(); // Prevent triggering board click
        
        // If there's already a floating block, cancel it first
        if (floatingBlock) {
            cancelBlockPlacement();
        }
        
        const blockOption = e.currentTarget;
        
        // Create a floating block that follows the cursor, passing the event
        createFloatingBlock(blockOption, e);
        
        // Show to the user that a block is selected
        document.body.classList.add('block-selected');
    }
    
 // Create a floating block that follows the cursor
 function createFloatingBlock(blockOption, event) {
    // Create a clone for floating
    const clone = blockOption.cloneNode(true);
    clone.classList.add('floating-block');
    clone.style.position = 'absolute';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none'; // Allow clicks to pass through
    document.body.appendChild(clone);
    
    // Calculate cell size ratio between block option and game board
    const boardCellElement = document.querySelector('.cell');
    const blockCellElement = clone.querySelector('.block-cell');
    const boardCellSize = boardCellElement.getBoundingClientRect().width;
    const blockCellSize = blockCellElement.getBoundingClientRect().width;
    const scaleRatio = boardCellSize / blockCellSize;
    
    // Calculate the click offset within the block
    const blockRect = blockOption.getBoundingClientRect();
    const offsetX = event.clientX - blockRect.left;
    const offsetY = event.clientY - blockRect.top;
    
    // Apply scaling to match board cell size
    clone.style.transform = `scale(${scaleRatio})`;
    clone.style.transformOrigin = 'top left';
    
    // Store the original block information
    floatingBlock = {
        element: clone,
        originalElement: blockOption,
        shape: JSON.parse(blockOption.dataset.shape),
        color: blockOption.dataset.color,
        index: blockOption.dataset.index,
        scaleRatio: scaleRatio,
        offsetX: offsetX,
        offsetY: offsetY
    };
    
    // Initially hide the original block
    blockOption.style.opacity = '0.4';
    
    // Position the floating block at the mouse cursor (initial placement)
    positionFloatingBlock(event.clientX, event.clientY);
}
function handleMouseMove(e) {
    if (floatingBlock) {
        positionFloatingBlock(e.clientX, e.clientY);
    }
}
// Position the floating block at cursor with snapping behavior
function positionFloatingBlock(x, y) {
    if (!floatingBlock) return;
    
    const blockElement = floatingBlock.element;
    const offsetX = floatingBlock.offsetX || 0;
    const offsetY = floatingBlock.offsetY || 0;
    
    // Check if we're over the board for snapping
    const boardRect = gameBoard.getBoundingClientRect();
    
    if (x >= boardRect.left && x <= boardRect.right && 
        y >= boardRect.top && y <= boardRect.bottom) {
        
        // We're over the board, implement snapping
        const cellWidth = boardRect.width / BOARD_SIZE;
        const cellHeight = boardRect.height / BOARD_SIZE;
        
        // Calculate the cell row and column
        const boardX = x - boardRect.left;
        const boardY = y - boardRect.top;
        
        const col = Math.floor(boardX / cellWidth);
        const row = Math.floor(boardY / cellHeight);
        
        // Get the shape dimensions
        const shape = floatingBlock.shape;
        const shapeHeight = shape.length;
        const shapeWidth = Math.max(...shape.map(row => row.length));
        
        // Center the shape on the cursor
        const startRow = Math.max(0, Math.min(BOARD_SIZE - shapeHeight, row - Math.floor(shapeHeight / 2)));
        const startCol = Math.max(0, Math.min(BOARD_SIZE - shapeWidth, col - Math.floor(shapeWidth / 2)));
        
        // Calculate the snap position in pixels
        const snapX = boardRect.left + (startCol * cellWidth);
        const snapY = boardRect.top + (startRow * cellHeight);
        
        // Position at the snapped location
        blockElement.style.left = `${snapX}px`;
        blockElement.style.top = `${snapY}px`;
        
        // Check if placement is valid and highlight cells
        const canPlace = canPlaceBlock(shape, startRow, startCol);
        
        // Update highlights
        clearHighlights();
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const targetRow = startRow + r;
                    const targetCol = startCol + c;
                    
                    if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
                        const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
                        if (cell) {
                            cell.classList.add(canPlace ? 'highlight' : 'invalid');
                        }
                    }
                }
            }
        }
        
        // Store the current valid placement position
        if (canPlace) {
            floatingBlock.validPlacement = { row: startRow, col: startCol };
        } else {
            floatingBlock.validPlacement = null;
        }
    } else {
        // Not over board, follow cursor normally
        blockElement.style.left = `${x - offsetX}px`;
        blockElement.style.top = `${y - offsetY}px`;
        clearHighlights();
        floatingBlock.validPlacement = null;
    }
}
// Update board cell highlights based on current position
function updateBoardHighlightAtPosition(startRow, startCol) {
    // Clear all highlights
    clearHighlights();
    
    if (!floatingBlock) return;
    
    // Get the shape
    const shape = floatingBlock.shape;
    
    // Check if placement is valid
    const canPlace = canPlaceBlock(shape, startRow, startCol);
    
    // Highlight the cells
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                
                if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
                    const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
                    if (cell) {
                        cell.classList.add(canPlace ? 'highlight' : 'invalid');
                    }
                }
            }
        }
    }
}
    
    // Handle board click (for block placement)
    function handleBoardClick(e) {
        if (isGameOver || !floatingBlock) return;
        
        if (floatingBlock.validPlacement) {
            const { row, col } = floatingBlock.validPlacement;
            placeBlockAndCleanup(row, col);
        } else {
            // Click outside valid area cancels placement
            cancelBlockPlacement();
        }
    }
    // Place block and clean up floating elements
function placeBlockAndCleanup(startRow, startCol) {
    if (!floatingBlock) return;
    
    const shape = floatingBlock.shape;
    const index = floatingBlock.index;
    const color = floatingBlock.color;
    
    // Place the block
    if (placeBlock(shape, startRow, startCol, index, color)) {
        // Remove floating block
        floatingBlock.element.remove();
        
        // Remove original block option
        floatingBlock.originalElement.remove();
        
        // Reset state
        floatingBlock = null;
        document.body.classList.remove('block-selected');
        
        // Clear highlights
        clearHighlights();
        
        // Check for filled lines
        checkForFilledLines();
        
        // Check if we need to generate new blocks
        const remainingBlocks = document.querySelectorAll('.block-option').length;
        if (remainingBlocks === 0) {
            generateBlockOptions();
            
            // Only check for game over after generating new blocks
            if (!canPlaceAnyBlock()) {
                gameOver();
            }
        } else {
            // If we still have blocks, check if any can be placed
            if (!canPlaceAnyBlock()) {
                gameOver();
            }
        }
    }
}
    
    // Cancel block placement
    function cancelBlockPlacement() {
        if (!floatingBlock) return;
        
        // Remove floating block
        floatingBlock.element.remove();
        
        // Restore original block
        floatingBlock.originalElement.style.opacity = '1';
        
        // Reset state
        floatingBlock = null;
        document.body.classList.remove('block-selected');
        
        // Clear highlights
        clearHighlights();
    }
    
    // Clear all highlights from the board
    function clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight');
            cell.classList.remove('invalid');
        });
    }
    
    // Helper to get mouse position
    function getMousePosition() {
        const e = window.event;
        if (!e) return null;
        
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    // Check if a block can be placed at the specified position
    function canPlaceBlock(shape, startRow, startCol) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardRow = startRow + row;
                    const boardCol = startCol + col;
                    
                    // Check if position is within board boundaries
                    if (boardRow < 0 || boardRow >= BOARD_SIZE || boardCol < 0 || boardCol >= BOARD_SIZE) {
                        return false;
                    }
                    
                    // Check if cell is already occupied
                    if (gameBoard2D[boardRow][boardCol] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    // Place a block on the board
    function placeBlock(shape, startRow, startCol, blockIndex, color) {
        if (!canPlaceBlock(shape, startRow, startCol)) {
            return false;
        }
        
        // Place the block on the board
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardRow = startRow + row;
                    const boardCol = startCol + col;
                    
                    // Update the data model
                    gameBoard2D[boardRow][boardCol] = 1;
                    
                    // Update the visual board
                    const cell = document.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    const block = document.createElement('div');
                    block.classList.add('block', 'placed');
                    block.style.backgroundColor = color;
                    cell.appendChild(block);
                }
            }
        }
        
        // Add points for placing the block
        const blockSize = shape.flat().filter(cell => cell === 1).length;
        addScore(blockSize);
        
        // Check if we need to generate new blocks
        if (document.querySelectorAll('.block-option').length === 0) {
            generateBlockOptions();
        }
        turnsSinceLastClear++;
        return true;
    }
    
    // Check for filled rows and columns
    function checkForFilledLines() {
        const filledRows = [];
        const filledCols = [];
        
        // Check rows
        for (let row = 0; row < BOARD_SIZE; row++) {
            let rowFilled = true;
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (gameBoard2D[row][col] === 0) {
                    rowFilled = false;
                    break;
                }
            }
            if (rowFilled) {
                filledRows.push(row);
            }
        }
        
        // Check columns
        for (let col = 0; col < BOARD_SIZE; col++) {
            let colFilled = true;
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (gameBoard2D[row][col] === 0) {
                    colFilled = false;
                    break;
                }
            }
            if (colFilled) {
                filledCols.push(col);
            }
        }
        
        // Clear filled rows and columns
        if (filledRows.length > 0 || filledCols.length > 0) {
            const linesCleared = filledRows.length + filledCols.length;
            let comboMultiplier = 1;

            if (turnsSinceLastClear <= 4 && turnsSinceLastClear > 0) {
                comboLevel++;
                comboMultiplier = comboLevel;
                // Consider adding visual feedback for combo increase here
                console.log(`Combo increased to ${comboLevel}!`);
            } else {
                comboLevel = 1;
            }

            clearLines(filledRows, filledCols);

            // Award points with combo multiplier
            const basePoints = linesCleared * BOARD_SIZE * 10; // Adjust base points as needed
            addScore(basePoints * comboMultiplier);

            // Reset turn counter after clearing lines
            turnsSinceLastClear = 0;
            updateScoreDisplay();
        } else if (turnsSinceLastClear > 4) {
            // Reset combo if no lines cleared within the turn limit
            comboLevel = 1;
            updateScoreDisplay();
        }
    }
    
    // Clear filled rows and columns
    function clearLines(rows, cols) {
        const clearedCells = new Set();
        
        // Mark cells to be cleared in the data model
        rows.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                gameBoard2D[row][col] = 0;
                clearedCells.add(`${row},${col}`);
            }
        });
        
        cols.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                gameBoard2D[row][col] = 0;
                clearedCells.add(`${row},${col}`);
            }
        });
        
        // Create clearing animation for blocks
        clearedCells.forEach(cellKey => {
            const [row, col] = cellKey.split(',').map(Number);
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            const block = cell.querySelector('.block');
            
            if (block) {
                // Add sparkles
                createSparkles(block);
                
                // Add clearing animation
                block.classList.add('cleared');
                
                // Remove block after animation
                setTimeout(() => {
                    block.remove();
                }, 300);
            }
        });
    }
    function selectBlock(e) {
        if (isGameOver) return;
        e.stopPropagation(); // Prevent triggering board click
        
        // If there's already a floating block, cancel it first
        if (floatingBlock) {
            cancelBlockPlacement();
        }
        
        const blockOption = e.currentTarget;
        
        // Create a floating block that follows the cursor
        createFloatingBlock(blockOption, e);
        
        // Show to the user that a block is selected
        document.body.classList.add('block-selected');
    }
    // Create sparkle effect when blocks are cleared
    function createSparkles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const color = element.style.backgroundColor;
        
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');
            
            const size = Math.random() * 6 + 2;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 10;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            sparkle.style.backgroundColor = color;
            
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                sparkle.remove();
            }, 800);
        }
    }
    
    // Check if any block can be placed on the board
    function canPlaceAnyBlock() {
        const remainingBlocks = document.querySelectorAll('.block-option');
        
        for (const blockOption of remainingBlocks) {
            const shape = JSON.parse(blockOption.dataset.shape);
            
            // Check all possible positions on the board
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    if (canPlaceBlock(shape, row, col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Add score
    function addScore(points) {
        score += points;
        updateScoreDisplay();

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('blockBlastBestScore', bestScore);
            updateBestScore();
        }
    }
    
    // Update best score display
    function updateBestScore() {
        bestScoreDisplay.textContent = `Best: ${bestScore}`;
    }
    
    // Game over
    function gameOver() {
        isGameOver = true;
        finalScoreDisplay.textContent = `Score: ${score}`;
        gameOverScreen.style.display = 'flex';
    }
    
    // Restart game
    function restartGame() {
        // Reset game state
        score = 0;
        gameBoard2D = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        isGameOver = false;
        
        // If there's a floating block, remove it
        if (floatingBlock) {
            floatingBlock.element.remove();
            floatingBlock = null;
        }
        
        // Update UI
        scoreDisplay.textContent = `Score: 0`;
        gameOverScreen.style.display = 'none';
        document.body.classList.remove('block-selected');
        
        comboLevel = 1;
        turnsSinceLastClear = 0;
        updateScoreDisplay();

        // Clear board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('highlight', 'invalid');
        });
        
        // Generate new blocks
        generateBlockOptions();
    }
    
    // Initialize game
    initGame();
});