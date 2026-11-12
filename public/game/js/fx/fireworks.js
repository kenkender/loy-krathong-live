import { rand } from '../core/util.js';

const PALETTES = [
  '255,214,120', '255,140,160', '140,200,255', '190,160,255', '255,255,255', '255,170,90',
];

/** พลุ: จรวดพุ่งขึ้น แล้วระเบิดเป็นประกาย */
export class Fireworks {
  constructor(L, particles) {
    this.L = L;
    this.particles = particles;
    this.rockets = [];
    this.pending = [];
  }

  /** ยิงพลุ n ลูก ทยอยกัน */
  volley(n, centerX, spread = 360) {
    for (let i = 0; i < n; i++) {
      this.pending.push({ at: i * rand(0.25, 0.6), x: centerX + rand(-spread, spread) * this.L.unit });
    }
  }

  update(dt) {
    this.pending.forEach((p) => (p.at -= dt));
    for (const p of this.pending.filter((q) => q.at <= 0)) {
      this.rockets.push({
        x: p.x,
        y: this.L.deckTop,
        ty: rand(this.L.H * 0.1, this.L.H * 0.32),
        v: rand(620, 780) * this.L.unit,
        color: PALETTES[Math.floor(rand(0, PALETTES.length))],
      });
    }
    this.pending = this.pending.filter((p) => p.at > 0);

    for (const r of this.rockets) {
      r.y -= r.v * dt;
      r.v *= 1 - 0.55 * dt;
      this.particles.spark(r.x, r.y, { color: '255,230,170', n: 1, speed: 20, life: 0.5, size: 2, gravity: 40 });
      if (r.y <= r.ty || r.v < 160) {
        r.dead = true;
        this.particles.spark(r.x, r.y, { color: r.color, n: 90, speed: 340 * this.L.unit, life: 1.7, size: 3.2, gravity: 150, trail: true });
        this.particles.spark(r.x, r.y, { color: '255,255,255', n: 20, speed: 150 * this.L.unit, life: 1.1, size: 2.5, gravity: 120 });
      }
    }
    this.rockets = this.rockets.filter((r) => !r.dead);
  }
}

