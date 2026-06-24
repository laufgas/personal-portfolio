/**
 * Laufgas Slot Arcade - Pure JS Slot Machine & Retro Mini-Games
 * Colors:
 *   Yale Blue:     #184e77
 *   Bondi Blue:    #168aad
 *   Emerald:       #76c893
 *   Lime Cream:    #d9ed92
 *   Off-White:     #f1f7f4
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const reel1 = document.getElementById('reel-1');
    const reel2 = document.getElementById('reel-2');
    const reel3 = document.getElementById('reel-3');
    const spinBtn = document.getElementById('spin-btn');
    const slotCabinet = document.getElementById('slot-cabinet');
    const gameScreen = document.getElementById('game-screen');
    const canvas = document.getElementById('arcade-canvas');
    const ctx = canvas.getContext('2d');
    const winOverlay = document.getElementById('win-overlay');
    const winMessage = document.getElementById('win-message');
    const exitBtn = document.getElementById('exit-game-btn');

    // Symbols & Games Mapping
    const games = [
        { name: 'Pong', symbol: '🏓', key: 'pong' },
        { name: 'Snake', symbol: '🐍', key: 'snake' },
        { name: 'Space Invaders', symbol: '👾', key: 'space-invaders' },
        { name: 'Breakout', symbol: '🧱', key: 'breakout' }
    ];

    const symbolsList = ['🏓', '🐍', '👾', '🧱'];

    let slotState = 'idle'; // 'idle', 'spinning', 'won', 'playing'
    let currentAnimFrame = null;
    let currentGame = null;

    // --- Slot Machine Logic ---

    const slotLever = document.getElementById('slot-lever');
    const winCountLed = document.getElementById('base-win-count');

    // Synth Audio Effects (Web Audio API)
    function playSynthClickSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch(e) {}
    }

    function playWinSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.setValueAtTime(0.12, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.start();
            osc.stop(now + 0.5);
        } catch(e) {}
    }

    function playReelTickSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.03);
        } catch(e) {}
    }

    function triggerLeverPull() {
        if (slotState !== 'idle') return;
        slotLever.classList.add('pulled');
        playSynthClickSound();
        
        setTimeout(() => {
            slotLever.classList.remove('pulled');
        }, 1000);
        
        spinReels();
    }

    const billboardSpin = document.getElementById('billboard-spin');

    // Pull Lever / Spin Reels Trigger
    spinBtn.addEventListener('click', () => {
        triggerLeverPull();
    });

    slotLever.addEventListener('click', () => {
        triggerLeverPull();
    });

    billboardSpin.addEventListener('click', () => {
        triggerLeverPull();
    });

    exitBtn.addEventListener('click', () => {
        exitActiveGame();
    });

    function spinReels() {
        slotState = 'spinning';
        spinBtn.disabled = true;
        spinBtn.classList.add('active');
        
        // Pick a random game to win
        const winningGameIndex = Math.floor(Math.random() * games.length);
        const winningGame = games[winningGameIndex];
        
        // Build a strip of symbols for each reel
        const currentSymbol1 = reel1.querySelector('.reel-symbol-item')?.textContent || '🏓';
        const currentSymbol2 = reel2.querySelector('.reel-symbol-item')?.textContent || '👾';
        const currentSymbol3 = reel3.querySelector('.reel-symbol-item')?.textContent || '🧱';
        
        const len1 = 16;
        const len2 = 22;
        const len3 = 28;
        
        function buildStrip(reelEl, startSymbol, winningSymbol, length) {
            const stripSymbols = [startSymbol];
            for (let i = 1; i < length - 1; i++) {
                stripSymbols.push(symbolsList[Math.floor(Math.random() * symbolsList.length)]);
            }
            stripSymbols.push(winningSymbol);
            
            reelEl.innerHTML = '';
            stripSymbols.forEach(sym => {
                const item = document.createElement('div');
                item.className = 'reel-symbol-item';
                item.textContent = sym;
                reelEl.appendChild(item);
            });
        }
        
        buildStrip(reel1, currentSymbol1, winningGame.symbol, len1);
        buildStrip(reel2, currentSymbol2, winningGame.symbol, len2);
        buildStrip(reel3, currentSymbol3, winningGame.symbol, len3);
        
        // Reset positions
        [reel1, reel2, reel3].forEach(reel => {
            reel.style.transition = 'none';
            reel.style.transform = 'translateY(0px)';
            reel.style.filter = 'blur(4px)';
        });
        
        // Force reflow
        reel1.offsetHeight;
        
        const duration1 = 2000;
        const duration2 = 2400;
        const duration3 = 2800;
        const itemHeight = 109; // exact inner height of reel-window
        
        // Reel 1
        reel1.style.transition = `transform ${duration1}ms cubic-bezier(0.15, 0.85, 0.2, 1.15), filter ${duration1 * 0.75}ms ease-out`;
        reel1.style.transform = `translateY(-${(len1 - 1) * itemHeight}px)`;
        reel1.style.filter = 'none';
        
        // Reel 2
        reel2.style.transition = `transform ${duration2}ms cubic-bezier(0.15, 0.85, 0.2, 1.15), filter ${duration2 * 0.75}ms ease-out`;
        reel2.style.transform = `translateY(-${(len2 - 1) * itemHeight}px)`;
        reel2.style.filter = 'none';
        
        // Reel 3
        reel3.style.transition = `transform ${duration3}ms cubic-bezier(0.15, 0.85, 0.2, 1.15), filter ${duration3 * 0.75}ms ease-out`;
        reel3.style.transform = `translateY(-${(len3 - 1) * itemHeight}px)`;
        reel3.style.filter = 'none';
        
        // Play decelerating audio clicks for each reel
        playReelTicks(duration1);
        playReelTicks(duration2);
        playReelTicks(duration3);
        
        function playReelTicks(duration) {
            let elapsed = 0;
            let nextDelay = 55;
            
            function tick() {
                if (elapsed >= duration - 150) return;
                playReelTickSound();
                
                const progress = elapsed / duration;
                nextDelay = 55 + Math.pow(progress, 1.5) * 180;
                
                elapsed += nextDelay;
                setTimeout(tick, nextDelay);
            }
            
            tick();
        }
        
        // Settle & trigger jackpot win overlay
        setTimeout(() => {
            [reel1, reel2, reel3].forEach(reel => {
                reel.style.transition = 'none';
                reel.innerHTML = `<div class="reel-symbol-item">${winningGame.symbol}</div>`;
                reel.style.transform = 'translateY(0px)';
            });
            triggerWin(winningGame);
        }, duration3 + 200);
    }

    function triggerWin(winningGame) {
        slotState = 'won';
        playWinSound();
        winCountLed.textContent = '777';
        
        // Flashing win overlay
        winMessage.innerHTML = `JACKPOT!<br><span>3-OF-A-KIND UNLOCKED: ${winningGame.name.toUpperCase()}</span>`;
        winOverlay.classList.remove('hidden');
        winOverlay.classList.add('active');

        // Transition to active game after 2.2 seconds
        setTimeout(() => {
            winOverlay.classList.remove('active');
            winOverlay.classList.add('hidden');
            launchGame(winningGame.key);
        }, 2200);
    }

    function launchGame(gameKey) {
        slotState = 'playing';
        slotCabinet.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Set canvas resolution dynamically to fit frame
        canvas.width = 600;
        canvas.height = 400;

        // Reset inputs
        keys = {};

        // Stop any running animations
        if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);

        // Load specific game instance
        if (gameKey === 'pong') {
            currentGame = new PongGame(canvas, ctx, onGameOver);
        } else if (gameKey === 'snake') {
            currentGame = new SnakeGame(canvas, ctx, onGameOver);
        } else if (gameKey === 'space-invaders') {
            currentGame = new SpaceInvadersGame(canvas, ctx, onGameOver);
        } else if (gameKey === 'breakout') {
            currentGame = new BreakoutGame(canvas, ctx, onGameOver);
        }

        currentGame.start();
    }

    function onGameOver(resultMessage, didWin) {
        // Stop loops
        if (currentGame) currentGame.stop();
        if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);

        // Render game over text on canvas
        ctx.fillStyle = 'rgba(7, 19, 29, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (didWin) {
            ctx.fillStyle = '#ffd700'; // Gold
            ctx.font = '36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 25);

            ctx.fillStyle = '#76c893'; // Emerald
            ctx.font = '18px Inter, sans-serif';
            ctx.fillText(resultMessage, canvas.width / 2, canvas.height / 2 + 15);

            // Celebrate with confetti!
            if (window.confetti) {
                try {
                    window.confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                } catch (e) {}
            }
        } else {
            ctx.fillStyle = '#ff3b30'; // Red
            ctx.font = '36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 25);

            ctx.fillStyle = '#ff8787'; // Light Red
            ctx.font = '18px Inter, sans-serif';
            ctx.fillText(resultMessage, canvas.width / 2, canvas.height / 2 + 15);
        }

        ctx.fillStyle = '#6096ba'; // Steel blue
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Click "CASH OUT" to Spin Again', canvas.width / 2, canvas.height / 2 + 65);
    }

    function exitActiveGame() {
        if (currentGame) {
            currentGame.stop();
            currentGame = null;
        }
        if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);
        
        slotState = 'idle';
        winCountLed.textContent = '000';
        gameScreen.classList.add('hidden');
        slotCabinet.classList.remove('hidden');
        spinBtn.disabled = false;
        spinBtn.classList.remove('active');
    }

    // --- Controls Listeners ---
    let keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (slotState === 'playing') {
            // Prevent scrolling keys in canvas mode
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Capture mouse/touch coordinates inside canvas for paddle controllers (with scaling)
    let mouseX = 300;
    let mouseY = 200;

    function updateMousePosition(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        // Scale correctly based on canvas display size vs internal resolution (600x400)
        mouseX = (clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (clientY - rect.top) * (canvas.height / rect.height);
    }

    canvas.addEventListener('mousemove', (e) => {
        updateMousePosition(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
            // Prevent scrolling page while playing
            e.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
            // Allow tap-to-serve
            if (currentGame && currentGame.handleCanvasClick) {
                currentGame.handleCanvasClick(e);
            }
            e.preventDefault();
        }
    }, { passive: false });


    // ==========================================
    // 🏓 1. PONG GAME CLASS
    // ==========================================
    class PongGame {
        constructor(canvas, ctx, onGameOver) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.onGameOver = onGameOver;
            this.running = false;
            
            // Player paddle
            this.pWidth = 10;
            this.pHeight = 80;
            this.p1Y = canvas.height / 2 - this.pHeight / 2;
            
            // AI paddle
            this.p2Y = canvas.height / 2 - this.pHeight / 2;
            this.aiSpeed = 2.3; // Balanced with 40% slower ball velocity
            
            // Ball
            this.ballRadius = 6;
            this.ballX = 0;
            this.ballY = 0;
            this.ballSpeedX = 2.7; // 40% slower than 4.5
            this.ballSpeedY = 1.5; // 40% slower than 2.5
            
            this.waitingForTap = true;
            this.servingPaddle = 1; // 1 = Player serves, 2 = AI serves

            // Score
            this.score1 = 0;
            this.score2 = 0;
            this.maxScore = 5;

            // Click listener for serving
            this.clickHandler = (e) => this.handleCanvasClick(e);
            this.canvas.addEventListener('click', this.clickHandler);
        }

        start() {
            this.running = true;
            this.score1 = 0;
            this.score2 = 0;
            this.servingPaddle = 1; // Player serves first
            this.resetBall();
            this.loop();
        }

        stop() {
            this.running = false;
            this.canvas.removeEventListener('click', this.clickHandler);
        }

        resetBall() {
            this.waitingForTap = true;
        }

        handleCanvasClick(e) {
            if (this.waitingForTap) {
                this.waitingForTap = false;
                // launch towards opponent
                this.ballSpeedX = (this.servingPaddle === 1) ? 2.7 : -2.7;
                this.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.0);
            }
        }

        loop() {
            if (!this.running) return;
            this.update();
            if (!this.running) return;
            this.draw();
            currentAnimFrame = requestAnimationFrame(() => this.loop());
        }

        update() {
            // Player paddle follows mouse
            this.p1Y = mouseY - this.pHeight / 2;
            // clamp paddle inside canvas
            if (this.p1Y < 0) this.p1Y = 0;
            if (this.p1Y + this.pHeight > this.canvas.height) this.p1Y = this.canvas.height - this.pHeight;

            // AI paddle tracking ball (runs even when waiting to align paddle)
            const targetY = this.ballY - this.pHeight / 2;
            if (this.p2Y < targetY - 4) {
                this.p2Y += this.aiSpeed;
            } else if (this.p2Y > targetY + 4) {
                this.p2Y -= this.aiSpeed;
            }
            if (this.p2Y < 0) this.p2Y = 0;
            if (this.p2Y + this.pHeight > this.canvas.height) this.p2Y = this.canvas.height - this.pHeight;

            if (this.waitingForTap) {
                // Ball tracks serving paddle center
                if (this.servingPaddle === 1) {
                    this.ballX = 15 + this.pWidth + this.ballRadius + 2;
                    this.ballY = this.p1Y + this.pHeight / 2;
                } else {
                    this.ballX = this.canvas.width - 15 - this.pWidth - this.ballRadius - 2;
                    this.ballY = this.p2Y + this.pHeight / 2;
                }
            } else {
                // Ball physics
                this.ballX += this.ballSpeedX;
                this.ballY += this.ballSpeedY;

                // Top/Bottom wall collision
                if (this.ballY - this.ballRadius < 0 || this.ballY + this.ballRadius > this.canvas.height) {
                    this.ballSpeedY = -this.ballSpeedY;
                }

                // Player Paddle Collision (Left)
                if (this.ballX - this.ballRadius < 25 && this.ballX - this.ballRadius > 10) {
                    if (this.ballY > this.p1Y && this.ballY < this.p1Y + this.pHeight) {
                        this.ballSpeedX = -this.ballSpeedX * 1.05; // speed up slightly
                        // Clamp max speed
                        if (Math.abs(this.ballSpeedX) > 5.5) this.ballSpeedX = Math.sign(this.ballSpeedX) * 5.5;
                        
                        const hitPos = (this.ballY - (this.p1Y + this.pHeight / 2)) / (this.pHeight / 2);
                        this.ballSpeedY = hitPos * 2.7;
                    }
                }

                // AI Paddle Collision (Right)
                if (this.ballX + this.ballRadius > this.canvas.width - 25 && this.ballX + this.ballRadius < this.canvas.width - 10) {
                    if (this.ballY > this.p2Y && this.ballY < this.p2Y + this.pHeight) {
                        this.ballSpeedX = -this.ballSpeedX * 1.05;
                        if (Math.abs(this.ballSpeedX) > 5.5) this.ballSpeedX = Math.sign(this.ballSpeedX) * 5.5;

                        const hitPos = (this.ballY - (this.p2Y + this.pHeight / 2)) / (this.pHeight / 2);
                        this.ballSpeedY = hitPos * 2.7;
                    }
                }

                // Point Scoring
                if (this.ballX < 0) {
                    this.score2++; // AI scores
                    this.servingPaddle = 1; // Player serves next
                    if (this.score2 >= this.maxScore) {
                        this.onGameOver(`Opponent Wins! Final Score: ${this.score1} - ${this.score2}`, false);
                    } else {
                        this.resetBall();
                    }
                } else if (this.ballX > this.canvas.width) {
                    this.score1++; // Player scores
                    this.servingPaddle = 2; // AI serves next
                    if (this.score1 >= this.maxScore) {
                        this.onGameOver(`You Won! Final Score: ${this.score1} - ${this.score2}`, true);
                    } else {
                        this.resetBall();
                    }
                }
            }
        }

        draw() {
            // Draw background
            this.ctx.fillStyle = '#07131d'; // bg dark
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw center dash line
            this.ctx.strokeStyle = 'rgba(241, 247, 244, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, 0);
            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // reset

            // Player paddle
            this.ctx.fillStyle = '#76c893'; // Emerald
            this.ctx.fillRect(15, this.p1Y, this.pWidth, this.pHeight);

            // AI paddle
            this.ctx.fillStyle = '#168aad'; // Bondi Blue
            this.ctx.fillRect(this.canvas.width - 15 - this.pWidth, this.p2Y, this.pWidth, this.pHeight);

            // Ball
            this.ctx.fillStyle = '#d9ed92'; // Lime Cream
            this.ctx.beginPath();
            this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Scores
            this.ctx.fillStyle = '#f1f7f4';
            this.ctx.font = '36px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.score1, this.canvas.width / 4, 50);
            this.ctx.fillText(this.score2, (this.canvas.width * 3) / 4, 50);
            
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.fillStyle = '#52b69a'; // Ocean mist
            if (this.waitingForTap) {
                this.ctx.fillStyle = '#ff9f0a'; // Orange alert
                this.ctx.font = '18px Outfit, sans-serif';
                this.ctx.fillText('CLICK CANVAS TO SERVE BALL', this.canvas.width / 2, this.canvas.height / 2 + 30);
            } else {
                this.ctx.fillText('Move mouse vertically to control paddle', this.canvas.width / 2, this.canvas.height - 20);
            }
        }
    }


    // ==========================================
    // 🐍 2. SNAKE GAME CLASS
    // ==========================================
    class SnakeGame {
        constructor(canvas, ctx, onGameOver) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.onGameOver = onGameOver;
            this.running = false;
            
            this.gridSize = 20;
            this.snake = [];
            this.direction = 'right';
            this.nextDirection = 'right';
            this.food = { x: 0, y: 0 };
            this.score = 0;
            this.gameInterval = null;
            this.waitingForInput = true;

            // Touch swipe controls for mobile
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchStartHandler = (e) => {
                if (e.touches && e.touches[0]) {
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                }
            };
            this.touchEndHandler = (e) => {
                if (!e.changedTouches || e.changedTouches.length === 0) return;
                const diffX = e.changedTouches[0].clientX - this.touchStartX;
                const diffY = e.changedTouches[0].clientY - this.touchStartY;
                
                const threshold = 30; // min swipe distance in px
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > threshold) {
                        if (diffX > 0 && this.direction !== 'left') this.nextDirection = 'right';
                        else if (diffX < 0 && this.direction !== 'right') this.nextDirection = 'left';
                        this.waitingForInput = false; // Swipe starts the game!
                    }
                } else {
                    if (Math.abs(diffY) > threshold) {
                        if (diffY > 0 && this.direction !== 'up') this.nextDirection = 'down';
                        else if (diffY < 0 && this.direction !== 'down') this.nextDirection = 'up';
                        this.waitingForInput = false;
                    }
                }
            };
        }

        start() {
            this.running = true;
            this.score = 0;
            this.direction = 'right';
            this.nextDirection = 'right';
            this.waitingForInput = true;

            // Register touch handlers
            this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: true });
            this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: true });
            
            // Initial snake parts (middle of screen)
            this.snake = [
                { x: 10 * this.gridSize, y: 10 * this.gridSize },
                { x: 9 * this.gridSize, y: 10 * this.gridSize },
                { x: 8 * this.gridSize, y: 10 * this.gridSize }
            ];

            this.spawnFood();
            
            // Loop runs on fixed interval for block movement
            this.gameInterval = setInterval(() => {
                this.update();
                if (this.running) {
                    this.draw();
                }
            }, 100);
        }

        stop() {
            this.running = false;
            clearInterval(this.gameInterval);
            // Remove touch handlers
            this.canvas.removeEventListener('touchstart', this.touchStartHandler);
            this.canvas.removeEventListener('touchend', this.touchEndHandler);
        }

        spawnFood() {
            const cols = this.canvas.width / this.gridSize;
            const rows = this.canvas.height / this.gridSize;
            
            // Random grid position
            this.food.x = Math.floor(Math.random() * cols) * this.gridSize;
            this.food.y = Math.floor(Math.random() * rows) * this.gridSize;

            // Make sure food is not spawning on snake body
            for (let part of this.snake) {
                if (part.x === this.food.x && part.y === this.food.y) {
                    this.spawnFood();
                    break;
                }
            }
        }

        update() {
            // Apply direction locks
            let keyPressed = false;
            if ((keys['ArrowUp'] || keys['KeyW']) && this.direction !== 'down') { this.nextDirection = 'up'; keyPressed = true; }
            if ((keys['ArrowDown'] || keys['KeyS']) && this.direction !== 'up') { this.nextDirection = 'down'; keyPressed = true; }
            if ((keys['ArrowLeft'] || keys['KeyA']) && this.direction !== 'right') { this.nextDirection = 'left'; keyPressed = true; }
            if ((keys['ArrowRight'] || keys['KeyD']) && this.direction !== 'left') { this.nextDirection = 'right'; keyPressed = true; }

            if (this.waitingForInput) {
                if (keyPressed) {
                    this.waitingForInput = false;
                } else {
                    return; // Skip snake movement if waiting for starting input
                }
            }

            this.direction = this.nextDirection;

            const head = { ...this.snake[0] };

            if (this.direction === 'up') head.y -= this.gridSize;
            else if (this.direction === 'down') head.y += this.gridSize;
            else if (this.direction === 'left') head.x -= this.gridSize;
            else if (this.direction === 'right') head.x += this.gridSize;

            // Wall Collisions
            if (head.x < 0 || head.x >= this.canvas.width || head.y < 0 || head.y >= this.canvas.height) {
                this.onGameOver(`Hit the wall! Score: ${this.score}`, false);
                return;
            }

            // Self Collisions
            for (let i = 0; i < this.snake.length; i++) {
                if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                    this.onGameOver(`Bit yourself! Score: ${this.score}`, false);
                    return;
                }
            }

            // Add new head to start of snake array
            this.snake.unshift(head);

            // Eat Food check
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.spawnFood();
            } else {
                // Remove tail if didn't eat
                this.snake.pop();
            }
        }

        draw() {
            // Clear canvas
            this.ctx.fillStyle = '#07131d';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw Food
            this.ctx.fillStyle = '#d9ed92'; // Lime Cream
            this.ctx.fillRect(this.food.x + 2, this.food.y + 2, this.gridSize - 4, this.gridSize - 4);

            // Draw Snake
            this.snake.forEach((part, index) => {
                this.ctx.fillStyle = index === 0 ? '#76c893' : '#34a0a4'; // Emerald head, teal body
                this.ctx.fillRect(part.x + 1, part.y + 1, this.gridSize - 2, this.gridSize - 2);
            });

            // Score HUD
            this.ctx.fillStyle = '#f1f7f4';
            this.ctx.font = '16px Outfit, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);

            this.ctx.fillStyle = '#52b69a';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            if (this.waitingForInput) {
                this.ctx.fillStyle = '#ff9f0a'; // Orange alert
                this.ctx.font = '18px Outfit, sans-serif';
                this.ctx.fillText('PRESS ANY ARROW KEY TO START', this.canvas.width / 2, this.canvas.height / 2 + 30);
            } else {
                this.ctx.fillText('Control using Arrow Keys or WASD', this.canvas.width / 2, this.canvas.height - 15);
            }
        }
    }


    // ==========================================
    // 👾 3. SPACE INVADERS GAME CLASS
    // ==========================================
    class SpaceInvadersGame {
        constructor(canvas, ctx, onGameOver) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.onGameOver = onGameOver;
            this.running = false;
            
            // Player properties
            this.pWidth = 36;
            this.pHeight = 16;
            this.pX = canvas.width / 2 - this.pWidth / 2;
            this.pY = canvas.height - 40;
            this.pSpeed = 5;

            // Projectiles
            this.bullets = [];
            this.bulletWidth = 3;
            this.bulletHeight = 10;
            this.lastShot = 0;
            this.shotCooldown = 400; // ms

            // Invaders (Aliens)
            this.invaders = [];
            this.invaderRows = 3;
            this.invaderCols = 7;
            this.invaderWidth = 32;
            this.invaderHeight = 20;
            this.invaderDir = 1; // 1 = Right, -1 = Left
            this.invaderSpeed = 0.9;
            this.stepDownDistance = 15;

            // Retro pixel explosion particles
            this.particles = [];
        }

        start() {
            this.running = true;
            this.bullets = [];
            this.particles = [];
            this.pX = this.canvas.width / 2 - this.pWidth / 2;
            this.invaderDir = 1;

            // Spawn grid of aliens
            this.invaders = [];
            for (let r = 0; r < this.invaderRows; r++) {
                for (let c = 0; c < this.invaderCols; c++) {
                    this.invaders.push({
                        x: c * (this.invaderWidth + 24) + 60,
                        y: r * (this.invaderHeight + 16) + 50,
                        width: this.invaderWidth,
                        height: this.invaderHeight,
                        color: r === 0 ? '#d9ed92' : r === 1 ? '#76c893' : '#34a0a4' // different colors per row
                    });
                }
            }

            this.loop();
        }

        stop() {
            this.running = false;
        }

        loop() {
            if (!this.running) return;
            this.update();
            if (!this.running) return;
            this.draw();
            currentAnimFrame = requestAnimationFrame(() => this.loop());
        }

        update() {
            // Player controls
            const isKeyboardMoving = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
            
            if (isKeyboardMoving) {
                if (keys['ArrowLeft'] || keys['KeyA']) {
                    this.pX -= this.pSpeed;
                }
                if (keys['ArrowRight'] || keys['KeyD']) {
                    this.pX += this.pSpeed;
                }
            } else {
                // Smoothly center the player ship under touch/mouse position
                this.pX = mouseX - this.pWidth / 2;
            }

            // Clamp player
            if (this.pX < 10) this.pX = 10;
            if (this.pX + this.pWidth > this.canvas.width - 10) this.pX = this.canvas.width - 10 - this.pWidth;

            // Shoot bullets
            const now = Date.now();
            const isKeyboardShooting = keys['Space'];
            
            // Auto-shoot if using touch/mouse controls (keyboard is idle), or manually if spacebar pressed
            if (isKeyboardShooting || !isKeyboardMoving) {
                if (now - this.lastShot > this.shotCooldown) {
                    this.bullets.push({
                        x: this.pX + this.pWidth / 2 - this.bulletWidth / 2,
                        y: this.pY
                    });
                    this.lastShot = now;
                }
            }

            // Bullet movement
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                this.bullets[i].y -= 6;
                // remove offscreen
                if (this.bullets[i].y < 0) {
                    this.bullets.splice(i, 1);
                }
            }

            // Invaders movement
            let hitEdge = false;
            for (let inv of this.invaders) {
                inv.x += this.invaderSpeed * this.invaderDir;
                // Check if any invader touches edges
                if (inv.x + inv.width > this.canvas.width - 10 || inv.x < 10) {
                    hitEdge = true;
                }
            }

            if (hitEdge) {
                this.invaderDir = -this.invaderDir;
                // Move down and speed up slightly
                this.invaders.forEach(inv => inv.y += this.stepDownDistance);
                this.invaderSpeed += 0.08;
            }

            // Check bullet/invader collisions
            for (let b = this.bullets.length - 1; b >= 0; b--) {
                const bullet = this.bullets[b];
                for (let a = this.invaders.length - 1; a >= 0; a--) {
                    const inv = this.invaders[a];
                    
                    // Collision check
                    if (bullet.x > inv.x && bullet.x < inv.x + inv.width &&
                        bullet.y > inv.y && bullet.y < inv.y + inv.height) {
                        
                        // Hit! Spawn pixel explosion particles
                        const numParticles = 12;
                        for (let p = 0; p < numParticles; p++) {
                            this.particles.push({
                                x: inv.x + inv.width / 2,
                                y: inv.y + inv.height / 2,
                                vx: (Math.random() - 0.5) * 5,
                                vy: (Math.random() - 0.5) * 5,
                                size: 2 + Math.random() * 3, // size 2px to 5px
                                color: inv.color,
                                life: 1.0,
                                decay: 0.02 + Math.random() * 0.03
                            });
                        }

                        // Remove both bullet and invader
                        this.bullets.splice(b, 1);
                        this.invaders.splice(a, 1);
                        break;
                    }
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Win Condition
            if (this.invaders.length === 0 && this.particles.length === 0) {
                this.onGameOver('VICTORY! All Invaders Eliminated!', true);
                return;
            }

            // Defeat Condition: Reach player level
            for (let inv of this.invaders) {
                if (inv.y + inv.height >= this.pY) {
                    this.onGameOver('Defeat! Invaders reached base.', false);
                    return;
                }
            }
        }

        draw() {
            // Draw BG
            this.ctx.fillStyle = '#07131d';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw Player Ship (Emerald green styling)
            this.ctx.fillStyle = '#76c893';
            // Simple ship shape (triangle top and rectangle bottom)
            this.ctx.fillRect(this.pX, this.pY + 6, this.pWidth, this.pHeight - 6);
            this.ctx.fillRect(this.pX + this.pWidth / 2 - 4, this.pY, 8, 6);

            // Draw Invaders
            for (let inv of this.invaders) {
                this.ctx.fillStyle = inv.color;
                // simple space invader blocky pixel style
                this.ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
                // Draw antenna spikes
                this.ctx.fillRect(inv.x + 4, inv.y - 4, 4, 4);
                this.ctx.fillRect(inv.x + inv.width - 8, inv.y - 4, 4, 4);
                // Draw eyes (cutouts)
                this.ctx.fillStyle = '#07131d';
                this.ctx.fillRect(inv.x + 6, inv.y + 4, 4, 4);
                this.ctx.fillRect(inv.x + inv.width - 10, inv.y + 4, 4, 4);
            }

            // Draw Bullets
            this.ctx.fillStyle = '#d9ed92'; // Lime Cream
            for (let b of this.bullets) {
                this.ctx.fillRect(b.x, b.y, this.bulletWidth, this.bulletHeight);
            }

            // Draw Explosion Particles
            for (let p of this.particles) {
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.life;
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            this.ctx.globalAlpha = 1.0; // Reset global alpha

            // Invaders Left HUD
            this.ctx.fillStyle = '#f1f7f4';
            this.ctx.font = '14px Outfit, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`INVADERS LEFT: ${this.invaders.length}`, 15, 25);

            this.ctx.fillStyle = '#52b69a';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Use Left/Right Arrows to move. Spacebar to Shoot.', this.canvas.width / 2, this.canvas.height - 12);
        }
    }


    // ==========================================
    // 🧱 4. BREAKOUT GAME CLASS
    // ==========================================
    class BreakoutGame {
        constructor(canvas, ctx, onGameOver) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.onGameOver = onGameOver;
            this.running = false;
            
            // Paddle
            this.paddleWidth = 90;
            this.paddleHeight = 12;
            this.pX = canvas.width / 2 - this.paddleWidth / 2;
            this.pY = canvas.height - 35;
            
            // Ball
            this.ballRadius = 6;
            this.ballX = canvas.width / 2;
            this.ballY = canvas.height / 2;
            this.ballSpeedX = 3.5;
            this.ballSpeedY = -3.5;

            // Bricks layout
            this.bricks = [];
            this.brickRows = 3;
            this.brickCols = 7;
            this.brickWidth = 68;
            this.brickHeight = 18;
            this.brickPadding = 12;
            this.brickOffsetTop = 50;
            this.brickOffsetLeft = 32;

            // Lives & state
            this.lives = 3;
            this.score = 0;
            this.waitingForTap = true;

            // Click listener for launching
            this.clickHandler = (e) => this.handleCanvasClick(e);
            this.canvas.addEventListener('click', this.clickHandler);
        }

        start() {
            this.running = true;
            this.score = 0;
            this.lives = 3;
            this.pX = this.canvas.width / 2 - this.paddleWidth / 2;
            this.resetBall();

            // Construct bricks
            this.bricks = [];
            for (let r = 0; r < this.brickRows; r++) {
                for (let c = 0; c < this.brickCols; c++) {
                    this.bricks.push({
                        x: c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                        y: r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                        status: 1, // 1 = intact, 0 = hit
                        color: r === 0 ? '#d9ed92' : r === 1 ? '#76c893' : '#34a0a4'
                    });
                }
            }

            this.loop();
        }

        stop() {
            this.running = false;
            this.canvas.removeEventListener('click', this.clickHandler);
        }

        resetBall() {
            this.waitingForTap = true;
        }

        handleCanvasClick(e) {
            if (this.waitingForTap) {
                this.waitingForTap = false;
                this.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random());
                this.ballSpeedY = -3.5;
            }
        }

        loop() {
            if (!this.running) return;
            this.update();
            if (!this.running) return;
            this.draw();
            currentAnimFrame = requestAnimationFrame(() => this.loop());
        }

        update() {
            // Paddle movement matches mouse
            this.pX = mouseX - this.paddleWidth / 2;
            // Clamp paddle
            if (this.pX < 10) this.pX = 10;
            if (this.pX + this.paddleWidth > this.canvas.width - 10) this.pX = this.canvas.width - 10 - this.paddleWidth;

            if (this.waitingForTap) {
                // Ball sits on top center of paddle
                this.ballX = this.pX + this.paddleWidth / 2;
                this.ballY = this.pY - this.ballRadius - 2;
            } else {
                // Move ball
                this.ballX += this.ballSpeedX;
                this.ballY += this.ballSpeedY;

                // Bouncing left/right walls
                if (this.ballX - this.ballRadius < 0 || this.ballX + this.ballRadius > this.canvas.width) {
                    this.ballSpeedX = -this.ballSpeedX;
                }
                // Bouncing top wall
                if (this.ballY - this.ballRadius < 0) {
                    this.ballSpeedY = -this.ballSpeedY;
                }

                // Paddle bounce check
                if (this.ballY + this.ballRadius >= this.pY && this.ballY - this.ballRadius <= this.pY + this.paddleHeight) {
                    if (this.ballX >= this.pX && this.ballX <= this.pX + this.paddleWidth) {
                        this.ballSpeedY = -Math.abs(this.ballSpeedY); // bounce up
                        // alter x velocity based on where it hit paddle
                        const hitPos = (this.ballX - (this.pX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                        this.ballSpeedX = hitPos * 4.5;
                    }
                }

                // Check brick collisions
                for (let b of this.bricks) {
                    if (b.status === 1) {
                        if (this.ballX + this.ballRadius > b.x && this.ballX - this.ballRadius < b.x + this.brickWidth &&
                            this.ballY + this.ballRadius > b.y && this.ballY - this.ballRadius < b.y + this.brickHeight) {
                            
                            this.ballSpeedY = -this.ballSpeedY;
                            b.status = 0;
                            this.score += 20;

                            // Win condition: check if all bricks are cleared
                            if (this.bricks.every(brick => brick.status === 0)) {
                                this.onGameOver(`VICTORY! All bricks broken! Score: ${this.score}`, true);
                                return;
                            }
                        }
                    }
                }

                // Lost ball check
                if (this.ballY > this.canvas.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.onGameOver(`Out of Lives! Score: ${this.score}`, false);
                    } else {
                        this.resetBall();
                    }
                }
            }
        }

        draw() {
            // Draw BG
            this.ctx.fillStyle = '#07131d';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw Bricks
            for (let b of this.bricks) {
                if (b.status === 1) {
                    this.ctx.fillStyle = b.color;
                    this.ctx.fillRect(b.x, b.y, this.brickWidth, this.brickHeight);
                    // border lines for brick depth
                    this.ctx.strokeStyle = '#07131d';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(b.x, b.y, this.brickWidth, this.brickHeight);
                }
            }

            // Draw Paddle
            this.ctx.fillStyle = '#76c893'; // Emerald
            this.ctx.fillRect(this.pX, this.pY, this.paddleWidth, this.paddleHeight);

            // Draw Ball
            this.ctx.fillStyle = '#d9ed92'; // Lime Cream
            this.ctx.beginPath();
            this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Scores HUD
            this.ctx.fillStyle = '#f1f7f4';
            this.ctx.font = '14px Outfit, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`LIVES: ${'❤️'.repeat(this.lives)}`, this.canvas.width - 15, 25);

            this.ctx.fillStyle = '#52b69a';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            if (this.waitingForTap) {
                this.ctx.fillStyle = '#ff9f0a'; // Orange alert
                this.ctx.font = '18px Outfit, sans-serif';
                this.ctx.fillText('CLICK CANVAS TO LAUNCH BALL', this.canvas.width / 2, this.canvas.height / 2 + 30);
            } else {
                this.ctx.fillText('Move mouse horizontally to control paddle.', this.canvas.width / 2, this.canvas.height - 12);
            }
        }
    }
});
