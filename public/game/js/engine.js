import { createLayout } from './core/layout.js';
import { JobQueue } from './core/queue.js';
import { createBackdrop, drawStars, drawFerrisWheel, drawTempleFairNPCs } from './scene/backdrop.js';
import { drawWater } from './scene/water.js';
import { Character } from './actors/character.js';
import { Character3DManager } from './actors/character3d.js';
import { FloatingKrathong } from './actors/floating-krathong.js';
import { Particles } from './fx/particles.js';
import { SkyLanterns } from './fx/sky-lanterns.js';
import { Fireworks } from './fx/fireworks.js';
import { EffectsDirector } from './fx/director.js';
import { drawNameTag } from './fx/name-tag.js';
import { rand } from './core/util.js';

const MAX_FLOATING = 36;
const SPAWN_GAP = 0.9;

export class Engine {
  constructor(canvas, mode, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasTop = document.getElementById('scene-top');
    this.ctxTop = this.canvasTop ? this.canvasTop.getContext('2d') : null;
    this.hooks = hooks;
    this.L = createLayout(mode);
    canvas.width = this.L.W;
    canvas.height = this.L.H;
    if (this.canvasTop) {
      this.canvasTop.width = this.L.W;
      this.canvasTop.height = this.L.H;
    }

    this.backdrop = createBackdrop(this.L);
    this.char3D = new Character3DManager(this.L, this.backdrop);
    this.queue = new JobQueue();
    this.slots = this.L.slots.map(() => null);
    this.characters = [];
    this.floating = [];
    this.particles = new Particles();
    this.lanterns = new SkyLanterns(this.L);
    this.fireworks = new Fireworks(this.L, this.particles);
    this.director = new EffectsDirector(this.L, { particles: this.particles, lanterns: this.lanterns, fireworks: this.fireworks });

    this.t = 0;
    this.sinceSpawn = 99;
    this.fps = 60;
    this.totalLaunched = 0;
    this.last = performance.now();
  }

  enqueue(job) {
    this.queue.push(job);
  }

  clear() {
    this.queue.clear();
    this.characters = [];
    this.floating = [];
    this.slots.fill(null);
    this.particles = new Particles();
    this.fireworks.particles = this.particles;
    this.director.p = this.particles;
    this.lanterns.items = [];
  }

  stats() {
    return { fps: this.fps, queue: this.queue.length, active: this.characters.length, floating: this.floating.length, particles: this.particles.count };
  }

  start() {
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.fps += (1 / Math.max(dt, 0.001) - this.fps) * 0.05;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  #spawn() {
    const free = this.slots.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) return;
    const job = this.queue.next();
    if (!job) return;
    const idx = free[Math.floor(rand(0, free.length))];
    const ch = new Character(this.L, job, this.L.slots[idx]);
    ch.slot = idx;
    this.slots[idx] = ch;
    this.characters.push(ch);
    this.sinceSpawn = 0;
    this.hooks.onSpawn?.(job);
  }

  update(dt) {
    this.t += dt;
    this.sinceSpawn += dt;
    if (this.sinceSpawn > SPAWN_GAP && this.characters.length < this.L.maxActive) this.#spawn();

    for (const ch of this.characters) {
      ch.update(dt, {
        onRelease: (c) => {
          const lane = Math.floor(rand(0, this.L.lanes.length));
          const hand = c.handPos;
          this.floating.push(new FloatingKrathong(this.L, c.job, hand, lane));
          this.totalLaunched++;
          this.hooks.onRelease?.(c.job, this.totalLaunched);
        },
      });
      if (ch.done) this.slots[ch.slot] = null;
    }
    this.characters = this.characters.filter((c) => !c.done);

    this.floating = this.floating.filter((f) => !f.update(dt, (k) => this.director.onLand(k)));
    if (this.floating.length > MAX_FLOATING) this.floating.splice(0, this.floating.length - MAX_FLOATING);

    this.particles.update(dt);
    this.lanterns.update(dt);
    this.fireworks.update(dt);
    this.director.update(dt);
    this.char3D.update(this.characters, dt);
  }

  draw() {
    const { ctx, ctxTop, L, t } = this;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // 1. เลเยอร์ไกลสุด: ท้องฟ้า ดาว พระจันทร์ เนินเขา และพระอุโบสถ
    ctx.drawImage(this.backdrop.canvas, 0, 0);
    drawStars(ctx, this.backdrop.stars, t);

    // 2. เลเยอร์โมเดล 3D ฉากหลัง: เจดีย์สีทอง + มณฑปองค์พระ (อยู่หลังเนินหญ้าวัด)
    if (this.backdrop.modelsCanvas) {
      ctx.drawImage(this.backdrop.modelsCanvas, 0, 0);
    }

    // 3. ชิงช้าสวรรค์งานวัดหมุนไฟนีออนเรียลไทม์ (ตั้งอยู่หลังเนินหญ้าฝั่งขวา)
    if (this.backdrop.wheel) {
      drawFerrisWheel(ctx, this.backdrop.wheel.x, this.backdrop.wheel.y, this.backdrop.wheel.r, t, L.unit);
    }

    // 4. เลเยอร์กลาง: สนามหญ้าวัด (คลุมฐานตึกให้ตั้งติดพื้นดิน) + ศาลาพระสงฆ์ + ร้านค้าขายกระทง
    if (this.backdrop.midCanvas) {
      ctx.drawImage(this.backdrop.midCanvas, 0, 0);
    }

    // 5. ชาวบ้าน NPC เดินเที่ยวงานวัดบนทางเดินสนามหญ้า
    drawTempleFairNPCs(ctx, L, t);

    // 6. เลเยอร์หน้า: สายไฟงานวัด ราวสะพาน โคมไฟท่าน้ำ และพื้นสะพานไม้
    if (this.backdrop.pierCanvas) {
      ctx.drawImage(this.backdrop.pierCanvas, 0, 0);
    }

    this.director.drawPillars(ctx);
    this.lanterns.draw(ctx, t);

    drawWater(ctx, L, this.backdrop.lamps, t);
    this.particles.drawWaterLayer(ctx);

    // กระทงเรียงตามความลึก (ไกลก่อน)
    [...this.floating].sort((a, b) => a.y - b.y).forEach((f) => f.draw(ctx, t));

    const is3DActive = this.char3D.loaded && this.char3D.enabled;

    if (ctxTop) {
      ctxTop.clearRect(0, 0, L.W, L.H);
    }

    for (const ch of this.characters) {
      ch.draw(ctx, t, is3DActive);

      if (is3DActive) {
        if (ctxTop) {
          ch.drawHeldKrathong(ctxTop, t);
          drawNameTag(ctxTop, L, ch);
        } else {
          ch.drawHeldKrathong(ctx, t);
          drawNameTag(ctx, L, ch);
        }
      } else {
        drawNameTag(ctx, L, ch);
      }
    }

    if (ctxTop) {
      this.particles.drawAirLayer(ctxTop);
      this.director.drawFlash(ctxTop);
    } else {
      this.particles.drawAirLayer(ctx);
      this.director.drawFlash(ctx);
    }
  }
}

