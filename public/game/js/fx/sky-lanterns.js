import { rand, TAU } from '../core/util.js';

/** โคมลอยขึ้นฟ้า */
export class SkyLanterns {
  constructor(L) {
    this.L = L;
    this.items = [];
  }

  get count() {
    return this.items.length;
  }

  launch(n, x, y, spread = 200) {
    const u = this.L.unit;
    for (let i = 0; i < n; i++) {
      this.items.push({
        x: x + rand(-spread, spread) * u,
        y: y + rand(-20, 30),
        vy: rand(-46, -90) * u,
        sway: rand(0, TAU),
        size: rand(20, 34) * u,
        delay: i * rand(0.05, 0.22),
        age: 0,
        life: rand(9, 15),
      });
    }
    if (this.items.length > 70) this.items.splice(0, this.items.length - 70);
  }

  update(dt) {
    for (const l of this.items) {
      l.age += dt;
      if (l.age < l.delay) continue;
      l.y += l.vy * dt;
      l.x += Math.sin(l.age * 0.9 + l.sway) * 14 * dt;
    }
    this.items = this.items.filter((l) => l.age < l.life && l.y > -80);
  }

  draw(ctx, t) {
    for (const l of this.items) {
      if (l.age < l.delay) continue;
      const k = l.age - l.delay;
      const a = Math.min(1, k / 0.8) * Math.min(1, (l.life - l.age) / 2.5);
      const s = l.size;
      const fl = 0.85 + 0.15 * Math.sin(t * 9 + l.sway * 5);
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.translate(l.x, l.y);

      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3.2);
      g.addColorStop(0, `rgba(255,170,70,${0.4 * fl})`);
      g.addColorStop(1, 'rgba(255,140,50,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-s * 3.2, -s * 3.2, s * 6.4, s * 6.4);

      ctx.globalCompositeOperation = 'source-over';
      const body = ctx.createLinearGradient(0, -s, 0, s * 1.1);
      body.addColorStop(0, '#ffcf8a');
      body.addColorStop(0.6, '#ff9a4a');
      body.addColorStop(1, '#d95c26');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, s);
      ctx.bezierCurveTo(-s * 0.95, -s * 0.2, -s * 0.5, -s * 1.1, 0, -s * 1.15);
      ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 0.95, -s * 0.2, s * 0.55, s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,40,10,0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.1);
      ctx.lineTo(0, s);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,240,170,${fl})`;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.95, s * 0.28, s * 0.14, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

