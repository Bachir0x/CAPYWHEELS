import { Input } from './Input.js';
import { Track } from './Track.js';
import { Player } from './Player.js';
import { Config } from './Config.js';
import { ParticleSystem } from './Particles.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'MENU';

        this.input = new Input();
        this.track = new Track(this.canvas);
        this.particles = new ParticleSystem();
        this.player = null;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('capyHighScore') || '0');
        this.cameraY = 0;
        this._cameraYTarget = 0;
        this.frame = 0;

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;

        // Flash effect (orange glow on pickup)
        this.flashAlpha = 0;
        this.flashColor = '#f39c12';

        // Distance
        this.distance = 0;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        this.loop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGame() {
        this.player = new Player(this.canvas.width / 2, 0);
        this.track.items = [];
        this.particles.particles = [];
        this.score = 0;
        this.distance = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.flashAlpha = 0;
        this._cameraYTarget = 0;
        this.cameraY = 0;
        this.state = 'PLAYING';

        document.getElementById('screen-overlay').classList.add('hidden');
        document.getElementById('menu-content').classList.add('hidden');
        document.getElementById('gameover-content').classList.add('hidden');
    }

    handleGameOver() {
        this.state = 'GAMEOVER';
        const final = Math.floor(this.score);
        if (final > this.highScore) {
            this.highScore = final;
            localStorage.setItem('capyHighScore', String(final));
        }
        document.getElementById('screen-overlay').classList.remove('hidden');
        document.getElementById('gameover-content').classList.remove('hidden');
        document.getElementById('finalScore').innerText = final.toLocaleString();
        document.getElementById('highScore').innerText = this.highScore.toLocaleString();
    }

    _getMultiplier() {
        const idx = Math.min(this.combo, Config.combo.multipliers.length - 1);
        return Config.combo.multipliers[idx];
    }

    checkCollisions() {
        const pRadius = this.player.radius;
        for (let i = this.track.items.length - 1; i >= 0; i--) {
            const item = this.track.items[i];
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            if (Math.sqrt(dx * dx + dy * dy) < pRadius + 14) {
                if (item.type === 'orange') {
                    this.player.momentum = Math.min(100, this.player.momentum + Config.items.orangeRestore);
                    this.combo++;
                    this.comboTimer = Config.combo.window;
                    const pts = 300 * this._getMultiplier();
                    this.score += pts;
                    this.flashColor = '#f39c12';
                    this.flashAlpha = 0.35;
                    // Burst particles at screen pos
                    this.particles.emit('orange', item.x, item.y, 12);
                    this.particles.emit('star',   item.x, item.y, 5);
                    this._showComboPopup(pts);
                } else if (item.type === 'banana') {
                    this.player.momentum += Config.items.bananaPenalty;
                    this.player.speed *= 0.3;
                    this.player.angle += (Math.random() - 0.5) * 0.5;
                    this.player.shake(14);
                    this.combo = 0;
                    this.comboTimer = 0;
                    this.flashColor = '#e74c3c';
                    this.flashAlpha = 0.4;
                    this.particles.emit('banana', item.x, item.y, 14);
                }
                this.track.items.splice(i, 1);
            }
        }
    }

    _showComboPopup(pts) {
        // Update combo display
        const el = document.getElementById('comboDisplay');
        if (this.combo > 1) {
            el.innerText = `x${this.combo} COMBO! +${Math.floor(pts)}`;
            el.classList.remove('hidden');
            el.style.animation = 'none';
            void el.offsetWidth; // reflow
            el.style.animation = 'comboPop 0.8s ease-out forwards';
        } else {
            el.classList.add('hidden');
        }
    }

    updateUI() {
        document.getElementById('scoreDisplay').innerText = String(Math.floor(this.score)).padStart(6, '0');
        document.getElementById('distDisplay').innerText = Math.floor(this.distance) + 'm';

        const bar = document.getElementById('momentumBar');
        const pct = this.player.momentum;
        bar.style.width = `${pct}%`;

        if (pct < 25) {
            bar.style.backgroundColor = '#e74c3c';
            bar.parentElement.classList.add('danger-pulse');
        } else {
            bar.style.backgroundColor = pct > 60 ? '#2ecc71' : '#e67e22';
            bar.parentElement.classList.remove('danger-pulse');
        }

        // Multiplier badge
        const mult = this._getMultiplier();
        const badge = document.getElementById('multBadge');
        if (mult > 1) {
            badge.innerText = `×${mult}`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    _drawSpeedLines() {
        const spd = this.player.speed;
        if (spd < 8) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const alpha = (spd - 8) / (Config.player.maxSpeed - 8) * 0.35;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        const cx = W / 2;
        const cy = H * 0.75;
        for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            const r0 = 60 + Math.random() * 80;
            const r1 = r0 + 60 + Math.random() * 100;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r1 * 0.5);
            ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.5);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawScreenFlash() {
        if (this.flashAlpha <= 0) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.flashAlpha;
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
        this.flashAlpha *= 0.8;
        if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    loop() {
        this.frame++;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'PLAYING') {
            this.player.update(this.input, this.track);

            // Emit dust particles
            if (this.player.speed > 2 && this.frame % 3 === 0) {
                const type = this.player.isOffRoad ? 'grass' : 'dust';
                for (const pos of this.player.getDustPositions()) {
                    this.particles.emit(type, pos.x, pos.y, 2);
                }
            }

            this.track.spawnItems(this.cameraY);
            this.track.update(this.cameraY);
            this.particles.update();
            this.checkCollisions();

            // Smooth camera (lerp toward target)
            this._cameraYTarget = this.player.y - this.canvas.height * 0.75;
            this.cameraY += (this._cameraYTarget - this.cameraY) * Config.player.cameraLerp;

            // Score & distance
            if (this.player.speed > 1) {
                this.score += this.player.speed * 0.15 * this._getMultiplier();
                this.distance += this.player.speed * 0.05;
            }

            // Combo timer
            if (this.comboTimer > 0) {
                this.comboTimer--;
                if (this.comboTimer === 0) this.combo = 0;
            }

            if (this.player.momentum <= 0) {
                this.handleGameOver();
            }

            // Draw
            this.track.draw(this.cameraY, this.frame);
            this.particles.draw(ctx, this.cameraY);
            this.player.draw(ctx, this.cameraY);
            this._drawSpeedLines();
            this._drawScreenFlash();
            this.updateUI();

        } else {
            // Idle scroll on menu/gameover
            this.track.draw(this.cameraY, this.frame);
            this.cameraY -= 1.5;
        }

        requestAnimationFrame(() => this.loop());
    }
}
