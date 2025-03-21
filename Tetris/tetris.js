const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const gameOverElement = document.getElementById('game-over');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('high-score');
const resetButton = document.getElementById('reset-button');

const gridSize = 30;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

let grid = [];
let tetrisPieces = [
    [[1, 1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]],
    [[1, 1], [1, 1]], [[0, 1, 1], [1, 1, 0]], [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]]
];
let colors = ['#00f0ff', '#f00', '#0f0', '#ff0', '#0ff', '#f0f', '#fff'];
let currentPiece, currentX, currentY, currentColor, score = 0, level = 1, linesCleared = 0, dropInterval = 1000, gameLoop, highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;

function resetGame() {
    grid = [];
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = Array(gridWidth).fill(0);
    }
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    gameOver = false;
    gameOverElement.style.display = 'none';
    scoreElement.textContent = `Score: ${score}`;
    levelElement.textContent = `Level: ${level}`;
    newPiece();
    clearInterval(gameLoop);
    gameLoop = setInterval(moveDown, dropInterval);
    draw(); // Draw the initial piece
}

function newPiece() {
    const randomPiece = Math.floor(Math.random() * tetrisPieces.length);
    currentPiece = tetrisPieces[randomPiece];
    currentX = Math.floor(gridWidth / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    currentColor = colors[randomPiece];
    console.log("New Piece:", currentPiece, currentX, currentY);
    if (checkCollision(0, 0)) {
        gameOver = true;
        gameOverElement.style.display = 'block';
    }
}

function drawPiece() {
    console.log("Draw Piece Called"); // Debugging Log
    if (currentPiece) {
        currentPiece.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillStyle = currentColor;
                    ctx.fillRect((currentX + x) * gridSize, (currentY + y) * gridSize, gridSize, gridSize);
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect((currentX + x) * gridSize, (currentY + y) * gridSize, gridSize, gridSize);
                }
            });
        });
    }
}

function drawGrid() {
    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                ctx.fillStyle = colors[cell - 1];
                ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                ctx.strokeStyle = '#333';
                ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPiece(); // Draw piece every frame
}

function checkCollision(offsetX, offsetY, rotatedPiece = currentPiece) {
    for (let y = 0; y < rotatedPiece.length; y++) {
        for (let x = 0; x < rotatedPiece[y].length; x++) {
            if (rotatedPiece[y][x]) {
                const newX = currentX + x + offsetX;
                const newY = currentY + y + offsetY;
                if (newX < 0 || newX >= gridWidth || newY >= gridHeight || grid[newY]?.[newX]) {
                    console.log("Collision detected");
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    currentPiece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                grid[currentY + y][currentX + x] = colors.indexOf(currentColor) + 1;
            }
        });
    });
}

function clearLines() {
    let cleared = 0;
    for (let y = gridHeight - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell)) {
            grid.splice(y, 1);
            grid.unshift(Array(gridWidth).fill(0));
            cleared++;
            linesCleared++;
            y++;
        }
    }
    score += [0, 100, 300, 500, 800][cleared];
    scoreElement.textContent = `Score: ${score}`;
    if (linesCleared >= 10) {
        level++;
        linesCleared -= 10;
        levelElement.textContent = `Level: ${level}`;
        dropInterval *= 0.8;
        clearInterval(gameLoop);
        gameLoop = setInterval(moveDown, dropInterval);
    }
}

function moveDown() {
    console.log("Move Down Called");
    if (!gameOver) {
        if (!checkCollision(0, 1)) {
            currentY++;
        } else {
            mergePiece();
            clearLines();
            newPiece();
        }
    }
}

function moveHorizontal(dir) {
    if (!gameOver && !checkCollision(dir, 0)) {
        currentX += dir;
    }
}

function rotatePiece() {
    if (!gameOver) {
        const rotated = currentPiece[0].map((val, index) => currentPiece.map(row => row[index]).reverse());
        if (!checkCollision(0, 0, rotated)) {
            currentPiece = rotated;
        }
    }
}

resetButton.addEventListener('click', resetGame);
resetGame();

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveHorizontal(-1);
    if (event.key === 'ArrowRight') moveHorizontal(1);
    if (event.key === 'ArrowDown') moveDown();
    if (event.key === 'ArrowUp') rotatePiece();
});

setInterval(() => {
    if (gameOver && score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    if(highScore >0){
        highScoreElement.textContent = `High Score: ${highScore}`;
    }

}, 100);

setInterval(draw, 30); // Draw the canvas every 30 milliseconds
highScoreElement.textContent = `High Score: ${highScore}`;