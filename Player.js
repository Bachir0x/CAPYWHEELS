import { Config } from './Config.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.angle = -Math.PI / 2;
        this.speed = 0;
        this.momentum = 100;
        this.turnRate = 0;
        this.radius = 18;
        this.targetLean = 0;
        this.currentLean = 0;
        this.legFrame = 0;
        this.legPhase = 0;
        this.isOffRoad = false;
        this.frameCount = 0;

        // Screen shake
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    update(input, track) {
        this.frameCount++;

        // Throttle / speed
        if (input.throttle) {
            this.speed += Config.player.acceleration;
        } else {
            this.speed *= Config.player.friction;
        }
        if (input.brake) this.speed -= 0.6;
        this.speed = Math.max(0, Math.min(this.speed, Config.player.maxSpeed));

        // Steering
        this.turnRate = 0;
        if (this.speed > 1) {
            const speedFactor = Math.max(0.4, 1 - (this.speed / (Config.player.maxSpeed * 1.5)));
            this.turnRate = input.steering * Config.player.baseTurnRate * speedFactor;
        }
        this.angle += this.turnRate;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Lean
        this.targetLean = this.turnRate * 5;
        this.currentLean += (this.targetLean - this.currentLean) * 0.15;

        // Leg animation
        if (this.speed > 0.5) {
            this.legPhase += this.speed * 0.12;
        }

        // Momentum drain
        this.momentum -= (Config.player.baseMomentumDrain + (this.speed * 0.004));

        // Off-road check
        const roadCenter = track.getCenterX(this.y);
        this.isOffRoad = Math.abs(this.x - roadCenter) > Config.road.width / 2;
        if (this.isOffRoad) {
            this.momentum -= Config.player.offRoadMomentumDrain;
            this.speed *= Config.player.grassSpeedPenalty;
        }

        this.momentum = Math.max(0, Math.min(100, this.momentum));

        // Screen shake decay
        this.shakeAmount *= 0.85;
        this.shakeX = (Math.random() - 0.5) * this.shakeAmount;
        this.shakeY = (Math.random() - 0.5) * this.shakeAmount;
    }

    // Returns dust emit positions (behind wheels)
    getDustPositions() {
        const behind = {
            x: this.x - Math.cos(this.angle) * 20,
            y: this.y - Math.sin(this.angle) * 20,
        };
        return [behind];
    }

    draw(ctx, cameraY) {
        const sy = this.y - cameraY;
        ctx.save();
        ctx.translate(this.x + this.shakeX, sy + this.shakeY);
        ctx.rotate(this.angle + Math.PI / 2);

        const lean = this.currentLean * 18;

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(lean + 4, 10, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Axle / chassis
        ctx.fillStyle = '#556677';
        ctx.fillRect(-22, -6, 44, 4);

        // Animated wheels
        const wheelAngle = this.legPhase;
        this._drawWheel(ctx, -18, 0, 9, wheelAngle, lean);
        this._drawWheel(ctx, 18, 0, 9, wheelAngle + Math.PI, lean);

        // Capy body (translate with lean)
        ctx.save();
        ctx.translate(lean, 0);

        // Body
        ctx.fillStyle = '#7a4f2e';
        ctx.beginPath();
        ctx.ellipse(0, 6, 14, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fur sheen
        ctx.fillStyle = '#8e5929';
        ctx.beginPath();
        ctx.ellipse(-3, 0, 10, 16, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#7a4f2e';
        ctx.beginPath();
        ctx.ellipse(0, -18, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#6e4019';
        ctx.beginPath();
        ctx.ellipse(0, -14, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = '#3a2010';
        ctx.beginPath(); ctx.arc(-3, -13, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -13, 2, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-6, -21, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -21, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-5.5, -21, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6.5, -21, 2, 0, Math.PI * 2); ctx.fill();
        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-4.5, -22, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7.5, -22, 0.8, 0, Math.PI * 2); ctx.fill();

        // Ears
        ctx.fillStyle = '#6e4019';
        ctx.beginPath(); ctx.arc(-10, -26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c0856a';
        ctx.beginPath(); ctx.arc(-10, -26, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -26, 2.5, 0, Math.PI * 2); ctx.fill();

        // Helmet / racing cap
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, -22, 13, Math.PI, 0);
        ctx.fill();
        // Visor
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-13, -22, 26, 4);
        // Goggles strap
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-12, -20, 24, 3);
        // Goggle lenses
        ctx.fillStyle = 'rgba(100,200,255,0.7)';
        ctx.beginPath(); ctx.ellipse(-5, -18, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, -18, 4, 3, 0, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
        ctx.restore();
    }

    _drawWheel(ctx, x, y, r, angle, lean) {
        ctx.save();
        ctx.translate(x + lean * 0.4, y);
        ctx.rotate(angle);
        // Tyre
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        // Spokes
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.stroke();
        }
        // Hub
        ctx.fillStyle = '#f39c12';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}
