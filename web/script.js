const X_CLASS = 'x';
const O_CLASS = 'o';
const WINNING_COMBINATIONS_3x3 = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];
const WINNING_COMBINATIONS_4x4 = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12]
];

const statusMessage = document.getElementById('statusMessage');
const endScreen = document.getElementById('endScreen');
const endMessage = document.getElementById('endMessage');
const newGameButton = document.getElementById('newGameButton');
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const gameBoard = document.getElementById('gameBoard');
const classicModeButton = document.getElementById('classicMode');
const aiEasyModeButton = document.getElementById('aiEasyMode');
const aiHardModeButton = document.getElementById('aiHardMode');
const powerModeButton = document.getElementById('powerMode');
const powerButtons = document.getElementById('powerButtons');
const skipTurnButton = document.getElementById('skipTurnButton');
const doubleTurnButton = document.getElementById('doubleTurnButton');
const undoButton = document.getElementById('undoButton');

let oTurn; // Tracks turns, where 'O' is AI or player 2
let currentGameMode = 'classic'; // Tracks the current mode
let player1Powers = { skip: true, double: true, undo: true };
let player2Powers = { skip: true, double: true, undo: true };
let lastMove = null; // Tracks the last move for undo functionality
let boardSize = 3; // Default board size is 3x3
let cellElements = [];

classicModeButton.addEventListener('click', () => startGame('classic'));
aiEasyModeButton.addEventListener('click', () => startGame('aiEasy'));
aiHardModeButton.addEventListener('click', () => startGame('aiHard'));
powerModeButton.addEventListener('click', () => startGame('powerMode'));
newGameButton.addEventListener('click', resetGame);
skipTurnButton.addEventListener('click', skipTurn);
doubleTurnButton.addEventListener('click', doubleTurn);
undoButton.addEventListener('click', undoMove);

function startGame(mode) {
  currentGameMode = mode;
  oTurn = false; // Player X starts first
  menuScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  powerButtons.style.display = mode === 'powerMode' ? 'block' : 'none';
  boardSize = mode === 'powerMode' ? 4 : 3;
  resetBoard();
  statusMessage.textContent = `Player X's turn`;
}

function resetGame() {
  menuScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  endScreen.style.display = 'none';
  resetPowers(); // Reset powers for new game
}

function resetBoard() {
  gameBoard.classList.remove('power-mode'); // Reset previous board mode
  gameBoard.innerHTML = ''; // Clear previous cells
  cellElements = [];

  const totalCells = boardSize * boardSize;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    if (currentGameMode === 'powerMode') {
      cell.classList.add('power-mode');
    }
    cell.dataset.cell = '';
    cell.addEventListener('click', handleClick, { once: true });
    gameBoard.appendChild(cell);
    cellElements.push(cell);
  }
  
  gameBoard.classList.toggle('power-mode', currentGameMode === 'powerMode');
}

function handleClick(e) {
  const cell = e.target;
  const currentClass = oTurn ? O_CLASS : X_CLASS;
  lastMove = { cell, currentClass }; // Store last move for undo

  placeMark(cell, currentClass);

  if (checkWin(currentClass)) {
    endGame(false);
  } else if (isDraw()) {
    endGame(true);
  } else {
    swapTurns();
    if (currentGameMode !== 'classic' && oTurn) {
      setTimeout(aiMove, 500); // AI makes a move after the player's turn
    }
  }
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
  cell.textContent = currentClass.toUpperCase(); // Display X or O
}

function swapTurns() {
  oTurn = !oTurn;
  updateStatusMessage();
}

function updateStatusMessage() {
  statusMessage.textContent = `Player ${oTurn ? 'O' : 'X'}'s turn`;
}

function checkWin(currentClass) {
  const winningCombinations = boardSize === 4 ? WINNING_COMBINATIONS_4x4 : WINNING_COMBINATIONS_3x3;
  return winningCombinations.some(combination => {
    return combination.every(index => {
      return cellElements[index].classList.contains(currentClass);
    });
  });
}

function isDraw() {
  return [...cellElements].every(cell => {
    return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
  });
}

function endGame(draw) {
  if (draw) {
    endMessage.textContent = "It's a Draw!";
  } else {
    endMessage.textContent = `Player ${oTurn ? 'O' : 'X'} Wins!`;
  }
  endScreen.style.display = 'flex';
}

function resetPowers() {
  player1Powers = { skip: true, double: true, undo: true };
  player2Powers = { skip: true, double: true, undo: true };
}

// AI Move Functionality for Easy and Hard Mode
function aiMove() {
  const availableCells = cellElements.filter(cell => !cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS));

  if (currentGameMode === 'aiEasy') {
    // Easy mode AI: Picks a random available cell
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const randomCell = availableCells[randomIndex];
    randomCell.click();
  } else if (currentGameMode === 'aiHard') {
    // Hard mode AI: Tries to block player, or picks a strategic move
    const bestMove = getBestMove(O_CLASS, X_CLASS); // AI is 'O', player is 'X'
    cellElements[bestMove].click();
  }
}

// AI Logic for Hard Mode
function getBestMove(aiClass, opponentClass) {
  for (let combination of (boardSize === 4 ? WINNING_COMBINATIONS_4x4 : WINNING_COMBINATIONS_3x3)) {
    // First, check if AI can win
    const aiWinMove = checkForWinOrBlock(combination, aiClass);
    if (aiWinMove !== -1) return aiWinMove;

    // Then, block the player from winning
    const blockMove = checkForWinOrBlock(combination, opponentClass);
    if (blockMove !== -1) return blockMove;
  }

  // If no immediate win or block, pick a random move (fallback)
  const availableCells = cellElements.map((cell, index) => !cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS) ? index : null).filter(index => index !== null);
  return availableCells[Math.floor(Math.random() * availableCells.length)];
}

function checkForWinOrBlock(combination, playerClass) {
  const playerCells = combination.filter(index => cellElements[index].classList.contains(playerClass));
  const emptyCells = combination.filter(index => !cellElements[index].classList.contains(X_CLASS) && !cellElements[index].classList.contains(O_CLASS));

  if (playerCells.length === boardSize - 1 && emptyCells.length === 1) {
    return emptyCells[0];
  }
  return -1;
}

// Power Functions
function skipTurn() {
  if (currentGameMode === 'powerMode' && (oTurn ? player2Powers.skip : player1Powers.skip)) {
    if (oTurn) player2Powers.skip = false;
    else player1Powers.skip = false;
    swapTurns();
    updateStatusMessage();
  }
}

// Variable to track if the Top Over power has been used
let topOverUsed = false;

// Function to handle the Top Over power
function handleTopOver() {
  if (topOverUsed) {
    alert("You have already used 'Top Over'.");
    return;
  }

  alert(`${currentPlayer} can now take over any of the opponent's marked box.`);

  // Function to handle the click event for Top Over
  function topOverHandler(event) {
    const cell = event.target;

    // Ensure the click is on an empty cell or an opponent's cell
    if (cell.classList.contains('cell') && cell.textContent !== '' && cell.textContent !== currentPlayer) {
      // Replace the opponent's symbol with the current player's symbol
      cell.textContent = currentPlayer;

      // Apply visual feedback for the 'take over'
      cell.classList.add('taken-over');

      // Disable the Top Over button after using it
      document.getElementById('topOverButton').disabled = true;

      // Mark the power as used
      topOverUsed = true;

      // Check for win or draw after the move
      checkWin();

      // Remove the event listener to ensure Top Over can only be used once
      document.removeEventListener('click', topOverHandler);
    } else {
      alert('You can only take over an opponent’s box.');
    }
  }

  // Add the click event listener to the entire board
  document.addEventListener('click', topOverHandler);
}

// Attach the event to the Top Over button
document.getElementById('topOverButton').addEventListener('click', handleTopOver);


function undoMove() {
  if (currentGameMode === 'powerMode' && lastMove) {
    lastMove.cell.classList.remove(lastMove.currentClass);
    lastMove.cell.textContent = '';
    lastMove.cell.addEventListener('click', handleClick, { once: true });
    lastMove = null;
    swapTurns();
    updateStatusMessage();
  }
}

// Add this event listener in your JS
document.querySelectorAll('#powerMode, #skipTurnButton, #doubleTurnButton, #undoButton').forEach(button => {
  button.addEventListener('click', () => {
    createParticles(button);
  });
});

function createParticles(button) {
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particles');
    particle.style.setProperty('--x', (Math.random() - 0.5) * 200);
    particle.style.setProperty('--y', (Math.random() - 0.5) * 200);
    button.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 600);
  }
}

// Event listener to trigger particle explosion on button click
document.querySelectorAll('#powerMode, #skipTurnButton, #doubleTurnButton, #undoButton').forEach(button => {
  button.addEventListener('click', () => {
    createParticles(button);
  });
});

function createParticles(button) {
  for (let i = 0; i < 30; i++) {  /* Increased number of particles */
    const particle = document.createElement('div');
    particle.classList.add('particles');
    
    /* Assign a random color to each particle */
    const colors = ['#ff66a5', '#ffcc00', '#66ff66', '#33ccff', '#ff6666', '#ff99ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.background = randomColor;
    particle.style.setProperty('--x', (Math.random() - 0.5) * 200);
    particle.style.setProperty('--y', (Math.random() - 0.5) * 200);
    button.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 800);  /* Adjust to match particleExplosion duration */
  }
}
