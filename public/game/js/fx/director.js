import { rand } from '../core/util.js';

/**
 * ผู้กำกับเอฟเฟกต์: กำหนดว่ากระทงแต่ละระดับ "ตกลงน้ำ" แล้วเกิดอะไรขึ้นบ้าง
 * ปรับความอลังการของแต่ละระดับได้ที่ไฟล์นี้ไฟล์เดียว
 */
export class EffectsDirector {
  constructor(L, { particles, lanterns, fireworks }) {
    this.L = L;
    this.p = particles;
    this.lanterns = lanterns;
    this.fireworks = fireworks;
    this.flash = 0;
    this.pillars = [];
  }

  onLand(fk) {
    const { x, y, tier } = { x: fk.x, y: fk.y, tier: fk.tier };
    const u = this.L.unit;
    this.p.ripple(x, y, { size: 0.8 + tier * 0.35 });

    switch (tier) {
      case 0:
        break;
      case 1:
        this.p.petalBurst(x, y - 20, 10);
        break;
      case 2:
        this.p.ripple(x, y, { size: 1.6, life: 3 });
        this.p.spark(x, y - 30 * u, { n: 36, speed: 200 * u });
        this.p.petalBurst(x, y - 20, 18);
        this.lanterns.launch(3, x, y - 40 * u, 140);
        break;
      case 3:
        this.p.ripple(x, y, { size: 2.2, life: 3.4 });
        setTimeout(() => this.p.ripple(x, y, { size: 2.8, life: 3.6 }), 350);
        this.p.spark(x, y - 40 * u, { n: 90, speed: 330 * u, life: 1.6, size: 3.6 });
        this.p.petalBurst(x, y - 20, 30, ['#ffd876', '#fff0b8', '#ff9ec1']);
        this.lanterns.launch(8, x, y - 40 * u, 260);
        this.fireworks.volley(3, x, 220);
        this.pillars.push({ x, age: 0, life: 2.4, w: 90 * u });
        break;
      default:
        this.flash = 0.55;
        for (let i = 0; i < 4; i++) setTimeout(() => this.p.ripple(x, y, { size: 2.4 + i * 0.7, life: 4 }), i * 330);
        this.p.spark(x, y - 50 * u, { n: 160, speed: 420 * u, life: 2, size: 4.2 });
        this.p.petalBurst(x, y - 20, 50, ['#ffd876', '#fff0b8', '#ffffff', '#ff9ec1']);
        this.lanterns.launch(22, this.L.W / 2, this.L.deckTop, this.L.W * 0.5);
        this.fireworks.volley(9, this.L.W / 2, this.L.W * 0.36);
        this.pillars.push({ x, age: 0, life: 4, w: 160 * u });
        for (let i = 0; i < 5; i++) setTimeout(() => this.p.rain(this.L.W / 2, this.L.W, -20, { n: 40, life: 4, size: 3.4 }), i * 600);
    }
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 0.55);
    for (const pl of this.pillars) pl.age += dt;
    this.pillars = this.pillars.filter((pl) => pl.age < pl.life);
  }

  /** ชั้นแสงที่อยู่หลังกระทง (เสาแสง) */
  drawPillars(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const pl of this.pillars) {
      const k = pl.age / pl.life;
      const a = Math.sin(Math.min(1, k) * Math.PI) * 0.55;
      const bottom = this.L.waterTop + 120;
      const w = pl.w * (0.8 + 0.2 * Math.sin(k * 12));
      // ซ้อนแท่งแคบลงเรื่อย ๆ ให้ขอบแสงนุ่ม
      for (let i = 0; i < 8; i++) {
        const g = ctx.createLinearGradient(0, 0, 0, bottom);
        g.addColorStop(0, 'rgba(255,220,140,0)');
        g.addColorStop(1, `rgba(255,214,120,${a / 7})`);
        ctx.fillStyle = g;
        const ww = w * (1.6 - i * 0.17);
        ctx.fillRect(pl.x - ww / 2, 0, ww, bottom);
      }
    }
    ctx.restore();
  }

  drawFlash(ctx) {
    if (this.flash <= 0) return;
    ctx.fillStyle = `rgba(255,236,190,${this.flash})`;
    ctx.fillRect(0, 0, this.L.W, this.L.H);
  }
}
