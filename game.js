const canvas = document.getElementById('game-board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = canvas.width / COLS;

// Camo-inspired colors for the pieces
const COLORS = [
    null,
    '#6B8E23', // Olive Drab
    '#8B4513', // Saddle Brown
    '#556B2F', // Dark Olive Green
    '#2F4F4F', // Dark Slate Gray
    '#A0522D', // Sienna
    '#DEB887', // Burly Wood
    '#808000', // Olive
];

const SHAPES = [
    [], // 0 index is empty
    [[1, 1, 1, 1]], // I
    [[2, 2], [2, 2]], // O
    [[0, 3, 0], [3, 3, 3]], // T
    [[4, 0, 0], [4, 4, 4]], // L
    [[0, 0, 5], [5, 5, 5]], // J
    [[6, 6, 0], [0, 6, 6]], // S
    [[0, 7, 7], [7, 7, 0]], // Z
];

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let dropCounter = 0;
let dropInterval = 1000; // 1 second
let lastTime = 0;
let time = 120; // 2 minutes for Time Attack
let timerId;
let gameOver = false;

let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: null,
};

function playerReset() {
    const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
    player.matrix = SHAPES[typeId];
    player.color = COLORS[typeId];
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(board, player)) {
        gameOver = true;
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        sweepBoard();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}


function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function sweepBoard() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;

        score += rowCount * 10;
        rowCount *= 2; // Bonus for multi-line
    }
    updateScore();
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Scale up the drawing context
    context.save();
    context.scale(BLOCK_SIZE, BLOCK_SIZE);

    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

    context.restore();
}

function update(time = 0) {
    if (gameOver) {
        clearInterval(timerId);
        context.fillStyle = 'rgba(0,0,0,0.75)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '48px Courier New';
        context.fillText('GAME OVER', canvas.width / 8, canvas.height / 2);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = score;
}

function updateTime() {
    time--;
    timeElement.innerText = time;
    if (time <= 0) {
        gameOver = true;
    }
}

document.addEventListener('keydown', event => {
    if (gameOver) return;
    if (event.keyCode === 37) { // Left Arrow
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right Arrow
        playerMove(1);
    } else if (event.keyCode === 40) { // Down Arrow
        playerDrop();
    } else if (event.keyCode === 81) { // Q for rotate
        playerRotate(-1);
    } else if (event.keyCode === 87 || event.keyCode === 38) { // W or Up Arrow for rotate
        playerRotate(1);
    }
});


playerReset();
updateScore();
timerId = setInterval(updateTime, 1000);
update();

document.getElementById('left').addEventListener('click', () => playerMove(-1));
document.getElementById('right').addEventListener('click', () => playerMove(1));
document.getElementById('down').addEventListener('click', () => playerDrop());
document.getElementById('rotate').addEventListener('click', () => playerRotate(1));
