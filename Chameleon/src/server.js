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
app.use(express.static(path.join(__dirname, 'build')));

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

    startGame(category, secretWord, wordList) {
        // Reset game state
        this.clues = [];
        this.votes.clear();
        
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
        phase: 'clues', // clues, voting, guessing, ended
        category,
        secretWord,
        wordList,
        chameleonId,
        currentTurnIndex: 0,
        turnOrder: this.shuffleArray(playerIds),
        playerCountForRound: this.players.size // this hopefully will fix it pls fix it
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


    // In the Room class

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
        
        voteCounts.forEach((count, playerId) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVoted = playerId;
            }
        });
        
        // Check if chameleon was caught
        const chameleonCaught = mostVoted === this.gameState.chameleonId;
        
        if (chameleonCaught) {
            this.gameState.phase = 'guessing';
        } else {
            this.gameState.phase = 'ended';
        }
        
        return {
            mostVoted,
            chameleonCaught,
            voteCounts: Array.from(voteCounts.entries())
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
            category: this.gameState.category,
            role: player.role,
            currentTurn: this.getCurrentTurn(),
            clues: this.clues,
            players: this.getPlayerList()
        };
        
        // Only show secret word to non-chameleons
        if (player.role !== 'chameleon') {
            state.secretWord = this.gameState.secretWord;
        }
        
        // Show word list to chameleon for reference
        if (player.role === 'chameleon') {
            state.wordList = this.gameState.wordList;
        }
        
        return state;
    }
}

// Generate room code
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

    socket.on('startGame', (data) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        const { category, secretWord, words } = data;
        room.startGame(category, secretWord, words);

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


