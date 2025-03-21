var blockSize = 29.5;

var rows = 22;
var cols = 22;

var context;
var board;
var logger = [];

var refreshes = 0;

var gameOver = false;

var snakeX = blockSize * Math.floor(Math.random() * cols) + 1;
var snakeY = blockSize * Math.floor(Math.random() * rows) + 1;

var snakeBody = [];

var coinX = blockSize * Math.floor(Math.random() * cols) + 1;
var coinY = blockSize * Math.floor(Math.random() * rows) + 1;

var velocityX = 0;
var velocityY = 0;

var score = 0;


window.onload = function() {
    board = document.getElementById("game");

    board.width = cols * blockSize;
    board.height = rows * blockSize;
    context = board.getContext("2d");
    
    document.getElementById("reset").addEventListener("click",reset);

    document.addEventListener("keyup", turn)
    setInterval(go, 1000/10);
}

function go() {

    refreshes += 1;

    if(gameOver == true) {
        return;
    }
    
    context.fillStyle="black";
    context.fillRect(0,0,board.width,board.height);

    for(let i = 1; i < score; i++) {
        context.fillStyle="orange";
        context.fillRect(logger[i-1][0],logger[i-1][1],blockSize,blockSize);
        if(snakeX == logger[i-1][0] && snakeY == logger[i-1][1]) {
            gameOver = true;
            alert("Game Over! Your Score Was: " + score)
        }
    }


    for(let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i-1];
    }

    if(snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY];
    }

    context.fillStyle = "red";
    context.fillRect(coinX,coinY,blockSize,blockSize);
    if(coinX == snakeX && coinY == snakeY) {

        score += 1;

        logger.push([coinX,coinY]);

        console.log(logger);
        console.log(snakeBody);


        snakeBody.push([coinX,coinY]);

        coin();
        if(refreshes <= 1 && snakeX == coinX && snakeY == coinY) {
            coin();
        }
    }
    context.fillStyle = "green";
    snakeY += velocityY * blockSize;
    snakeX += velocityX * blockSize;
    context.fillRect(snakeX,snakeY,blockSize,blockSize);
    for(let i = 0; i < snakeBody.length; i++) {
        context.fillRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize);
    }


    if(snakeX < 0 || snakeX > cols * blockSize || snakeY < 0 || snakeY > rows * blockSize) {
        gameOver = true;
        alert("Game Over! Your Score Was: " + score)
    }

    for(let i = 0; i < snakeBody.length; i++) {
        if(snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOver = true;
            alert("Game Over! Your Score Was: " + score)
        }
    }
}

function reset() {
    window.location.reload();
}

function turn(e) {
    if(e.code == "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    }
    else if(e.code == "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    }
    else if(e.code == "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    }
    else if(e.code == "ArrowRight" && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
    }

}

function coin() {

    coinX = Math.floor(Math.random() * cols) * blockSize + 1;
    coinY = Math.floor(Math.random() * rows) * blockSize + 1;

    document.getElementById("score").innerText = score;

}