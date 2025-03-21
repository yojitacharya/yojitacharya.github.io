const WORD_LENGTH = 5;
const TRIES = 6;
let secretWord = '';
let currentGuess = [];
let currentRow = 0;
let gameOver = false;

const wordList = [
    "WHICH", "THERE", "THEIR", "ABOUT", "WOULD", "THESE", "OTHER", "WORDS",
    "COULD", "WRITE", "FIRST", "WATER", "AFTER", "WHERE", "RIGHT", "THINK",
    "THREE", "YEARS", "PLACE", "SOUND", "GREAT", "AGAIN", "STILL", "EVERY",
    "SMALL", "FOUND", "THOSE", "NEVER", "UNDER", "MIGHT", "WHILE", "HOUSE",
    "WORLD", "BELOW", "ASKED", "GOING", "LARGE", "UNTIL", "ALONG", "SHALL",
    "BEING", "OFTEN", "EARTH", "BEGAN", "SINCE", "STUDY", "NIGHT", "LIGHT",
    "ABOVE", "PAPER", "PARTS", "YOUNG", "STORY", "POINT", "TIMES", "HEARD",
    "WHOLE", "WHITE", "GIVEN", "MEANS", "MUSIC", "MILES", "THING", "TODAY",
    "LATER", "USING", "MONEY", "LINES", "ORDER", "GROUP", "AMONG", "LEARN",
    "KNOWN", "SPACE", "TABLE", "EARLY", "TREES", "SHORT", "HANDS", "STATE",
    "BLACK", "SHOWN", "STOOD", "FRONT", "VOICE", "KINDS", "MAKES", "COMES",
    "CLOSE", "POWER", "LIVED", "VOWEL", "TAKEN", "BUILT", "HEART", "READY",
    "QUITE", "CLASS", "BRING", "ROUND", "HORSE", "SHOWS", "PIECE", "GREEN",
    "STAND", "BIRDS", "START", "RIVER", "TRIED", "LEAST", "FIELD", "WHOSE",
    "GIRLS", "LEAVE", "ADDED", "COLOR", "THIRD", "HOURS", "MOVED", "PLANT",
    "DOING", "NAMES", "FORMS", "HEAVY", "IDEAS", "CRIED", "CHECK", "FLOOR",
    "BEGIN", "WOMAN", "ALONE", "PLANE", "SPELL", "WATCH", "CARRY", "WROTE",
    "CLEAR", "NAMED", "BOOKS", "CHILD", "GLASS", "HUMAN", "TAKES", "PARTY",
    "BUILD", "SEEMS", "BLOOD", "SIDES", "SEVEN", "MOUTH", "SOLVE", "NORTH",
    "VALUE", "DEATH", "MAYBE", "HAPPY", "TELLS", "GIVES", "LOOKS", "SHAPE",
    "LIVES", "STEPS", "AREAS", "SENSE", "SPEAK", "FORCE", "OCEAN", "SPEED",
    "WOMEN", "METAL", "SOUTH", "GRASS", "SCALE", "CELLS", "LOWER", "SLEEP",
    "WRONG", "PAGES", "SHIPS", "NEEDS", "ROCKS", "EIGHT", "MAJOR", "LEVEL",
    "TOTAL", "AHEAD", "REACH", "STARS", "STORE", "SIGHT", "TERMS", "CATCH",
    "WORKS", "BOARD", "COVER", "SONGS", "EQUAL", "STONE", "WAVES", "GUESS",
    "DANCE", "SPOKE", "BREAK", "CAUSE", "RADIO", "WEEKS", "LANDS", "BASIC",
    "LIKED", "TRADE", "FRESH", "FINAL", "FIGHT", "MEANT", "DRIVE", "SPENT",
    "LOCAL", "WAXES", "KNOWS", "TRAIN", "BREAD", "HOMES", "TEETH", "COAST",
    "THICK", "BROWN", "CLEAN", "QUIET", "SUGAR", "FACTS", "STEEL", "FORTH",
    "RULES", "NOTES", "UNITS", "PEACE", "MONTH", "VERBS", "SEEDS", "HELPS",
    "SHARP", "VISIT", "WOODS", "CHIEF", "WALLS", "CROSS", "WINGS", "GROWN",
    "CASES", "FOODS", "CROPS", "FRUIT", "STICK", "WANTS", "STAGE", "SHEEP",
    "NOUNS", "PLAIN", "DRINK", "BONES", "APART", "TURNS", "MOVES", "TOUCH",
    "ANGLE", "BASED", "RANGE", "MARKS", "TIRED", "OLDER", "FARMS", "SPEND",
    "SHOES", "GOODS", "CHAIR", "TWICE", "CENTS", "EMPTY", "ALIKE", "STYLE",
    "BROKE", "PAIRS", "COUNT", "ENJOY", "SCORE", "SHORE", "ROOTS", "PAINT",
    "HEADS", "SHOOK", "SERVE", "ANGRY", "CROWD", "WHEEL", "QUICK", "DRESS",
    "SHARE", "ALIVE", "NOISE", "SOLID", "CLOTH", "SIGNS", "HILLS", "TYPES",
    "DRAWN", "WORTH", "TRUCK", "PIANO", "UPPER", "LOVED", "USUAL", "FACES",
    "DROVE", "CABIN", "BOATS", "TOWNS", "PROUD", "COURT", "MODEL", "PRIME",
    "FIFTY", "PLANS", "YARDS", "PROVE", "TOOLS", "PRICE", "SHEET", "SMELL",
    "BOXES", "RAISE", "MATCH", "TRUTH", "ROADS", "THREW", "ENEMY", "LUNCH",
    "CHART", "SCENE", "GRAPH", "DOUBT", "GUIDE", "WINDS", "BLOCK", "GRAIN",
    "SMOKE", "MIXED", "GAMES", "WAGON", "SWEET", "TOPIC", "EXTRA", "PLATE",
    "TITLE", "KNIFE", "FENCE", "FALLS", "CLOUD", "WHEAT", "PLAYS", "ENTER",
    "BROAD", "STEAM", "ATOMS", "PRESS", "LYING", "BASIS", "CLOCK", "TASTE",
    "GROWS", "THANK", "STORM", "AGREE", "BRAIN", "TRACK", "SMILE", "FUNNY",
    "BEACH", "STOCK", "HURRY", "SAVED", "SORRY", "GIANT", "TRAIL", "OFFER",
    "OUGHT", "ROUGH", "DAILY", "AVOID", "KEEPS", "THROW", "ALLOW", "CREAM",
    "LAUGH", "EDGES", "TEACH", "FRAME", "BELLS", "DREAM", "MAGIC", "OCCUR",
    "ENDED", "CHORD", "FALSE", "SKILL", "HOLES", "DOZEN", "BRAVE", "APPLE",
    "CLIMB", "OUTER", "PITCH", "RULER", "HOLDS", "FIXED", "COSTS", "CALLS",
    "BLANK", "STAFF", "LABOR", "EATEN", "YOUTH", "TONES", "HONOR", "GLOBE",
    "GASES", "DOORS", "POLES", "LOOSE", "APPLY", "TEARS", "EXACT", "BRUSH",
    "CHEST", "LAYER", "WHALE", "MINOR", "FAITH", "TESTS", "JUDGE", "ITEMS",
    "WORRY", "WASTE", "HOPED", "STRIP", "BEGUN", "ASIDE", "LAKES", "BOUND",
    "DEPTH", "CANDY", "EVENT", "WORSE", "AWARE", "SHELL", "ROOMS", "RANCH",
    "IMAGE", "SNAKE", "ALOUD", "DRIED", "LIKES", "MOTOR", "POUND", "KNEES",
    "REFER", "FULLY", "CHAIN", "SHIRT", "FLOUR", "DROPS", "SPITE", "ORBIT",
    "BANKS", "SHOOT", "CURVE", "TRIBE", "TIGHT", "BLIND", "SLEPT", "SHADE",
    "CLAIM", "FLIES", "THEME", "QUEEN", "FIFTH", "UNION", "HENCE", "STRAW",
    "ENTRY", "ISSUE", "BIRTH", "FEELS", "ANGER", "BRIEF", "RHYME", "GLORY",
    "GUARD", "FLOWS", "FLESH", "OWNED", "TRICK", "YOURS", "SIZES", "NOTED",
    "WIDTH", "BURST", "ROUTE", "LUNGS", "UNCLE", "BEARS", "ROYAL", "KINGS",
    "FORTY", "TRIAL", "CARDS", "BRASS", "OPERA", "CHOSE", "OWNER", "VAPOR",
    "BEATS", "MOUSE", "TOUGH", "WIRES", "METER", "TOWER", "FINDS", "INNER",
    "STUCK", "ARROW", "POEMS", "LABEL", "SWING", "SOLAR", "TRULY", "TENSE",
    "BEANS", "SPLIT", "RISES", "WEIGH", "HOTEL", "STEMS", "PRIDE", "SWUNG",
    "GRADE", "DIGIT", "BADLY", "BOOTS", "PILOT", "SALES", "SWEPT", "LUCKY",
    "PRIZE", "STOVE", "TUBES", "ACRES", "WOUND", "STEEP", "SLIDE", "TRUNK",
    "ERROR", "PORCH", "EXIST", "FACED", "MINES", "MARRY", "JUICE", "RACED",
    "WAVED", "GOOSE", "TRUST", "FEWER", "FAVOR", "MILLS", "VIEWS", "JOINT",
    "EAGER", "SPOTS", "BLEND", "RINGS", "ADULT", "INDEX", "NAILS", "HORNS",
    "BALLS", "FLAME", "RATES", "DRILL", "TRACE", "SKINS", "WAXED", "SEATS",
    "STUFF", "RATIO", "MINDS", "DIRTY", "SILLY", "COINS", "HELLO", "TRIPS",
    "LEADS", "RIFLE", "HOPES", "BASES", "SHINE", "BENCH", "MORAL", "FIRES",
    "MEALS", "SHAKE", "SHOPS", "CYCLE", "MOVIE", "SLOPE", "CANOE", "TEAMS",
    "FOLKS", "FIRED", "BANDS", "THUMB", "SHOUT", "CANAL", "HABIT", "REPLY",
    "RULED", "FEVER", "CRUST", "SHELF", "WALKS", "MIDST", "CRACK", "PRINT",
    "TALES", "COACH", "STIFF", "FLOOD", "VERSE", "AWAKE", "ROCKY", "MARCH",
    "FAULT", "SWIFT", "FAINT", "CIVIL", "GHOST", "FEAST", "BLADE", "LIMIT",
    "GERMS", "READS", "DUCKS", "DAIRY", "WORST", "GIFTS", "LISTS", "STOPS",
    "RAPID", "BRICK", "CLAWS", "BEADS", "BEAST", "SKIRT", "CAKES", "LIONS",
    "FROGS", "TRIES", "NERVE", "GRAND", "ARMED", "TREAT", "HONEY", "MOIST",
    "LEGAL", "PENNY", "CROWN", "SHOCK", "TAXES", "SIXTY", "ALTAR", "PULLS",
    "SPORT", "DRUMS", "TALKS", "DYING", "DATES", "DRANK", "BLOWS", "LEVER",
    "WAGES", "PROOF", "DRUGS", "TANKS", "SINGS", "TAILS", "PAUSE", "HERDS",
    "AROSE", "HATED", "CLUES", "NOVEL", "SHAME", "BURNT", "RACES", "FLASH",
    "WEARY", "HEELS", "TOKEN", "COATS", "SPARE", "SHINY", "ALARM", "DIMES",
    "SIXTH", "CLERK", "MERCY", "SUNNY", "GUEST", "FLOAT", "SHONE", "PIPES",
    "WORMS", "BILLS", "SWEAT", "SUITS", "SMART", "UPSET", "RAINS", "SANDY",
    "RAINY", "PARKS", "SADLY", "FANCY", "RIDER", "UNITY", "BUNCH", "ROLLS",
    "CRASH", "CRAFT", "NEWLY", "GATES", "HATCH", "PATHS", "FUNDS", "WIDER",
    "GRACE", "GRAVE", "TIDES", "ADMIT", "SHIFT", "SAILS", "PUPIL", "TIGER",
    "ANGEL", "CRUEL", "AGENT", "DRAMA", "URGED", "PATCH", "NESTS", "VITAL",
    "SWORD", "BLAME", "WEEDS", "SCREW", "VOCAL", "BACON", "CHALK", "CARGO",
    "CRAZY", "ACTED", "GOATS", "ARISE", "WITCH", "LOVES", "DWELL", "BACKS",
    "ROPES", "SHOTS", "MERRY", "PHONE", "CHEEK", "PEAKS", "IDEAL", "BEARD",
    "EAGLE", "CREEK", "CRIES", "ASHES", "STALL", "YIELD", "MAYOR", "OPENS",
    "INPUT", "FLEET", "TOOTH", "CUBIC", "WIVES", "BURNS", "POETS", "APRON",
    "SPEAR", "ORGAN", "CLIFF", "STAMP", "PASTE", "RURAL", "BAKED", "CHASE",
    "SLICE", "SLANT", "KNOCK", "NOISY", "SORTS", "STAYS", "WIPED", "BLOWN",
    "PILED", "CLUBS", "CHEER", "WIDOW", "TWIST", "TENTH", "HIDES", "COMMA",
    "SWEEP", "SPOON", "STERN", "CREPT", "MAPLE", "DEEDS", "RIDES", "MUDDY",
    "CRIME", "JELLY", "RIDGE", "DRIFT", "DUSTY", "DEVIL", "TEMPO", "HUMOR",
    "SENDS", "STEAL", "TENTS", "WAIST", "ROSES", "REIGN", "NOBLE", "CHEAP",
    "DENSE", "LINEN", "GEESE", "WOVEN", "POSTS", "HIRED", "WRATH", "SALAD",
    "BOWED", "TIRES", "SHARK", "BELTS", "GRASP", "BLAST", "POLAR", "FUNGI",
    "TENDS", "PEARL", "LOADS", "JOKES", "VEINS", "FROST", "HEARS", "LOSES",
    "HOSTS", "DIVER", "PHASE", "TOADS", "ALERT", "TASKS", "SEAMS", "CORAL",
    "FOCUS", "NAKED", "PUPPY", "JUMPS", "SPOIL", "QUART", "MACRO", "FEARS",
    "FLUNG", "SPARK", "VIVID", "BROOK", "STEER", "SPRAY", "DECAY", "PORTS",
    "SOCKS", "URBAN", "GOALS", "GRANT", "MINUS", "FILMS", "TUNES", "SHAFT",
    "FIRMS", "SKIES", "BRIDE", "WRECK", "FLOCK", "STARE", "HOBBY", "BONDS",
    "DARED", "FADED", "THIEF", "CRUDE", "PANTS", "FLUTE", "VOTES", "TONAL",
    "RADAR", "WELLS", "SKULL", "HAIRS", "ARGUE", "WEARS", "DOLLS", "VOTED",
    "CAVES", "CARED", "BROOM", "SCENT", "CRANE", "SLAIN"
];
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageContainer = document.getElementById('message-container');

// Initialize the game and select a secret word when the script runs
initializeGame();

function initializeGame() {
    if (wordList && wordList.length > 0) {
        const validWords = wordList.map(word => word.toUpperCase().trim()).filter(word => word.length === WORD_LENGTH);
        if (validWords.length > 0) {
            secretWord = validWords[Math.floor(Math.random() * validWords.length)];
            currentGuess = [];
            currentRow = 0;
            gameOver = false;
            messageContainer.textContent = '';
            messageContainer.classList.remove('error');
            createGameBoard();
            createKeyboard();
            
            // Remove existing event listener before adding a new one
            document.removeEventListener('keydown', handleKeyPress);
            document.addEventListener('keydown', handleKeyPress);
        } else {
            console.error("No valid 5-letter words found in the provided word list.");
            messageContainer.textContent = "Error: No valid words found.";
            messageContainer.classList.add('error');
        }
    } else {
        console.error("Word list is empty or not defined.");
        messageContainer.textContent = "Error: Word list is missing.";
        messageContainer.classList.add('error');
    }
}

function createGameBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < TRIES; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            row.appendChild(tile);
        }
        gameBoard.appendChild(row);
    }
}

function createKeyboard() {
    const keys = [
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'
    ];

    keyboard.innerHTML = '';
    let currentRowElement = document.createElement('div');
    currentRowElement.classList.add('keyboard-row');
    keyboard.appendChild(currentRowElement);

    keys.forEach((key, index) => {
        const button = document.createElement('button');
        button.textContent = key;
        button.setAttribute('data-key', key); // Set the data-key to the key value
        button.addEventListener('click', handleKeyboardClick);
        if (key === 'ENTER' || key === 'DELETE') {
            button.classList.add('wide-button');
        }

        if (key === 'A') { // Start of the second row
            currentRowElement = document.createElement('div');
            currentRowElement.classList.add('keyboard-row');
            keyboard.appendChild(currentRowElement);
        } else if (key === 'ENTER') { // Start of the third row
            currentRowElement = document.createElement('div');
            currentRowElement.classList.add('keyboard-row');
            keyboard.appendChild(currentRowElement);
            const spacer = document.createElement('div');
            spacer.classList.add('spacer');
            currentRowElement.appendChild(spacer);
        }

        currentRowElement.appendChild(button);

        if (key === 'L') { // End of the second row
            const spacer = document.createElement('div');
            spacer.classList.add('spacer');
            currentRowElement.appendChild(spacer);
        }
    });

    // Add a spacer at the end of the last row for DELETE alignment
    const lastRow = keyboard.lastChild;
    const spacerEnd = document.createElement('div');
    spacerEnd.classList.add('spacer');
    lastRow.appendChild(spacerEnd);
}

function getCurrentRowTiles() {
    return Array.from(gameBoard.children[currentRow].children);
}

function updateTiles() {
    const tiles = getCurrentRowTiles();
    tiles.forEach((tile, index) => {
        // Clear all tiles first
        tile.textContent = '';
    });
    
    // Then update with current guess
    currentGuess.forEach((letter, index) => {
        tiles[index].textContent = letter;
    });
}

// Handle physical keyboard key presses
function handleKeyPress(event) {
    if (gameOver) return;
    
    const key = event.key.toUpperCase();
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        addLetter(key);
    }
}

// Handle on-screen keyboard clicks
function handleKeyboardClick(event) {
    if (gameOver) return;
    
    const key = event.target.getAttribute('data-key');
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'DELETE') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
        currentGuess.push(letter);
        updateTiles();
    }
}

function deleteLetter() {
    if (currentGuess.length > 0) {
        currentGuess.pop();
        updateTiles();
    }
}

function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
        showMessage('Not enough letters!');
        return;
    }

    const guess = currentGuess.join('');
    const validWords = wordList.map(word => word.toUpperCase().trim()).filter(word => word.length === WORD_LENGTH);
    if (!validWords.includes(guess)) {
        showMessage('Not in word list!');
        return;
    }

    const tiles = getCurrentRowTiles();
    const guessLetters = [...currentGuess];
    const secretLetters = [...secretWord];
    const letterCounts = {};
    secretLetters.forEach(letter => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });

    // First pass for correct letters in the correct position
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] === secretLetters[i]) {
            tiles[i].classList.add('correct');
            updateKeyboardColor(guessLetters[i], 'correct');
            letterCounts[guessLetters[i]]--;
            guessLetters[i] = ''; // Mark as matched
            secretLetters[i] = ''; // Mark as matched
        }
    }

    // Second pass for correct letters in the wrong position
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] !== '') {
            const letterIndex = secretLetters.indexOf(guessLetters[i]);
            if (letterIndex !== -1 && letterCounts[guessLetters[i]] > 0) {
                tiles[i].classList.add('present');
                updateKeyboardColor(guessLetters[i], 'present');
                letterCounts[guessLetters[i]]--;
                secretLetters[letterIndex] = ''; // Mark as used
            } else {
                tiles[i].classList.add('absent');
                updateKeyboardColor(guessLetters[i], 'absent');
            }
        }
    }

    if (guess === secretWord) {
        gameOver = true;
        showMessage('You guessed it!');
        document.removeEventListener('keydown', handleKeyPress);
        return;
    }

    currentRow++;
    currentGuess = [];

    if (currentRow === TRIES) {
        gameOver = true;
        showMessage(`You ran out of tries! The word was ${secretWord}`);
        document.removeEventListener('keydown', handleKeyPress);
    }
}

function updateKeyboardColor(key, className) {
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) {
        if (className === 'correct') {
            button.classList.add('correct');
        } else if (className === 'present' && !button.classList.contains('correct')) {
            button.classList.add('present');
        } else if (className === 'absent' && !button.classList.contains('correct') && !button.classList.contains('present')) {
            button.classList.add('absent');
        }
    }
}

function showMessage(message) {
    messageContainer.textContent = message;
    messageContainer.classList.remove('error');
    setTimeout(() => {
        messageContainer.textContent = '';
    }, 3000);
}

function setMessage(message, isError = false) {
    messageContainer.textContent = message;
    messageContainer.classList.toggle('error', isError);
}