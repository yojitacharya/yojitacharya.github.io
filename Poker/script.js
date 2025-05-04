// Continue renderControls() function
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
    const player = gameState.players[0]; // Human player
    
    dealBtn.disabled = true;
    foldBtn.disabled = !isPlayerTurn || player.folded || player.isAllIn;
    
    if (isPlayerTurn && !player.folded && !player.isAllIn) {
        // Set Check/Call button
        const callAmount = gameState.currentBet - player.bet;
        
        if (callAmount === 0) {
            checkCallBtn.textContent = "Check";
            checkCallBtn.disabled = false;
        } else {
            checkCallBtn.textContent = "Call " + callAmount;
            checkCallBtn.disabled = callAmount > player.points;
        }
        
        // Set Bet/Raise button and slider
        const minRaise = gameState.currentBet + BIG_BLIND;
        const maxBet = player.points + player.bet;
        
        if (gameState.currentBet === 0) {
            betRaiseBtn.textContent = "Bet";
            betRaiseBtn.disabled = player.points === 0;
        } else {
            betRaiseBtn.textContent = "Raise";
            betRaiseBtn.disabled = minRaise > maxBet;
        }
        
        // Set slider min/max/value
        betSlider.min = minRaise;
        betSlider.max = maxBet;
        betSlider.value = Math.min(minRaise, maxBet);
        betSlider.disabled = betRaiseBtn.disabled;
        
        // Update bet amount display
        betAmount.textContent = betSlider.value;
    } else {
        checkCallBtn.disabled = true;
        betRaiseBtn.disabled = true;
        betSlider.disabled = true;
    }
}

// Update player hand ranking display
function updatePlayerHandRanking() {
    if (gameState.communityCards.length >= 3) {
        const player = gameState.players[0]; // Human player
        const handResult = evaluateHand([...player.hand, ...gameState.communityCards]);
        playerHandRank.textContent = handResult.name;
    } else {
        playerHandRank.textContent = "";
    }
}

// Hand evaluation functions
function evaluateHands() {
    gameState.handOver = true;
    
    // Evaluate each player's hand
    const activePlayers = gameState.players.filter(player => !player.folded);
    
    if (activePlayers.length === 1) {
        // Only one player left - they win
        const winner = activePlayers[0];
        gameMessage.textContent = winner.name + " wins " + gameState.pot + " points!";
        winner.points += gameState.pot;
    } else {
        // Compare hands to find winners
        const playerResults = activePlayers.map(player => {
            const handResult = evaluateHand([...player.hand, ...gameState.communityCards]);
            return {
                player: player,
                hand: handResult
            };
        });
        
        // Sort by hand strength
        playerResults.sort((a, b) => {
            if (a.hand.strength !== b.hand.strength) {
                return b.hand.strength - a.hand.strength;
            }
            
            // If tied, compare kickers
            for (let i = 0; i < a.hand.kickers.length; i++) {
                if (a.hand.kickers[i] !== b.hand.kickers[i]) {
                    return b.hand.kickers[i] - a.hand.kickers[i];
                }
            }
            
            return 0; // True tie
        });
        
        // Find all winners (players with same best hand)
        const winners = [playerResults[0]];
        for (let i = 1; i < playerResults.length; i++) {
            const prevHand = playerResults[i-1].hand;
            const currHand = playerResults[i].hand;
            
            if (prevHand.strength === currHand.strength) {
                // Check kickers
                let isTie = true;
                for (let j = 0; j < prevHand.kickers.length; j++) {
                    if (prevHand.kickers[j] !== currHand.kickers[j]) {
                        isTie = false;
                        break;
                    }
                }
                
                if (isTie) {
                    winners.push(playerResults[i]);
                }
            } else {
                break;
            }
        }
        
        // Distribute pot among winners
        const winnerShare = Math.floor(gameState.pot / winners.length);
        const winnerNames = winners.map(w => w.player.name).join(", ");
        
        if (winners.length === 1) {
            gameMessage.textContent = winnerNames + " wins with " + winners[0].hand.name + " and gets " + winnerShare + " points!";
        } else {
            gameMessage.textContent = "Tie between " + winnerNames + " with " + winners[0].hand.name + ". Each gets " + winnerShare + " points.";
        }
        
        winners.forEach(winner => {
            winner.player.points += winnerShare;
        });
        
        // Handle any remaining points due to rounding
        const remainder = gameState.pot - (winnerShare * winners.length);
        if (remainder > 0) {
            winners[0].player.points += remainder;
        }
    }
    
    // Render final state
    renderTable();
    renderControls();
    
    // Check if any player is out of points
    const eliminatedPlayers = gameState.players.filter(player => player.points === 0);
    if (eliminatedPlayers.length > 0) {
        eliminatedPlayers.forEach(player => {
            if (player.id !== 1) { // Don't remove human player
                gameMessage.textContent += " " + player.name + " has been eliminated!";
            }
        });
    }
    
    // Check if game is over (human player out of points or only human left)
    if (gameState.players[0].points === 0) {
        gameMessage.textContent += " Game over! You're out of points.";
        dealBtn.disabled = true;
    } else if (gameState.players.filter(p => p.points > 0 && p.id !== 1).length === 0) {
        gameMessage.textContent += " Congratulations! You've won the game!";
        dealBtn.disabled = true;
    }
}

function evaluateHand(cards) {
    // Get combinations for best 5-card hand from 7 cards
    const combinations = getCombinations(cards, 5);
    let bestHand = { strength: -1, name: "", kickers: [] };
    
    for (let combo of combinations) {
        const result = getHandStrength(combo);
        if (result.strength > bestHand.strength) {
            bestHand = result;
        } else if (result.strength === bestHand.strength) {
            // Compare kickers
            for (let i = 0; i < result.kickers.length; i++) {
                if (result.kickers[i] > bestHand.kickers[i]) {
                    bestHand = result;
                    break;
                } else if (result.kickers[i] < bestHand.kickers[i]) {
                    break;
                }
            }
        }
    }
    
    return bestHand;
}

function getCombinations(cards, k) {
    const result = [];
    
    // Helper function to generate combinations
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        
        for (let i = start; i < cards.length; i++) {
            combo.push(cards[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return result;
}

function getHandStrength(cards) {
    // Sort cards by numeric value (descending)
    cards.sort((a, b) => b.numValue - a.numValue);
    
    // Check for flush
    const isFlush = cards.every(card => card.suit === cards[0].suit);
    
    // Check for straight
    let isStraight = true;
    for (let i = 1; i < cards.length; i++) {
        if (cards[i-1].numValue !== cards[i].numValue + 1) {
            // Handle Ace-low straight (A, 2, 3, 4, 5)
            if (i === 1 && cards[0].numValue === 14 && cards[1].numValue === 5 && cards[2].numValue === 4 && 
                cards[3].numValue === 3 && cards[4].numValue === 2) {
                // Rearrange cards for A-5 straight
                const ace = cards.shift();
                cards.push(ace);
                break;
            }
            isStraight = false;
            break;
        }
    }
    
    // Count card frequencies
    const valueCounts = {};
    cards.forEach(card => {
        valueCounts[card.numValue] = (valueCounts[card.numValue] || 0) + 1;
    });
    
    const counts = Object.entries(valueCounts).map(([value, count]) => ({
        value: parseInt(value),
        count: count
    }));
    
    counts.sort((a, b) => {
        if (a.count !== b.count) {
            return b.count - a.count; // Sort by frequency descending
        }
        return b.value - a.value; // Then by value descending
    });
    
    // Determine hand type and kickers
    let handStrength = HAND_HIGH_CARD;
    let handName = "High Card";
    let kickers = [];
    
    // Royal flush
    if (isFlush && isStraight && cards[0].numValue === 14) {
        handStrength = HAND_ROYAL_FLUSH;
        handName = "Royal Flush";
        kickers = [cards[0].numValue]; // Ace high
    }
    // Straight flush
    else if (isFlush && isStraight) {
        handStrength = HAND_STRAIGHT_FLUSH;
        handName = "Straight Flush";
        kickers = [cards[0].numValue]; // High card of straight
    }
    // Four of a kind
    else if (counts[0].count === 4) {
        handStrength = HAND_FOUR_KIND;
        handName = "Four of a Kind";
        kickers = [counts[0].value, counts[1].value]; // Quad value, kicker
    }
    // Full house
    else if (counts[0].count === 3 && counts[1].count === 2) {
        handStrength = HAND_FULL_HOUSE;
        handName = "Full House";
        kickers = [counts[0].value, counts[1].value]; // Triple value, pair value
    }
    // Flush
    else if (isFlush) {
        handStrength = HAND_FLUSH;
        handName = "Flush";
        kickers = cards.map(card => card.numValue); // All 5 cards as kickers
    }
    // Straight
    else if (isStraight) {
        handStrength = HAND_STRAIGHT;
        handName = "Straight";
        kickers = [cards[0].numValue]; // High card of straight
    }
    // Three of a kind
    else if (counts[0].count === 3) {
        handStrength = HAND_THREE_KIND;
        handName = "Three of a Kind";
        kickers = [counts[0].value, counts[1].value, counts[2].value]; // Triple value, kickers
    }
    // Two pair
    else if (counts[0].count === 2 && counts[1].count === 2) {
        handStrength = HAND_TWO_PAIR;
        handName = "Two Pair";
        kickers = [counts[0].value, counts[1].value, counts[2].value]; // First pair, second pair, kicker
    }
    // Pair
    else if (counts[0].count === 2) {
        handStrength = HAND_PAIR;
        handName = "Pair";
        kickers = [counts[0].value, counts[1].value, counts[2].value, counts[3].value]; // Pair value, kickers
    }
    // High card
    else {
        handStrength = HAND_HIGH_CARD;
        handName = "High Card";
        kickers = cards.map(card => card.numValue); // All 5 cards as kickers
    }
    
    return {
        strength: handStrength,
        name: handName,
        kickers: kickers
    };
}

// Player actions
function playerFold() {
    const player = gameState.players[gameState.currentPlayer];
    player.folded = true;
    
    gameMessage.textContent = player.name + " folds.";
    
    // Check if only one player remains
    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
        // Award pot to the last player standing
        const winner = activePlayers[0];
        winner.points += gameState.pot;
        gameMessage.textContent = winner.name + " wins " + gameState.pot + " points as everyone else folded!";
        
        gameState.handOver = true;
        renderTable();
        renderControls();
        return;
    }
    
    nextPlayer();
}

function playerCheckCall() {
    const player = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - player.bet;
    
    if (callAmount === 0) {
        gameMessage.textContent = player.name + " checks.";
    } else {
        placeBet(player, callAmount);
        gameMessage.textContent = player.name + " calls " + callAmount + ".";
    }
    
    nextPlayer();
}

function playerBetRaise() {
    const player = gameState.players[gameState.currentPlayer];
    const betValue = parseInt(betSlider.value);
    const raiseAmount = betValue - player.bet;
    
    placeBet(player, raiseAmount);
    
    if (gameState.currentBet === betValue) {
        gameMessage.textContent = player.name + " bets " + raiseAmount + ".";
    } else {
        gameMessage.textContent = player.name + " raises to " + betValue + ".";
    }
    
    nextPlayer();
}

// AI decision-making
function simulateAIThinking() {
    // Clear any existing timers
    if (gameState.timer) {
        clearTimeout(gameState.timer);
    }
    
    // Set a timer to make the AI decision after a delay
    gameState.timer = setTimeout(() => {
        makeAIDecision();
    }, AI_DECISION_TIME);
}

function makeAIDecision() {
    const player = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - player.bet;
    const potOdds = callAmount / (gameState.pot + callAmount);
    
    // Evaluate AI hand
    let handStrength = 0;
    let handEquity = 0;
    
    if (gameState.communityCards.length > 0) {
        const handResult = evaluateHand([...player.hand, ...gameState.communityCards]);
        handStrength = handResult.strength;
        
        // Basic equity calculation
        handEquity = (handStrength + 1) / 10;
        
        // Adjust for drawing hands
        if (gameState.communityCards.length < 5) {
            // Check for draw potential
            const hasFlushDraw = checkFlushDraw([...player.hand, ...gameState.communityCards]);
            const hasStraightDraw = checkStraightDraw([...player.hand, ...gameState.communityCards]);
            
            if (hasFlushDraw) handEquity += 0.15;
            if (hasStraightDraw) handEquity += 0.12;
        }
    } else {
        // Preflop hand strength
        handEquity = evaluatePreflopHand(player.hand);
    }
    
    // Adjust equity based on player style
    switch (player.style) {
        case "tight":
            handEquity *= 0.8;
            break;
        case "loose":
            handEquity *= 1.2;
            break;
        case "aggressive":
            handEquity *= 1.1;
            break;
    }
    
    // Basic decision making
    if (callAmount === 0) {
        // Check or bet
        if (handEquity > 0.6 || Math.random() < handEquity * 0.7) {
            // Bet with strong hands or sometimes with medium hands
            const betSize = Math.round(gameState.pot * (0.5 + Math.random() * 0.5));
            const maxBet = player.points;
            const actualBet = Math.min(betSize, maxBet);
            
            placeBet(player, actualBet);
            gameMessage.textContent = player.name + " bets " + actualBet + ".";
        } else {
            gameMessage.textContent = player.name + " checks.";
        }
    } else {
        // Call, raise, or fold
        if (handEquity > potOdds * 1.5 || handEquity > 0.7) {
            // Strong hand - raise
            if (Math.random() < handEquity * 0.8 && player.points > callAmount * 2) {
                const raiseSize = Math.round((callAmount + gameState.pot * 0.5) * (0.8 + Math.random() * 0.4));
                const maxRaise = player.points;
                const actualRaise = Math.min(raiseSize, maxRaise);
                
                placeBet(player, actualRaise);
                gameMessage.textContent = player.name + " raises to " + player.bet + ".";
            } else {
                // Just call
                placeBet(player, callAmount);
                gameMessage.textContent = player.name + " calls " + callAmount + ".";
            }
        } else if (handEquity > potOdds) {
            // Positive expected value - call
            placeBet(player, callAmount);
            gameMessage.textContent = player.name + " calls " + callAmount + ".";
        } else {
            // Negative expected value - fold
            player.folded = true;
            gameMessage.textContent = player.name + " folds.";
            
            // Check if only one player remains
            const activePlayers = gameState.players.filter(p => !p.folded);
            if (activePlayers.length === 1) {
                // Award pot to the last player standing
                const winner = activePlayers[0];
                winner.points += gameState.pot;
                gameMessage.textContent = winner.name + " wins " + gameState.pot + " points as everyone else folded!";
                
                gameState.handOver = true;
                renderTable();
                renderControls();
                return;
            }
        }
    }
    
    nextPlayer();
}

function checkFlushDraw(cards) {
    const suitCounts = { H: 0, D: 0, C: 0, S: 0 };
    
    cards.forEach(card => {
        suitCounts[card.suit]++;
    });
    
    return Object.values(suitCounts).some(count => count === 4);
}

function checkStraightDraw(cards) {
    // Count distinct values
    const values = {};
    cards.forEach(card => {
        values[card.numValue] = true;
        // Also count Ace as 1 for straight checks
        if (card.numValue === 14) values[1] = true;
    });
    
    // Check for 4 consecutive values
    const distinctValues = Object.keys(values).map(v => parseInt(v)).sort((a, b) => a - b);
    
    for (let i = 0; i <= distinctValues.length - 4; i++) {
        if (distinctValues[i+3] - distinctValues[i] === 3) {
            return true;
        }
    }
    
    return false;
}

function evaluatePreflopHand(hand) {
    // Sort cards by value
    const sortedHand = [...hand].sort((a, b) => b.numValue - a.numValue);
    const highCard = sortedHand[0].numValue;
    const lowCard = sortedHand[1].numValue;
    const isPair = highCard === lowCard;
    const isSuited = sortedHand[0].suit === sortedHand[1].suit;
    const isConnector = Math.abs(highCard - lowCard) <= 2;
    
    // Premium hands
    if (isPair && highCard >= 10) return 0.9; // High pairs
    if (isPair && highCard >= 7) return 0.7; // Medium pairs
    if (highCard === 14 && lowCard >= 10) return isSuited ? 0.85 : 0.75; // AK, AQ, AJ, AT
    if (highCard === 13 && lowCard >= 10) return isSuited ? 0.7 : 0.6; // KQ, KJ, KT
    
    // Medium hands
    if (isPair) return 0.55; // Low pairs
    if (highCard === 14 && lowCard >= 7) return isSuited ? 0.65 : 0.5; // A7s+
    if (highCard >= 10 && lowCard >= 10) return isSuited ? 0.65 : 0.5; // QJ, QT, JT
    if (isSuited && isConnector && highCard >= 10) return 0.6; // Suited connectors 10+
    
    // Weak hands
    if (highCard === 14) return isSuited ? 0.45 : 0.35; // Any Ace
    if (highCard >= 10) return isSuited ? 0.4 : 0.3; // Any face card
    if (isSuited && isConnector) return 0.4; // Suited connectors
    
    // Very weak hands
    return isSuited ? 0.3 : 0.2;
}

// Event listeners
dealBtn.addEventListener('click', dealCards);
foldBtn.addEventListener('click', playerFold);
checkCallBtn.addEventListener('click', playerCheckCall);
betRaiseBtn.addEventListener('click', playerBetRaise);

betSlider.addEventListener('input', function() {
    betAmount.textContent = this.value;
});

// Initialize game
function initGame() {
    // Set up the table
    renderTable();
    renderControls();
    
    gameMessage.textContent = "Press 'Deal' to start a new hand.";
}

// Start the game
initGame();