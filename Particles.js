export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(type, x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            let p;
            switch (type) {
                case 'dust':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() * -2) - 0.5,
                        life: 1, maxLife: 1,
                        size: Math.random() * 6 + 3,
                        color: `hsl(${30 + Math.random()*20}, 30%, ${50 + Math.random()*20}%)`,
                        type: 'dust',
                    };
                    break;
                case 'orange':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        life: 1, maxLife: 1,
                        size: Math.random() * 8 + 4,
                        color: Math.random() > 0.5 ? '#f39c12' : '#e67e22',
                        type: 'burst',
                        gravity: 0.3,
                    };
                    break;
                case 'banana':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1, maxLife: 1,
                        size: Math.random() * 6 + 3,
                        color: Math.random() > 0.5 ? '#f1c40f' : '#f39c12',
                        type: 'burst',
                        gravity: 0.2,
                        rot: Math.random() * Math.PI * 2,
                        rotV: (Math.random() - 0.5) * 0.4,
                    };
                    break;
                case 'grass':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() * -3) - 1,
                        life: 1, maxLife: 1,
                        size: Math.random() * 5 + 2,
                        color: Math.random() > 0.5 ? '#27ae60' : '#2ecc71',
                        type: 'dust',
                    };
                    break;
                case 'star':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -Math.random() * 4 - 2,
                        life: 1, maxLife: 1,
                        size: Math.random() * 5 + 3,
                        color: '#f1c40f',
                        type: 'star',
                        gravity: 0.15,
                        rot: 0,
                        rotV: (Math.random() - 0.5) * 0.3,
                    };
                    break;
            }
            if (p) this.particles.push(p);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            if (p.rotV) p.rot = (p.rot || 0) + p.rotV;
            p.life -= 0.035;
            if (p.type === 'dust') p.vx *= 0.92;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx, cameraY) {
        for (const p of this.particles) {
            const sy = p.y - cameraY;
            if (sy < -50 || sy > ctx.canvas.height + 50) continue;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.translate(p.x, sy);
            if (p.rot !== undefined) ctx.rotate(p.rot);

            if (p.type === 'star') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    const a = (s * Math.PI * 2) / 5 - Math.PI / 2;
                    const bi = a + Math.PI / 5;
                    s === 0
                        ? ctx.moveTo(Math.cos(a) * p.size, Math.sin(a) * p.size)
                        : ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
                    ctx.lineTo(Math.cos(bi) * p.size * 0.4, Math.sin(bi) * p.size * 0.4);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
}
