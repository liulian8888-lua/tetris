const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const boardWidth = 12;
const boardHeight = 20;
const blockSize = 20;
let board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
let score = 0;
let level = 1;
let dropInterval = 1000;
let currentPiece;
let currentX, currentY;
let gameOver = false;

const pieces = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]] // J
];

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x]) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        }
    }
    if (currentPiece) {
        ctx.fillStyle = 'green';
        currentPiece.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell) {
                    ctx.fillRect((currentX + dx) * blockSize, (currentY + dy) * blockSize, blockSize, blockSize);
                    ctx.strokeRect((currentX + dx) * blockSize, (currentY + dy) * blockSize, blockSize, blockSize);
                }
            });
        });
    }
}

function reset() {
    board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    document.getElementById('game-over').style.display = 'none';
    updateScore();
    updateLevel();
    newPiece();
}

function newPiece() {
    currentPiece = pieces[Math.floor(Math.random() * pieces.length)];
    currentX = Math.floor(boardWidth / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    if (!isValid(currentPiece, currentX, currentY)) {
        gameOver = true;
        document.getElementById('game-over').style.display = 'block';
    }
}

function isValid(piece, x, y) {
    return piece.every((row, dy) => {
        return row.every((cell, dx) => {
            const newX = x + dx;
            const newY = y + dy;
            return (
                cell === 0 ||
                (newX >= 0 && newX < boardWidth && newY >= 0 && newY < boardHeight && board[newY][newX] === 0)
            );
        });
    });
}

function move(dir) {
    if (isValid(currentPiece, currentX + dir, currentY)) {
        currentX += dir;
    }
}

function drop() {
    if (isValid(currentPiece, currentX, currentY + 1)) {
        currentY++;
    } else {
        currentPiece.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell) {
                    board[currentY + dy][currentX + dx] = cell;
                }
            });
        });
        clearLines();
        newPiece();
    }
    draw();
}

function rotate(piece) {
    return piece[0].map((_, i) => piece.map(row => row[i])).reverse();
}

function clearLines() {
    const linesToClear = [];
    board.forEach((row, y) => {
        if (row.every(cell => cell)) {
            linesToClear.push(y);
        }
    });
    linesToClear.forEach(y => {
        board.splice(y, 1);
        board.unshift(Array(boardWidth).fill(0));
        score += 100;
    });
    if (linesToClear.length > 0) {
        document.getElementById('message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('message').style.display = 'none';
        }, 2000);
        levelUp();
    }
    updateScore();
}

function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

function updateLevel() {
    document.getElementById('level').innerText = `Level: ${level}`;
}

function levelUp() {
    level++;
    dropInterval = Math.max(100, dropInterval - 100); // Increase speed, minimum interval of 100ms
    updateLevel();
    const levelUpMessage = document.getElementById('level-up-message');
    levelUpMessage.style.display = 'block';
    levelUpMessage.innerText = `Level Up! You are now on Level ${level}`;
    setTimeout(() => {
        levelUpMessage.style.display = 'none';
    }, 3000);
    clearInterval(dropIntervalId);
    dropIntervalId = setInterval(() => {
        if (!gameOver) {
            drop();
        }
    }, dropInterval);
}

// Centralized movement handler
function handleMovement(direction) {
    switch (direction) {
        case 'up':
            const rotated = rotate(currentPiece);
            if (isValid(rotated, currentX, currentY)) {
                currentPiece = rotated;
            }
            break;
        case 'down':
            drop();
            break;
        case 'left':
            move(-1);
            break;
        case 'right':
            move(1);
            break;
    }
    draw();
}

// Keyboard input
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') handleMovement('left');
    if (e.key === 'ArrowRight') handleMovement('right');
    if (e.key === 'ArrowDown') handleMovement('down');
    if (e.key === 'ArrowUp') handleMovement('up');
});

// Touch input for virtual keypad
document.getElementById('up-key').addEventListener('touchstart', function(event) {
    event.preventDefault();
    handleMovement('up');
});

document.getElementById('down-key').addEventListener('touchstart', function(event) {
    event.preventDefault();
    handleMovement('down');
});

document.getElementById('left-key').addEventListener('touchstart', function(event) {
    event.preventDefault();
    handleMovement('left');
});

document.getElementById('right-key').addEventListener('touchstart', function(event) {
    event.preventDefault();
    handleMovement('right');
});

// Add touch support for swipe gestures
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) {
        return;
    }
    let touchEndX = e.touches[0].clientX;
    let touchEndY = e.touches[0].clientY;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0) {
            handleMovement('right'); // Swipe right
        } else {
            handleMovement('left'); // Swipe left
        }
    } else {
        // Vertical swipe
        if (diffY > 0) {
            handleMovement('down'); // Swipe down
        } else {
            handleMovement('up'); // Swipe up
        }
    }
    touchStartX = 0;
    touchStartY = 0;
    draw();
});

// Show keypad only on mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
    document.getElementById('mobile-controls').style.display = 'flex';
}

document.getElementById('restart-button').addEventListener('click', () => {
    reset();
    draw();
});

let dropIntervalId = setInterval(() => {
    if (!gameOver) {
        drop();
    }
}, dropInterval);

reset();