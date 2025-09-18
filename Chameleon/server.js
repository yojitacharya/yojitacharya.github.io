const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Game state management
const rooms = new Map();
const playerRooms = new Map();

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = null;
        this.votes = new Map();
        this.clues = [];
        this.hardMode = false;
    }

    addPlayer(id, name) {
        this.players.set(id, {
            id,
            name,
            isHost: id === this.hostId,
            role: null,
            hasVoted: false,
            hasGivenClue: false
        });
    }

    removePlayer(id) {
        this.players.delete(id);
        if (id === this.hostId && this.players.size > 0) {
            // Transfer host to another player
            const newHost = this.players.keys().next().value;
            this.hostId = newHost;
            this.players.get(newHost).isHost = true;
        }
    }

    // Accept boolean or string "true"/"false"; keep gameState in sync if present.
    setHardMode(enabled) {
        let parsed;
        if (typeof enabled === 'boolean') {
            parsed = enabled;
        } else if (typeof enabled === 'string') {
            parsed = enabled.toLowerCase() === 'true';
        } else {
            parsed = Boolean(enabled);
        }

        this.hardMode = parsed;

        if (this.gameState) {
            this.gameState.hardMode = parsed;
        }
    }

    // Start game. hardMode param may be boolean, string, or omitted.
    startGame(category, secretWord, wordList, hardMode) {
        // Normalize incoming hardMode param (boolean/string). If omitted (null), use room setting.
        let parsedParam = null;
        if (typeof hardMode === 'boolean') {
            parsedParam = hardMode;
        } else if (typeof hardMode === 'string') {
            parsedParam = hardMode.toLowerCase() === 'true';
        }

        const hm = (parsedParam === null) ? this.hardMode : parsedParam;

        this.clues = [];
        this.votes.clear();
        this.hardMode = hm; // store resolved value on room

        // Randomly select chameleon
        const playerIds = Array.from(this.players.keys());
        const chameleonId = playerIds[Math.floor(Math.random() * playerIds.length)];

        // Set roles
        this.players.forEach((player, id) => {
            player.role = id === chameleonId ? 'chameleon' : 'regular';
            player.hasGivenClue = false;
            player.hasVoted = false;
        });

        // Set game state
        this.gameState = {
            phase: 'clues',
            category,
            secretWord,
            wordList,
            chameleonId,
            currentTurnIndex: 0,
            turnOrder: this.shuffleArray(playerIds),
            playerCountForRound: this.players.size,
            hardMode: hm
        };

        return this.gameState;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getCurrentTurn() {
        if (!this.gameState) return null;
        return this.gameState.turnOrder[this.gameState.currentTurnIndex];
    }

    nextTurn() {
        if (!this.gameState) return null;

        this.gameState.currentTurnIndex++;

        // Check if all players have given clues
        if (this.gameState.currentTurnIndex >= this.gameState.turnOrder.length) {
            this.gameState.phase = 'voting';
            return null;
        }

        return this.getCurrentTurn();
    }

    addClue(playerId, clue) {
        const player = this.players.get(playerId);
        if (!player || player.hasGivenClue) return false;

        player.hasGivenClue = true;
        this.clues.push({
            playerId,
            player: player.name,
            clue
        });

        return true;
    }

    vote(voterId, suspectId) {
        if (this.gameState.phase !== 'voting') return false;

        const voter = this.players.get(voterId);
        if (!voter || voter.hasVoted) return false;

        voter.hasVoted = true;
        this.votes.set(voterId, suspectId);

        // Check if all players have voted
        const totalPlayers = this.gameState.playerCountForRound;
        const totalVotes = this.votes.size;

        // Determine vote progress
        const votingComplete = totalVotes === totalPlayers;
        const result = {
            voteProgress: !votingComplete,
            totalVotes,
            totalPlayers
        };

        if (votingComplete) {
            const tallyResult = this.tallyVotes();
            return { ...result, ...tallyResult };
        }

        return result;
    }

    tallyVotes() {
        const voteCounts = new Map();

        this.votes.forEach((suspectId) => {
            voteCounts.set(suspectId, (voteCounts.get(suspectId) || 0) + 1);
        });

        // Find player with most votes
        let maxVotes = 0;
        let mostVoted = null;
        let tiedPlayers = [];

        voteCounts.forEach((count, playerId) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVoted = playerId;
                tiedPlayers = [playerId];
            } else if (count === maxVotes && count > 0) {
                tiedPlayers.push(playerId);
            }
        });

        // Check if there's a tie and if chameleon is involved in the tie
        const isTie = tiedPlayers.length > 1;
        const chameleonInTie = isTie && tiedPlayers.includes(this.gameState.chameleonId);

        // Chameleon is caught if they have the most votes AND it's not a tie
        // OR if they are involved in a tie (chameleon loses ties)
        const chameleonCaught = (mostVoted === this.gameState.chameleonId && !isTie) || chameleonInTie;

        if (chameleonCaught) {
            this.gameState.phase = 'guessing';
        } else {
            this.gameState.phase = 'ended';
        }

        return {
            mostVoted: isTie ? null : mostVoted,
            chameleonCaught,
            voteCounts: Array.from(voteCounts.entries()),
            isTie,
            tiedPlayers
        };
    }

    checkGuess(guess) {
        if (!this.gameState || this.gameState.phase !== 'guessing') return null;

        const correct = guess.toLowerCase() === this.gameState.secretWord.toLowerCase();
        this.gameState.phase = 'ended';

        return {
            correct,
            secretWord: this.gameState.secretWord,
            chameleonWon: correct
        };
    }

    getPlayerList() {
        return Array.from(this.players.values());
    }

    getGameStateForPlayer(playerId) {
        if (!this.gameState) return null;

        const player = this.players.get(playerId);
        const state = {
            phase: this.gameState.phase,
            role: player.role,
            currentTurn: this.getCurrentTurn(),
            clues: this.clues,
            players: this.getPlayerList(),
            hardMode: this.gameState.hardMode
        };

        // For regular players, always show the secret word and category
        if (player.role !== 'chameleon') {
            state.category = this.gameState.category;
            state.secretWord = this.gameState.secretWord;
        } else {
            // For chameleon - handle hard mode vs normal mode
            if (this.gameState.hardMode) {
                state.category = "A Secret";
            } else {
                // Normal mode: chameleon gets category but not the secret word
                state.category = this.gameState.category;
                state.wordList = this.gameState.wordList;
            }
        }

        return state;
    }
}

// Generate room code
function generateRoomCode() {
    const characters = '0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('joinRoom', (data) => {
        const { playerName, roomCode } = data;
        let room;
        let isNewRoom = false;


      ,
            if (roomCode && rooms.has(roomCode)) {
            // Join existing room
            room = rooms.get(roomCode);
        } else {
            // Create new room
            const newCode = roomCode || generateRoomCode();
            room = new Room(newCode, socket.id);
            rooms.set(newCode, room);
            isNewRoom = true;
        }

        // Add player to room
        room.addPlayer(socket.id, playerName);
        playerRooms.set(socket.id, room.code);

        // Join socket room
        socket.join(room.code);

        // Send confirmation to player
        socket.emit('roomJoined', {
            roomCode: room.code,
            playerId: socket.id,
            isHost: socket.id === room.hostId
        });

        // Update all players in room
        io.to(room.code).emit('playersUpdate', room.getPlayerList());
    });

    // Handle hard mode toggle
    socket.on('toggleHardMode', (enabled) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return; // Only host can toggle

        room.setHardMode(enabled);

        // Broadcast hard mode status to all players
        io.to(room.code).emit('hardModeUpdate', room.hardMode);
    });

    socket.on('startGame', (data) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        // Accept either 'words' or 'wordList' from the client
        const { category, secretWord, words, wordList, hardMode } = data;
        const resolvedWordList = Array.isArray(wordList) ? wordList : (Array.isArray(words) ? words : []);

        // Normalize hardMode param (boolean or string) and fall back to room.hardMode
        let parsedParam = null;
        if (typeof hardMode === 'boolean') {
            parsedParam = hardMode;
        } else if (typeof hardMode === 'string') {
            parsedParam = hardMode.toLowerCase() === 'true';
        }
        const effectiveHardMode = (parsedParam === null) ? room.hardMode : parsedParam;

        console.log(`[startGame] room=${roomCode} host=${socket.id} effectiveHardMode=${effectiveHardMode}`);

        room.startGame(category, secretWord, resolvedWordList, effectiveHardMode);

        // Send game state to each player
        room.players.forEach((player, playerId) => {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.emit('gameStarted', room.getGameStateForPlayer(playerId));
            }
        });

        // Start first turn
        const firstPlayer = room.getCurrentTurn();
        io.to(room.code).emit('turnUpdate', firstPlayer);
    });

    socket.on('submitClue', (clue) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;

        // Verify it's this player's turn
        if (room.getCurrentTurn() !== socket.id) return;

        // Add clue
        if (room.addClue(socket.id, clue)) {
            // Broadcast clue to all players
            io.to(room.code).emit('clueSubmitted', {
                player: room.players.get(socket.id).name,
                clue: clue
            });

            // Move to next turn
            const nextPlayer = room.nextTurn();

            if (nextPlayer) {
                io.to(room.code).emit('turnUpdate', nextPlayer);
            } else {
                // All clues given, start voting phase
                room.gameState.phase = 'voting';
                io.to(room.code).emit('votingPhase');
            }
        }
    });

    socket.on('vote', (suspectId) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;

        const result = room.vote(socket.id, suspectId);

        if (result) {
            if (result.voteProgress) {
                // Still collecting votes - update progress
                io.to(room.code).emit('voteUpdate', {
                    totalVotes: result.totalVotes,
                    totalPlayers: result.totalPlayers
                });
            } else {
                // All votes collected - show results
                if (result.chameleonCaught) {
                    const chameleon = room.players.get(room.gameState.chameleonId);
                    io.to(room.code).emit('chameleonCaught', {
                        chameleonId: room.gameState.chameleonId,
                        chameleonName: chameleon.name,
                        voteResults: result
                    });
                } else {
                    // Chameleon wins - they weren't caught
                    const chameleon = room.players.get(room.gameState.chameleonId);
                    io.to(room.code).emit('gameEnd', {
                        chameleonWon: true,
                        chameleonName: chameleon.name,
                        secretWord: room.gameState.secretWord,
                        guessedCorrectly: false,
                        voteResults: result
                    });
                }
            }
        }
    });

    socket.on('chameleonGuess', (guess) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;

        // Verify this is the chameleon
        if (socket.id !== room.gameState.chameleonId) return;

        const result = room.checkGuess(guess);
        if (result) {
            const chameleon = room.players.get(room.gameState.chameleonId);
            io.to(room.code).emit('gameEnd', {
                chameleonWon: result.chameleonWon,
                chameleonName: chameleon.name,
                secretWord: result.secretWord,
                guessedCorrectly: result.correct
            });
        }
    });

    socket.on('chatMessage', (message) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        io.to(room.code).emit('chatMessage', {
            player: player.name,
            message: message
        });
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        const roomCode = playerRooms.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                room.removePlayer(socket.id);
                playerRooms.delete(socket.id);

                if (room.players.size === 0) {
                    // Delete empty room
                    rooms.delete(roomCode);
                } else {
                    // Update remaining players
                    io.to(room.code).emit('playersUpdate', room.getPlayerList());
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Chameleon Game Server running on port ${PORT}`);
});
