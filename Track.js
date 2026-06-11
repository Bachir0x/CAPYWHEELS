import { Config } from './Config.js';

export class Track {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.items = [];

        // Pre-generate road edge rumble pattern
        this._rumbleCache = [];

        // Parallax layers
        this._bgTrees = this._generateTrees(60);
    }

    _generateTrees(count) {
        const trees = [];
        for (let i = 0; i < count; i++) {
            trees.push({
                x: Math.random(),             // 0-1 (left or right of road)
                y: Math.random() * 20000,     // world Y
                side: Math.random() > 0.5 ? 1 : -1,
                size: 20 + Math.random() * 30,
                variant: Math.floor(Math.random() * 3),
                colorH: 100 + Math.floor(Math.random() * 40),
            });
        }
        return trees;
    }

    getCenterX(worldY) {
        return (this.canvas.width / 2)
            + Math.sin(worldY * Config.road.frequency1) * Config.road.amplitude1
            + Math.sin(worldY * Config.road.frequency2) * Config.road.amplitude2;
    }

    spawnItems(cameraY) {
        if (Math.random() < Config.items.spawnChance) {
            const spawnY = cameraY - 120;
            const roadCenter = this.getCenterX(spawnY);
            const spawnX = roadCenter + (Math.random() - 0.5) * (Config.road.width - 60);
            const roll = Math.random();
            const type = roll < 0.7 ? 'orange' : 'banana';
            this.items.push({ x: spawnX, y: spawnY, type, phase: Math.random() * Math.PI * 2 });
        }
    }

    update(cameraY) {
        this.items = this.items.filter(item => item.y < cameraY + this.canvas.height + 200);
        // Animate item phases
        for (const item of this.items) {
            item.phase += 0.04;
        }
    }

    draw(cameraY, frame) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;

        // ── Sky gradient ──────────────────────────────────────────────
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
        skyGrad.addColorStop(0, '#1a6dbd');
        skyGrad.addColorStop(1, '#6fb3e0');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.45);

        // ── Distant hills (parallax layer 1 — slow) ───────────────────
        const hillOff1 = cameraY * 0.05;
        ctx.fillStyle = '#2d7a3a';
        ctx.beginPath();
        ctx.moveTo(0, H * 0.45);
        for (let sx = 0; sx <= W; sx += 40) {
            const hillH = Math.sin((sx + hillOff1) * 0.007) * 45
                        + Math.sin((sx + hillOff1) * 0.013) * 25;
            ctx.lineTo(sx, H * 0.42 - hillH);
        }
        ctx.lineTo(W, H * 0.45); ctx.closePath(); ctx.fill();

        // ── Mid hills (parallax layer 2) ─────────────────────────────
        const hillOff2 = cameraY * 0.15;
        ctx.fillStyle = '#1e824c';
        ctx.beginPath();
        ctx.moveTo(0, H * 0.5);
        for (let sx = 0; sx <= W; sx += 30) {
            const hillH = Math.sin((sx + hillOff2) * 0.009) * 30
                        + Math.sin((sx + hillOff2) * 0.02) * 15;
            ctx.lineTo(sx, H * 0.47 - hillH);
        }
        ctx.lineTo(W, H * 0.5); ctx.closePath(); ctx.fill();

        // ── Ground grass ─────────────────────────────────────────────
        const grassGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
        grassGrad.addColorStop(0, '#1e824c');
        grassGrad.addColorStop(1, '#145a32');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, H * 0.4, W, H);

        // ── Subtle grass texture stripes ─────────────────────────────
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (let screenY = Math.floor(H * 0.4); screenY < H; screenY += 8) {
            const wY = cameraY + screenY;
            const cx = this.getCenterX(wY);
            // Only draw on grass (outside road)
            ctx.beginPath(); ctx.moveTo(0, screenY); ctx.lineTo(cx - Config.road.width/2 - 5, screenY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + Config.road.width/2 + 5, screenY); ctx.lineTo(W, screenY); ctx.stroke();
        }

        // ── Road asphalt ─────────────────────────────────────────────
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        let first = true;
        for (let screenY = 0; screenY <= H; screenY += 20) {
            const cx = this.getCenterX(cameraY + screenY);
            if (first) { ctx.moveTo(cx - Config.road.width / 2, screenY); first = false; }
            else ctx.lineTo(cx - Config.road.width / 2, screenY);
        }
        for (let screenY = H; screenY >= 0; screenY -= 20) {
            const cx = this.getCenterX(cameraY + screenY);
            ctx.lineTo(cx + Config.road.width / 2, screenY);
        }
        ctx.fill();

        // ── Road edge rumble strips ───────────────────────────────────
        const rumbleW = Config.road.edgeWidth;
        for (let screenY = 0; screenY <= H; screenY += 40) {
            const wY = cameraY + screenY;
            const cx = this.getCenterX(wY);
            const isRed = Math.floor(wY / 40) % 2 === 0;
            ctx.fillStyle = isRed ? '#e74c3c' : '#ecf0f1';

            // Left strip
            ctx.fillRect(cx - Config.road.width/2, screenY, rumbleW, 20);
            // Right strip
            ctx.fillRect(cx + Config.road.width/2 - rumbleW, screenY, rumbleW, 20);
        }

        // ── Road surface shading (darker edges) ──────────────────────
        for (let screenY = 0; screenY <= H; screenY += 20) {
            const wY = cameraY + screenY;
            const cx = this.getCenterX(wY);
            const rw = Config.road.width;

            const leftGrad = ctx.createLinearGradient(cx - rw/2, 0, cx - rw/2 + 40, 0);
            leftGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
            leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(cx - rw/2, screenY, 40, 20);

            const rightGrad = ctx.createLinearGradient(cx + rw/2, 0, cx + rw/2 - 40, 0);
            rightGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
            rightGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(cx + rw/2 - 40, screenY, 40, 20);
        }

        // ── Centre dashed line ────────────────────────────────────────
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 5;
        ctx.setLineDash([35, 25]);
        ctx.lineDashOffset = -(cameraY % 60);
        ctx.beginPath();
        for (let screenY = 0; screenY <= H; screenY += 20) {
            const cx = this.getCenterX(cameraY + screenY);
            screenY === 0 ? ctx.moveTo(cx, screenY) : ctx.lineTo(cx, screenY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // ── Side trees / vegetation ───────────────────────────────────
        this._drawTrees(cameraY);

        // ── Items ─────────────────────────────────────────────────────
        this.drawItems(cameraY);
    }

    _drawTrees(cameraY) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;

        for (const tree of this._bgTrees) {
            const screenY = (tree.y - cameraY) % (H + 600) - 100;
            // Wrap trees so they keep spawning
            const wY = ((tree.y - cameraY) % (H + 600)) + cameraY;
            const cx = this.getCenterX(wY);
            const offset = tree.side * (Config.road.width / 2 + 30 + tree.x * 120);
            const tx = cx + offset;
            const sz = tree.size;

            if (screenY < -sz * 2 || screenY > H + sz * 2) continue;

            ctx.save();
            ctx.translate(tx, screenY);

            // Trunk
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-sz * 0.12, 0, sz * 0.24, sz * 0.5);

            // Canopy
            ctx.fillStyle = `hsl(${tree.colorH}, 50%, 28%)`;
            ctx.beginPath();
            if (tree.variant === 0) {
                ctx.arc(0, -sz * 0.3, sz * 0.55, 0, Math.PI * 2);
            } else if (tree.variant === 1) {
                ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.6, sz * 0.1); ctx.lineTo(-sz * 0.6, sz * 0.1);
                ctx.closePath();
            } else {
                ctx.arc(0, -sz * 0.15, sz * 0.4, 0, Math.PI * 2);
                ctx.arc(-sz*0.3, -sz * 0.4, sz * 0.3, 0, Math.PI * 2);
                ctx.arc(sz*0.3, -sz * 0.4, sz * 0.3, 0, Math.PI * 2);
            }
            ctx.fill();

            // Highlight
            ctx.fillStyle = `hsla(${tree.colorH + 10}, 60%, 40%, 0.4)`;
            ctx.beginPath(); ctx.arc(-sz * 0.1, -sz * 0.45, sz * 0.2, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        }
    }

    drawItems(cameraY) {
        const ctx = this.ctx;
        this.items.forEach(item => {
            const sy = item.y - cameraY;
            if (sy < -40 || sy > this.canvas.height + 40) return;

            const bob = Math.sin(item.phase) * 4;

            ctx.save();
            ctx.translate(item.x, sy + bob);

            // Drop shadow
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(0, 16 - bob, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            if (item.type === 'orange') {
                // Glow
                ctx.save();
                ctx.globalAlpha = 0.3;
                const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 22);
                glow.addColorStop(0, '#f39c12');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

                // Orange body
                let grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 14);
                grad.addColorStop(0, '#ffcc66');
                grad.addColorStop(0.5, '#f39c12');
                grad.addColorStop(1, '#d35400');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();

                // Dimples
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();

                // Leaf
                ctx.fillStyle = '#27ae60';
                ctx.beginPath();
                ctx.moveTo(0, -14); ctx.quadraticCurveTo(6, -22, 2, -20);
                ctx.quadraticCurveTo(-4, -18, 0, -14);
                ctx.fill();

            } else {
                // Banana
                ctx.rotate(item.phase * 0.3);
                ctx.fillStyle = '#f1c40f';
                ctx.strokeStyle = '#d4ac0d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-12, 8);
                ctx.quadraticCurveTo(0, -14, 12, 8);
                ctx.quadraticCurveTo(0, 2, -12, 8);
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                // Tip dots
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(-11, 8, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(11, 8, 2, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        });
    }
}
