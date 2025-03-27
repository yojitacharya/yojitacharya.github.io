const deck = [
    '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH',
    '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD',
    '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC',
    '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS'
  ];
  
  let player1Chips = 1000;
  let player2Chips = 1000;
  let pot = 0;
  let currentBet = 0;
  let player1Bet = 0;
  let player2Bet = 0;
  
  const dealButton = document.getElementById('deal-button');
  const betButton = document.getElementById('bet-button');
  const callButton = document.getElementById('call-button');
  const checkButton = document.getElementById('check-button');
  const foldButton = document.getElementById('fold-button');
  const showdownButton = document.getElementById('showdown-button');
  const messageDiv = document.getElementById('message');
  const communityCardsDiv = document.getElementById('community-cards');
  const potDiv = document.getElementById('pot');
  const player1ChipsDiv = document.getElementById('player1-chips');
  const player2ChipsDiv = document.getElementById('player2-chips');
  const player1CardsDiv = document.getElementById('player1-cards');
  const player2CardsDiv = document.getElementById('player2-cards');
  
  let communityCards = [];
  let player1Cards = [];
  let player2Cards = [];
  let deckInUse = [];
  let round = 'preflop';
  
  function shuffleDeck() {
    deckInUse = [...deck];
    for (let i = deckInUse.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckInUse[i], deckInUse[j]] = [deckInUse[j], deckInUse[i]];
    }
  }
  
  function getCardImage(card) {
    const suit = card.slice(-1);
    const value = card.slice(0, -1);
    const cardName = `${value}${suit.toUpperCase()}`;
    return `/images/${cardName}.png`; 
  }
  
  function renderGame() {
    // Render player 1's and player 2's cards
    player1CardsDiv.innerHTML = player1Cards.map(card => `<img class="card-image" src="${getCardImage(card)}" alt="${card}">`).join(' ');
    player2CardsDiv.innerHTML = player2Cards.map(card => `<img class="card-image" src="${getCardImage(card)}" alt="${card}">`).join(' ');
  
    // Render community cards
    communityCardsDiv.innerHTML = communityCards.map(card => `<img class="card-image" src="${getCardImage(card)}" alt="${card}">`).join(' ');
  
    // Render chips and pot
    player1ChipsDiv.innerHTML = `Chips: ${player1Chips}`;
    player2ChipsDiv.innerHTML = `Chips: ${player2Chips}`;
    potDiv.innerHTML = `Pot: ${pot}`;
  
    // Render round and current bet
    messageDiv.innerHTML = `Round: ${round} | Current Bet: ${currentBet}`;
  }
  
  function dealCards() {
    shuffleDeck();
    player1Cards = [deckInUse.pop(), deckInUse.pop()];
    player2Cards = [deckInUse.pop(), deckInUse.pop()];
  
    if (round === 'preflop') {
      communityCards = [];
      pot = 0;
      player1Bet = 0;
      player2Bet = 0;
      currentBet = 0;
    }
  
    renderGame();
  }
  
  function handleFlop() {
    round = 'flop';
    communityCards.push(deckInUse.pop(), deckInUse.pop(), deckInUse.pop());
    renderGame();
  }
  
  function handleTurn() {
    round = 'turn';
    communityCards.push(deckInUse.pop());
    renderGame();
  }
  
  function handleRiver() {
    if (round !== 'river') {
      round = 'river';  // Ensure we are at the river stage
      communityCards.push(deckInUse.pop());  // Add the river card to the community cards
      renderGame();  // Render the updated game state
    }
  }
  
  function showdown() {
    const player1BestHand = getBestHand([...player1Cards, ...communityCards]);
    const player2BestHand = getBestHand([...player2Cards, ...communityCards]);
  
    const winner = compareHands(player1BestHand, player2BestHand);
    messageDiv.innerHTML = `${winner} wins the pot of ${pot} chips!`;
  
    resetGame();
  }
  
  function resetGame() {
    player1Chips = 1000;
    player2Chips = 1000;
    pot = 0;
    player1Bet = 0;
    player2Bet = 0;
    currentBet = 0;
    round = 'preflop';
    renderGame();
  }
  
  function getCardValue(card) {
    const value = card.slice(0, -1);
    if (value === 'J') return 11;
    if (value === 'Q') return 12;
    if (value === 'K') return 13;
    if (value === 'A') return 14;
    return parseInt(value);
  }
  
  function getCardSuit(card) {
    return card.slice(-1);
  }
  
  function getBestHand(cards) {
    cards.sort((a, b) => getCardValue(b) - getCardValue(a));
    const suits = cards.map(getCardSuit);
    const values = cards.map(getCardValue);
  
    const flush = suits.every(suit => suit === suits[0]);
    const straight = values.every((val, i) => i === 0 || val === values[i - 1] - 1);
  
    if (flush && straight) return "Straight Flush";
    return "High Card: " + values[0];
  }
  
  function compareHands(player1Hand, player2Hand) {
    const handRankingOrder = ["High Card", "One Pair", "Two Pair", "Three of a Kind", "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"];
    
    const player1RankingIndex = handRankingOrder.indexOf(player1Hand);
    const player2RankingIndex = handRankingOrder.indexOf(player2Hand);
  
    if (player1RankingIndex > player2RankingIndex) {
      return "Player 1";
    } else if (player2RankingIndex > player1RankingIndex) {
      return "Player 2";
    }
  
    return "It's a tie";
  }
  
  // Event listeners for buttons
  dealButton.addEventListener('click', () => {
    if (round === 'preflop') {
      dealCards();
    } else if (round === 'flop') {
      handleFlop();
    } else if (round === 'turn') {
      handleTurn();
    } else if (round === 'river') {
      handleRiver();
    }
  });
  
  betButton.addEventListener('click', () => {
    const betAmount = 100;
    if (player1Chips >= betAmount && player2Chips >= betAmount) {
      player1Chips -= betAmount;
      player2Chips -= betAmount;
      pot += betAmount * 2;
      currentBet = betAmount;
      player1Bet = betAmount;
      player2Bet = betAmount;
      renderGame();
      messageDiv.innerHTML = 'Both players bet 100 chips!';
    } else {
      messageDiv.innerHTML = 'Not enough chips to bet!';
    }
  });
  
  callButton.addEventListener('click', () => {
    if (currentBet > 0) {
      if (player1Bet < currentBet) {
        callBet(1);
      } else if (player2Bet < currentBet) {
        callBet(2);
      }
    }
  });
  
  foldButton.addEventListener('click', () => {
    messageDiv.innerHTML = "A player has folded!";
    resetGame();
  });
  
  showdownButton.addEventListener('click', () => {
    showdown();
  });
  
  function callBet(playerNum) {
    const betAmount = currentBet;
    if (playerNum === 1 && player1Chips >= betAmount) {
      player1Chips -= betAmount;
      pot += betAmount;
      player1Bet = betAmount;
      renderGame();
    } else if (playerNum === 2 && player2Chips >= betAmount) {
      player2Chips -= betAmount;
      pot += betAmount;
      player2Bet = betAmount;
      renderGame();
    }
  }
  