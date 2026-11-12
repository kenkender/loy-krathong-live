import { rand, TAU } from '../core/util.js';

/** ระบบอนุภาคกลาง: ประกาย, กลีบดอกไม้, ระลอกน้ำ */
export class Particles {
  constructor() {
    this.sparks = [];
    this.petals = [];
    this.ripples = [];
  }

  get count() {
    return this.sparks.length + this.petals.length + this.ripples.length;
  }

  spark(x, y, { color = '255,214,120', speed = 220, n = 40, life = 1.2, size = 3, gravity = 260, trail = false } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(0.3, 1) * speed;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life * rand(0.7, 1.1), size: rand(size * 0.6, size * 1.3), color, gravity, trail });
    }
    if (this.sparks.length > 1800) this.sparks.splice(0, this.sparks.length - 1800);
  }

  rain(x, w, y, { color = '255,214,120', n = 30, life = 3, size = 3 } = {}) {
    for (let i = 0; i < n; i++) {
      this.sparks.push({ x: x + rand(-w / 2, w / 2), y: y + rand(-40, 0), vx: rand(-20, 20), vy: rand(80, 200), life, max: life, size: rand(size * 0.6, size * 1.4), color, gravity: 30, trail: false });
    }
  }

  petalBurst(x, y, n, colors = ['#ff9ec1', '#ffd45e', '#ffffff']) {
    for (let i = 0; i < n; i++) {
      this.petals.push({ x, y, vx: rand(-140, 140), vy: rand(-260, -80), rot: rand(0, TAU), vr: rand(-4, 4), life: rand(2.5, 4.5), max: 4.5, size: rand(7, 12), color: colors[i % colors.length], sw: rand(0, TAU) });
    }
  }

  ripple(x, y, { size = 1, life = 2.4, color = '190,225,255' } = {}) {
    this.ripples.push({ x, y, r: 4, life, max: life, size, color });
  }

  update(dt) {
    for (const p of this.sparks) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.vx *= 1 - 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);

    for (const p of this.petals) {
      p.life -= dt;
      p.sw += dt * 3;
      p.vy += 120 * dt;
      p.vx += Math.sin(p.sw) * 60 * dt;
      p.vx *= 1 - 0.9 * dt;
      p.vy *= 1 - 0.6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.petals = this.petals.filter((p) => p.life > 0);

    for (const r of this.ripples) {
      r.life -= dt;
      r.r += (70 * r.size) * dt;
    }
    this.ripples = this.ripples.filter((r) => r.life > 0);
  }

  drawWaterLayer(ctx) {
    ctx.lineWidth = 2;
    for (const r of this.ripples) {
      const a = Math.max(0, r.life / r.max);
      ctx.strokeStyle = `rgba(${r.color},${a * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.26, 0, 0, TAU);
      ctx.stroke();
    }
  }

  drawAirLayer(ctx) {
    for (const p of this.petals) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 1.2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.sparks) {
      const a = Math.max(0, p.life / p.max);
      if (p.trail) {
        ctx.strokeStyle = `rgba(${p.color},${a * 0.5})`;
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${p.color},${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

