// Game state and constants
const SMALL_BLIND = 5;
const BIG_BLIND = 10;
const STARTING_POINTS = 1000;

const gameState = {
    deck: [],
    communityCards: [],
    currentPlayer: 0,
    players: [
        { id: 1, name: "You", points: STARTING_POINTS, hand: [], bet: 0, folded: false, isAllIn: false, isDealer: false },
        { id: 2, name: "Foldy McFoldface", points: STARTING_POINTS, hand: [], bet: 0, folded: false, isAllIn: false, isDealer: false },
        { id: 3, name: "Calling Carl", points: STARTING_POINTS, hand: [], bet: 0, folded: false, isAllIn: false, isDealer: false },
        { id: 4, name: "Raise 'Em Rachel", points: STARTING_POINTS, hand: [], bet: 0, folded: false, isAllIn: false, isDealer: false }
    ],
    pot: 0,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    roundBets: {},
    currentBet: 0,
    gamePhase: "none", // none, preflop, flop, turn, river, showdown
    handOver: true
};

// DOM elements
const dealBtn = document.getElementById('dealBtn');
const foldBtn = document.getElementById('foldBtn');
const checkCallBtn = document.getElementById('checkCallBtn');
const betRaiseBtn = document.getElementById('betRaiseBtn');
const betSlider = document.getElementById('betSlider');
const betAmount = document.getElementById('betAmount');
const potDisplay = document.getElementById('pot');
const gameMessage = document.getElementById('gameMessage');
const communityCardsEl = document.getElementById('communityCards');
const playerHandRank = document.getElementById('playerHandRank');

// Card deck functions
function createDeck() {
    const suits = ['H', 'D', 'C', 'S'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (let suit of suits) {
        for (let value of values) {
            deck.push({
                value: value,
                suit: suit,
                numValue: getCardNumericValue(value)
            });
        }
    }
    
    return deck;
}

function getCardNumericValue(value) {
    if (value === 'A') return 14;
    if (value === 'K') return 13;
    if (value === 'Q') return 12;
    if (value === 'J') return 11;
    return parseInt(value);
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealCards() {

    gameState.deck = shuffleDeck(createDeck());

    gameState.communityCards = [];

    gameState.pot = 0;

    gameState.currentBet = 0;

    gameState.roundBets = {};

    gameState.playersActed = 0; // Initialize action counter

    gameState.roundComplete = false;

    

    // Reset player states

    gameState.players.forEach(player => {

        player.hand = [];

        player.bet = 0;

        player.folded = false;

        player.isAllIn = false;

    });

    

    // Deal two cards to each player

    for (let i = 0; i < 2; i++) {

        for (let player of gameState.players) {

            if (player.points > 0) {

                player.hand.push(gameState.deck.pop());

            }

        }

    }

    

    // Post blinds

    const smallBlindPlayer = gameState.players[gameState.smallBlindIndex];

    const bigBlindPlayer = gameState.players[gameState.bigBlindIndex];

    

    placeBet(smallBlindPlayer, Math.min(smallBlindPlayer.points, SMALL_BLIND));

    placeBet(bigBlindPlayer, Math.min(bigBlindPlayer.points, BIG_BLIND));

    

    gameState.currentBet = BIG_BLIND;

    

    // Set first player after big blind

    gameState.currentPlayer = (gameState.bigBlindIndex + 1) % gameState.players.length;

    

    // Skip players who are out of points

    while (gameState.players[gameState.currentPlayer].points === 0) {

        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;

    }

    

    updateGamePhase("preflop");

    renderTable();

    renderControls();

    

    gameMessage.textContent = "New hand dealt. " + gameState.players[gameState.currentPlayer].name + "'s turn.";

    

    if (gameState.currentPlayer !== 0 && !gameState.handOver) {

        setTimeout(robotPlay, 1000);

    }

}


function placeBet(player, amount) {

    const actualAmount = Math.min(player.points, amount);

    player.points -= actualAmount;

    player.bet += actualAmount;

    gameState.pot += actualAmount;

    

    if (player.points === 0) {

        player.isAllIn = true;

    }

    

    // Only update currentBet if the player's bet is greater than the currentBet

    if (player.bet > gameState.currentBet) {

        gameState.currentBet = player.bet;

    }

    

    potDisplay.textContent = "Pot: " + gameState.pot;

    

    // Update player display

    updatePlayerDisplay(player);

}

function updatePlayerDisplay(player) {
    const playerEl = document.getElementById('player' + player.id);
    const pointsEl = playerEl.querySelector('.player-points');
    const statusEl = playerEl.querySelector('.player-status');
    const nameEl = playerEl.querySelector('.player-name');
    
    // Make sure the player name is updated
    nameEl.textContent = player.name;
    
    pointsEl.textContent = "Points: " + player.points;
    
    if (player.folded) {
        statusEl.textContent = "Folded";
        playerEl.classList.add('folded');
    } else if (player.isAllIn) {
        statusEl.textContent = "All-in: " + player.bet;
    } else if (player.bet > 0) {
        statusEl.textContent = "Bet: " + player.bet;
    } else {
        statusEl.textContent = "Waiting";
    }
    
    // Update active player highlight
    document.querySelectorAll('.player').forEach(el => el.classList.remove('active'));
    
    if (!gameState.handOver) {
        document.getElementById('player' + gameState.players[gameState.currentPlayer].id).classList.add('active');
    }
}

function updateGamePhase(phase) {
    gameState.gamePhase = phase;
    gameState.handOver = false;
    // Reset action tracking for new round
    gameState.playersActed = 0;
    gameState.roundComplete = false;
    
    // Reset bets for the new phase
    if (phase !== "preflop") {
        // Store the current bets for reference
        gameState.players.forEach(player => {
            gameState.roundBets[player.id] = player.bet;
            // Reset player bets to 0 for the new round
            player.bet = 0;
        });
        gameState.currentBet = 0;
        
        // First active player after dealer
        gameState.currentPlayer = (gameState.dealerIndex + 1) % gameState.players.length;
        
        // Skip folded or all-in or out of points players
        while (
            gameState.players[gameState.currentPlayer].folded || 
            gameState.players[gameState.currentPlayer].isAllIn ||
            gameState.players[gameState.currentPlayer].points === 0
        ) {
            gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
            
            // If we've gone all the way around, everyone is either folded or all-in
            if (gameState.currentPlayer === (gameState.dealerIndex + 1) % gameState.players.length) {
                // Skip straight to showdown
                if (phase === "flop") {
                    dealTurn();
                    dealRiver();
                    evaluateHands();
                    return;
                } else if (phase === "turn") {
                    dealRiver();
                    evaluateHands();
                    return;
                } else if (phase === "river") {
                    evaluateHands();
                    return;
                }
            }
        }
    }
    
    switch (phase) {
        case "preflop":
            renderPlayerCards();
            break;
        case "flop":
            dealFlop();
            break;
        case "turn":
            dealTurn();
            break;
        case "river":
            dealRiver();
            break;
        case "showdown":
            evaluateHands();
            break;
    }
    
    renderControls();
    
    if (gameState.currentPlayer !== 0 && !gameState.handOver) {
        setTimeout(robotPlay, 1000);
    }
}

function dealFlop() {
    // Burn a card
    gameState.deck.pop();
    
    // Deal three community cards
    for (let i = 0; i < 3; i++) {
        gameState.communityCards.push(gameState.deck.pop());
    }
    
    renderCommunityCards();
    updatePlayerHandRanking();
    gameMessage.textContent = "Flop dealt. " + gameState.players[gameState.currentPlayer].name + "'s turn.";
}

function dealTurn() {
    // Burn a card
    gameState.deck.pop();
    
    // Deal the turn card
    gameState.communityCards.push(gameState.deck.pop());
    
    renderCommunityCards();
    updatePlayerHandRanking();
    gameMessage.textContent = "Turn dealt. " + gameState.players[gameState.currentPlayer].name + "'s turn.";
}

function dealRiver() {
    // Burn a card
    gameState.deck.pop();
    
    // Deal the river card
    gameState.communityCards.push(gameState.deck.pop());
    
    renderCommunityCards();
    updatePlayerHandRanking();
    gameMessage.textContent = "River dealt. " + gameState.players[gameState.currentPlayer].name + "'s turn.";
}


function nextPlayer() {

    // Move to the next player

    do {

        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;

    } while (

        gameState.players[gameState.currentPlayer].folded || 

        gameState.players[gameState.currentPlayer].points === 0 ||

        gameState.players[gameState.currentPlayer].isAllIn

    );

    

    // Increment player action counter

    gameState.playersActed++;

    

    // Check if the round is complete

    if (isRoundComplete()) {

        // All players have had a turn and bets are equal

        finishRound();

    } else {

        // Continue with the next player

        renderTable();

        renderControls();

        

        if (gameState.currentPlayer !== 0 && !gameState.handOver) {

            setTimeout(robotPlay, 1000);

        }

    }

}

function isRoundComplete() {
    // Get active players (not folded and not all-in)
    const activePlayers = gameState.players.filter(player => 
        !player.folded && !player.isAllIn && player.points > 0
    );
    
    // If only one or no active players, round is complete
    if (activePlayers.length <= 1) {
        return true;
    }
    
    // Check if all active players have equal bets
    const allEqual = activePlayers.every(player => player.bet === gameState.currentBet);
    
    // For preflop, we need to make sure everyone has had at least one turn
    if (gameState.gamePhase === "preflop") {
        // We'll use a counter to check if we've gone all the way around
        // Get the player after the big blind
        const startPlayerIndex = (gameState.bigBlindIndex + 1) % gameState.players.length;
        
        // If the human player's turn is now, definitely not complete
        if (gameState.currentPlayer === 0) {
            return false;
        }
        
        // For all other players, check if we've gone around the circle
        return (
            allEqual && 
            (
                // We've either gone around to start position
                gameState.currentPlayer === startPlayerIndex || 
                // Or the starting player is no longer active
                gameState.players[startPlayerIndex].folded ||
                gameState.players[startPlayerIndex].isAllIn
            )
        );
    } else {
        // For other phases (flop, turn, river)
        // Need to make sure all players have acted at least once in this round
        if (!gameState.roundComplete && allEqual) {
            // If all players have acted and all bets are equal, the round is complete
            return gameState.playersActed >= activePlayers.length;
        }
        return false;
    }
}

function finishRound() {

    // Move to the next phase

    if (gameState.gamePhase === "showdown") {

        return; // Don't transition if already in showdown

    }

    

    switch (gameState.gamePhase) {

        case "preflop":

            updateGamePhase("flop");

            break;

        case "flop":

            updateGamePhase("turn");

            break;

        case "turn":

            updateGamePhase("river");

            break;

        case "river":

            updateGamePhase("showdown");

            break;

    }

}

function renderTable() {
    renderPlayerCards();
    renderCommunityCards();
    
    // Update player displays
    gameState.players.forEach(player => {
        updatePlayerDisplay(player);
    });
    
    potDisplay.textContent = "Pot: " + gameState.pot;
}

function renderPlayerCards() {
    // Render player cards
    gameState.players.forEach(player => {
        const playerEl = document.getElementById('player' + player.id);
        const cardEls = playerEl.querySelectorAll('.player-cards .card');
        
        for (let i = 0; i < 2; i++) {
            if (player.hand[i]) {
                // For your own cards, show them
                if (player.id === 1) {
                    cardEls[i].style.backgroundImage = `url('cards/${player.hand[i].value}-${player.hand[i].suit}.png')`;
                    cardEls[i].classList.remove('placeholder');
                } 
                // For other players' cards, show only if at showdown and they're not folded
                else if (gameState.gamePhase === "showdown" && !player.folded) {
                    cardEls[i].style.backgroundImage = `url('cards/${player.hand[i].value}-${player.hand[i].suit}.png')`;
                    cardEls[i].classList.remove('placeholder');
                } 
                // Otherwise, show card backs
                else if (!player.folded) {
                    cardEls[i].style.backgroundImage = `url('cards/back.png')`;
                    cardEls[i].classList.remove('placeholder');
                } 
                // For folded players, show placeholders
                else {
                    cardEls[i].style.backgroundImage = '';
                    cardEls[i].classList.add('placeholder');
                }
            } else {
                cardEls[i].style.backgroundImage = '';
                cardEls[i].classList.add('placeholder');
            }
        }
    });
}

function renderCommunityCards() {
    const cardEls = communityCardsEl.querySelectorAll('.card');
    
    for (let i = 0; i < 5; i++) {
        if (gameState.communityCards[i]) {
            cardEls[i].style.backgroundImage = `url('cards/${gameState.communityCards[i].value}-${gameState.communityCards[i].suit}.png')`;
            cardEls[i].classList.remove('placeholder');
        } else {
            cardEls[i].style.backgroundImage = '';
            cardEls[i].classList.add('placeholder');
        }
    }
}

function renderControls() {
    if (gameState.handOver) {
        dealBtn.disabled = false;
        foldBtn.disabled = true;
        checkCallBtn.disabled = true;
        betRaiseBtn.disabled = true;
        betSlider.disabled = true;
        return;
    }
    
    // Enable/disable controls based on current player and game state
    const isPlayerTurn = gameState.currentPlayer === 0;
    const player = gameState.players[0]; // The human player
    
    dealBtn.disabled = true;
    foldBtn.disabled = !isPlayerTurn || player.folded || player.isAllIn;
    
    if (isPlayerTurn && !player.folded && !player.isAllIn) {
        // Check/Call button
        const callAmount = gameState.currentBet - player.bet;
        
        if (callAmount <= 0) {
            checkCallBtn.textContent = "Check";
            checkCallBtn.disabled = false;
        } else if (callAmount >= player.points) {
            checkCallBtn.textContent = "All-In (" + player.points + ")";
            checkCallBtn.disabled = false;
        } else {
            checkCallBtn.textContent = "Call (" + callAmount + ")";
            checkCallBtn.disabled = false;
        }
        
        // Bet/Raise button
        const minRaise = gameState.currentBet * 2 - player.bet;
        
        if (gameState.currentBet === 0) {
            betRaiseBtn.textContent = "Bet";
            betSlider.min = BIG_BLIND;
            betSlider.max = player.points;
            betSlider.value = BIG_BLIND;
            betAmount.textContent = betSlider.value;
            betRaiseBtn.disabled = player.points < BIG_BLIND;
            betSlider.disabled = player.points < BIG_BLIND;
        } else if (player.points <= callAmount) {
            betRaiseBtn.disabled = true;
            betSlider.disabled = true;
        } else {
            betRaiseBtn.textContent = "Raise";
            betSlider.min = Math.min(minRaise, player.points);
            betSlider.max = player.points;
            betSlider.value = Math.min(minRaise, player.points);
            betAmount.textContent = betSlider.value;
            betRaiseBtn.disabled = player.points <= callAmount;
            betSlider.disabled = player.points <= callAmount;
        }
    } else {
        checkCallBtn.disabled = true;
        betRaiseBtn.disabled = true;
        betSlider.disabled = true;
    }
}

// Hand evaluation functions
function evaluateHands() {
    gameState.handOver = true;
    
    // Collect all players who haven't folded
    const activePlayers = gameState.players.filter(player => !player.folded);
    
    if (activePlayers.length === 1) {
        // If only one player is left, they win
        const winner = activePlayers[0];
        gameMessage.textContent = winner.name + " wins " + gameState.pot + " points!";
        winner.points += gameState.pot;
        highlightWinner(winner.id);
    } else {
        // Calculate hand values for all active players
        const playerRankings = activePlayers.map(player => {
            const allCards = [...player.hand, ...gameState.communityCards];
            const handValue = evaluateHandStrength(allCards);
            return { player, handValue };
        });
        
        // Sort by hand value (highest first)
        playerRankings.sort((a, b) => b.handValue.value - a.handValue.value);
        
        // Find all tied for the highest value (in case of split pot)
        const highestValue = playerRankings[0].handValue.value;
        const winners = playerRankings.filter(pr => pr.handValue.value === highestValue);
        
        // Display winners and split the pot
        if (winners.length === 1) {
            const winner = winners[0].player;
            gameMessage.textContent = winner.name + " wins with " + winners[0].handValue.name + "!";
            winner.points += gameState.pot;
            highlightWinner(winner.id);
        } else {
            const winnerNames = winners.map(w => w.player.name).join(', ');
            const splitAmount = Math.floor(gameState.pot / winners.length);
            gameMessage.textContent = "Split pot! " + winnerNames + " each win " + splitAmount + " with " + winners[0].handValue.name + "!";
            
            winners.forEach(w => {
                w.player.points += splitAmount;
                highlightWinner(w.player.id);
            });
            
            // Handle remaining chips if pot doesn't split evenly
            const remainder = gameState.pot % winners.length;
            if (remainder > 0) {
                // Give the remainder to the first player after the dealer
                let currentPlayer = (gameState.dealerIndex + 1) % gameState.players.length;
                while (!winners.some(w => w.player.id === gameState.players[currentPlayer].id)) {
                    currentPlayer = (currentPlayer + 1) % gameState.players.length;
                }
                gameState.players[currentPlayer].points += remainder;
            }
        }
        
        // Update player's hand ranking
        updatePlayerHandRanking();
    }
    
    // Clear any fold styling
    document.querySelectorAll('.player').forEach(el => el.classList.remove('folded'));
    
    // Update all player displays with new point totals
    gameState.players.forEach(player => {
        updatePlayerDisplay(player);
    });
    
    // Show all cards
    renderPlayerCards();
    
    // Rotate positions for next hand
    gameState.dealerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
    gameState.smallBlindIndex = (gameState.dealerIndex + 1) % gameState.players.length;
    gameState.bigBlindIndex = (gameState.dealerIndex + 2) % gameState.players.length;
    
    // Re-enable deal button
    renderControls();
}

function highlightWinner(playerId) {
    const playerEl = document.getElementById('player' + playerId);
    playerEl.classList.add('winner-highlight');
    
    setTimeout(() => {
        playerEl.classList.remove('winner-highlight');
    }, 3000);
}

function evaluateHandStrength(cards) {
    // We need at least 5 cards to form a hand
    if (cards.length < 5) return { value: 0, name: "Invalid Hand" };
    
    // Sort cards by value (Ace is high, so 14)
    const sortedCards = [...cards].sort((a, b) => b.numValue - a.numValue);
    
    // Check for each hand type from highest to lowest
    let handEval;
    
    handEval = checkRoyalFlush(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkStraightFlush(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkFourOfAKind(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkFullHouse(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkFlush(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkStraight(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkThreeOfAKind(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkTwoPair(sortedCards);
    if (handEval) return handEval;
    
    handEval = checkPair(sortedCards);
    if (handEval) return handEval;
    
    // High card
    return {
        value: 100 + getCardValue(sortedCards[0]),
        name: "High Card " + getCardName(sortedCards[0].value)
    };
}

function checkRoyalFlush(cards) {
    // Check for straight flush starting with Ace
    const straightFlush = checkStraightFlush(cards);
    if (straightFlush && cards.some(card => card.numValue === 14 && card.suit === straightFlush.suit)) {
        return { value: 900, name: "Royal Flush", suit: straightFlush.suit };
    }
    return null;
}

function checkStraightFlush(cards) {
    // Group cards by suit
    const suits = {'H': [], 'D': [], 'C': [], 'S': []};
    for (let card of cards) {
        suits[card.suit].push(card);
    }
    
    // Check each suit for a straight
    for (let suit in suits) {
        if (suits[suit].length >= 5) {
            const suitCards = suits[suit].sort((a, b) => b.numValue - a.numValue);
            const straight = checkStraight(suitCards);
            if (straight) {
                return { value: 800 + straight.value - 500, name: "Straight Flush", suit: suit };
            }
        }
    }
    
    return null;
}

function checkFourOfAKind(cards) {
    // Group cards by value
    const values = {};
    for (let card of cards) {
        if (!values[card.numValue]) values[card.numValue] = [];
        values[card.numValue].push(card);
    }
    
    // Find four of a kind
    for (let value in values) {
        if (values[value].length === 4) {
            return { 
                value: 700 + parseInt(value), 
                name: "Four of a Kind " + getCardName(values[value][0].value) 
            };
        }
    }
    
    return null;
}

function checkFullHouse(cards) {
    // Group cards by value
    const values = {};
    for (let card of cards) {
        if (!values[card.numValue]) values[card.numValue] = [];
        values[card.numValue].push(card);
    }
    
    let threeOfKind = null;
    let pair = null;
    
    // Find the highest three of a kind
    for (let value in values) {
        if (values[value].length >= 3) {
            if (!threeOfKind || parseInt(value) > threeOfKind) {
                threeOfKind = parseInt(value);
            }
        }
    }
    
    // If we found three of a kind, look for the highest pair
    if (threeOfKind) {
        for (let value in values) {
            if (parseInt(value) !== threeOfKind && values[value].length >= 2) {
                if (!pair || parseInt(value) > pair) {
                    pair = parseInt(value);
                }
            }
        }
    }
    
    if (threeOfKind && pair) {
        return { 
            value: 600 + threeOfKind, 
            name: "Full House " + getCardName(threeOfKind.toString()) + " over " + getCardName(pair.toString()) 
        };
    }
    
    return null;
}

function checkFlush(cards) {
    // Group cards by suit
    const suits = {'H': [], 'D': [], 'C': [], 'S': []};
    for (let card of cards) {
        suits[card.suit].push(card);
    }
    
    // Check for flush
    for (let suit in suits) {
        if (suits[suit].length >= 5) {
            const suitCards = suits[suit].sort((a, b) => b.numValue - a.numValue);
            return { 
                value: 500 + getCardValue(suitCards[0]), 
                name: "Flush " + getSuitName(suit),
                suit: suit
            };
        }
    }
    
    return null;
}

function checkStraight(cards) {
    // Remove duplicate values
    const uniqueValues = [];
    const seen = {};
    
    for (let card of cards) {
        if (!seen[card.numValue]) {
            seen[card.numValue] = true;
            uniqueValues.push(card);
        }
    }
    
    // Sort by value
    uniqueValues.sort((a, b) => b.numValue - a.numValue);
    
    // Check for A-5 straight
    if (uniqueValues.length >= 5 && 
        uniqueValues[0].numValue === 14 && 
        uniqueValues.some(c => c.numValue === 5) &&
        uniqueValues.some(c => c.numValue === 4) &&
        uniqueValues.some(c => c.numValue === 3) &&
        uniqueValues.some(c => c.numValue === 2)) {
        return { value: 405, name: "Straight to Five" };
    }
    
    // Check for regular straight
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i].numValue - uniqueValues[i+4].numValue === 4) {
            return { 
                value: 400 + uniqueValues[i].numValue, 
                name: "Straight to " + getCardName(uniqueValues[i].value) 
            };
        }
    }
    
    return null;
}

function checkThreeOfAKind(cards) {
    // Group cards by value
    const values = {};
    for (let card of cards) {
        if (!values[card.numValue]) values[card.numValue] = [];
        values[card.numValue].push(card);
    }
    
    // Find three of a kind
    for (let value in values) {
        if (values[value].length === 3) {
            return { 
                value: 300 + parseInt(value), 
                name: "Three of a Kind " + getCardName(values[value][0].value) 
            };
        }
    }
    
    return null;
}

function checkTwoPair(cards) {
    // Group cards by value
    const values = {};
    const pairs = [];
    
    for (let card of cards) {
        if (!values[card.numValue]) values[card.numValue] = [];
        values[card.numValue].push(card);
    }
    
    // Find pairs
    for (let value in values) {
        if (values[value].length === 2) {
            pairs.push(parseInt(value));
        }
    }
    
    // Sort pairs by value
    pairs.sort((a, b) => b - a);
    
    if (pairs.length >= 2) {
        return { 
            value: 200 + pairs[0], 
            name: "Two Pair " + getCardName(pairs[0].toString()) + " and " + getCardName(pairs[1].toString()) 
        };
    }
    
    return null;
}

function checkPair(cards) {
    // Group cards by value
    const values = {};
    for (let card of cards) {
        if (!values[card.numValue]) values[card.numValue] = [];
        values[card.numValue].push(card);
    }
    
    // Find pair
    for (let value in values) {
        if (values[value].length === 2) {
            return { 
                value: 100 + parseInt(value), 
                name: "Pair of " + getCardName(values[value][0].value) 
            };
        }
    }
    
    return null;
}

function getCardValue(card) {
    return card.numValue;
}
function getCardName(value) {
    switch (value) {
        case 'A': return 'Ace';
        case 'K': return 'King';
        case 'Q': return 'Queen';
        case 'J': return 'Jack';
        case '10': return 'Ten';
        case '9': return 'Nine';
        case '8': return 'Eight';
        case '7': return 'Seven';
        case '6': return 'Six';
        case '5': return 'Five';
        case '4': return 'Four';
        case '3': return 'Three';
        case '2': return 'Two';
        default: return value;
    }
}

function getSuitName(suit) {
    switch (suit) {
        case 'H': return 'Hearts';
        case 'D': return 'Diamonds';
        case 'C': return 'Clubs';
        case 'S': return 'Spades';
        default: return suit;
    }
}

function updatePlayerHandRanking() {
    // Only update if the player is still in the hand
    if (gameState.players[0].folded) {
        playerHandRank.textContent = "";
        return;
    }
    
    // Calculate hand strength only if we have community cards
    if (gameState.communityCards.length > 0) {
        const allCards = [...gameState.players[0].hand, ...gameState.communityCards];
        const handValue = evaluateHandStrength(allCards);
        playerHandRank.textContent = "Your hand: " + handValue.name;
    } else {
        playerHandRank.textContent = "";
    }
}

function robotPlay() {
    const player = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - player.bet;
    
    // Calculate what percentage of player's stack has already been committed to this hand
    const committedPercentage = player.bet / (player.points + player.bet);
    
    // Reduce fold probability based on commitment (linear scale from 0-100%)
    // At 50% committed, fold probability is cut in half
    // At 100% committed, fold probability becomes 0 (never fold)
    const foldAdjustment = Math.max(0, 1 - committedPercentage * 2);
    
    // Different behavior based on the robot's personality
    switch (player.name) {
        case "Foldy McFoldface":
            // This bot folds less often when already committed
            if (callAmount > 0 && Math.random() < 0.7 * foldAdjustment) {
                fold();
                return;
            }
            break;
            
        case "Calling Carl":
            // This bot loves to call, rarely raises
            if (callAmount > 0) {
                if (Math.random() < 0.9) {
                    call();
                    return;
                }
            }
            break;
            
        case "Raise 'Em Rachel":
            // This bot loves to raise when possible, but folds less when committed
            if (callAmount > 0 && Math.random() < 0.4 * foldAdjustment) {
                fold();
                return;
            }
            if (callAmount < player.points && Math.random() < 0.6) {
                const raiseAmount = Math.min(
                    player.points, 
                    callAmount + Math.floor(Math.random() * 3 + 1) * BIG_BLIND
                );
                raise(raiseAmount);
                return;
            }
            break;
    }
    
    // Default behavior if personality-based action wasn't taken
    
    // If no bet to call, check
    if (callAmount === 0) {
        check();
        return;
    }
    
    // Calculate pot odds
    const potOdds = callAmount / (gameState.pot + callAmount);
    
    // Simulate bot having some knowledge of hand strength
    let handStrength = 0.3; // Default mediocre hand
    
    // In later rounds, bots make better decisions
    if (gameState.communityCards.length > 0) {
        const allCards = [...player.hand, ...gameState.communityCards];
        const handValue = evaluateHandStrength(allCards);
        
        // Map hand value to a strength between 0 and 1
        if (handValue.value >= 800) handStrength = 0.95; // Straight flush or royal flush
        else if (handValue.value >= 700) handStrength = 0.9; // Four of a kind
        else if (handValue.value >= 600) handStrength = 0.85; // Full house
        else if (handValue.value >= 500) handStrength = 0.8; // Flush
        else if (handValue.value >= 400) handStrength = 0.7; // Straight
        else if (handValue.value >= 300) handStrength = 0.6; // Three of a kind
        else if (handValue.value >= 200) handStrength = 0.5; // Two pair
        else if (handValue.value >= 100) handStrength = 0.4; // Pair
        else handStrength = 0.3; // High card
    }
    
    // Add randomness to decision making
    handStrength += (Math.random() * 0.2 - 0.1);
    
    // Adjust fold threshold based on commitment
    const foldThreshold = potOdds * (1 - committedPercentage);
    
    // Decision making based on hand strength and pot odds
    if (handStrength > potOdds * 1.5) {
        // Strong hand relative to pot odds - raise sometimes
        if (handStrength > 0.7 && callAmount < player.points && Math.random() < 0.4) {
            const raiseAmount = Math.min(
                player.points, 
                callAmount + Math.floor(Math.random() * 3 + 1) * BIG_BLIND
            );
            raise(raiseAmount);
        } else {
            call();
        }
    } else if (handStrength > foldThreshold) {
        // Hand is worth calling, especially when committed
        call();
    } else {
        // Hand is not worth calling - fold unless it's cheap or already committed a lot
        if (callAmount <= BIG_BLIND || callAmount <= player.points * 0.1 || committedPercentage > 0.3) {
            call();
        } else {
            fold();
        }
    }
}

// Player action functions
function fold() {
    const player = gameState.players[gameState.currentPlayer];
    player.folded = true;
    
    gameMessage.textContent = player.name + " folds.";
    
    // Increment player action counter
    gameState.playersActed++;
    
    // Check if only one player remains
    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
        // End the hand immediately
        gameState.gamePhase = "showdown";
        evaluateHands();
        return;
    }
    
    nextPlayer();
}

function check() {
    const player = gameState.players[gameState.currentPlayer];
    
    gameMessage.textContent = player.name + " checks.";
    
    // Increment player action counter
    gameState.playersActed++;
    
    nextPlayer();
}

function call() {
    const player = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - player.bet;
    
    if (callAmount <= 0) {
        check();
        return;
    }
    
    if (callAmount >= player.points) {
        // All-in call
        placeBet(player, player.points);
        gameMessage.textContent = player.name + " calls all-in with " + player.points + "!";
    } else {
        placeBet(player, callAmount);
        gameMessage.textContent = player.name + " calls " + callAmount + ".";
    }
    
    // Increment player action counter
    gameState.playersActed++;
    
    nextPlayer();
}

function raise(amount) {
    const player = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - player.bet;
    const totalBet = callAmount + amount;
    
    if (totalBet >= player.points) {
        // All-in raise
        placeBet(player, player.points);
        gameMessage.textContent = player.name + " raises all-in to " + player.bet + "!";
    } else {
        placeBet(player, totalBet);
        gameMessage.textContent = player.name + " raises to " + player.bet + ".";
    }
    
    // When there's a raise, reset the action counter
    // Because everyone needs to act again
    gameState.playersActed = 1; // Count the raiser
    
    nextPlayer();
}

// Event listeners for UI controls
dealBtn.addEventListener('click', dealCards);

foldBtn.addEventListener('click', function() {
    if (gameState.currentPlayer === 0) {
        fold();
    }
});

checkCallBtn.addEventListener('click', function() {
    if (gameState.currentPlayer === 0) {
        const callAmount = gameState.currentBet - gameState.players[0].bet;
        
        if (callAmount <= 0) {
            check();
        } else {
            call();
        }
    }
});

betRaiseBtn.addEventListener('click', function() {
    if (gameState.currentPlayer === 0) {
        const amount = parseInt(betSlider.value);
        raise(amount);
    }
});

betSlider.addEventListener('input', function() {
    betAmount.textContent = betSlider.value;
});

// Initialize the game
function initGame() {
    // Reset game state
    gameState.handOver = true;
    gameState.pot = 0;
    gameState.communityCards = [];
    gameState.playersActed = 0; // Add this line to track player actions
    gameState.roundComplete = false; // Add this to track when a round is done
    
    // Reset player cards
    gameState.players.forEach(player => {
        player.hand = [];
        player.bet = 0;
        player.folded = false;
        player.isAllIn = false;
        player.isDealer = false; // Reset dealer status
    });
    
    // Set dealer button
    gameState.players[gameState.dealerIndex].isDealer = true;
    
    // Render initial table
    renderTable();
    
    // Make deal button enabled immediately
    dealBtn.disabled = false;
    foldBtn.disabled = true;
    checkCallBtn.disabled = true;
    betRaiseBtn.disabled = true;
    betSlider.disabled = true;
    
    // Clear message
    gameMessage.textContent = "Welcome to Poker! Click 'Deal' to start a new hand.";
}
// Initialize when page loads
window.onload = function() {
    initGame();
};
