import { createLayout } from './core/layout.js';
import { JobQueue } from './core/queue.js';
import { createBackdrop, drawStars, drawFerrisWheel, drawTempleFairNPCs } from './scene/backdrop.js';
import { drawWater } from './scene/water.js';
import { Character } from './actors/character.js';
import { Character3DManager } from './actors/character3d.js';
import { FloatingKrathong } from './actors/floating-krathong.js';
import { ModeStageRenderer } from './modes/mode-renderer.js';
import { Particles } from './fx/particles.js';
import { SkyLanterns } from './fx/sky-lanterns.js';
import { Fireworks } from './fx/fireworks.js';
import { EffectsDirector } from './fx/director.js';
import { drawNameTag } from './fx/name-tag.js';
import { rand } from './core/util.js';

const MAX_FLOATING = 48;
const SPAWN_GAP = 0.85;

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
    this.modeStage = new ModeStageRenderer(this.L);
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
    this.sceneConfig = {
      activityMode: 'loy-krathong',
      theme: 'loy-krathong',
      walkDirection: 'left-to-right',
      cameraPreset: 'front',
      cameraYaw: 0,
      cameraTilt: 0,
      cameraZoom: 1,
      danceSpeed: 1,
      showProps: true,
      showFerrisWheel: true,
      showLanterns: true,
      showNPCs: true,
      characterScale: 1,
    };
  }

  async applySceneConfig(cfg = {}) {
    this.sceneConfig = { ...this.sceneConfig, ...cfg };
    if (this.char3D) {
      await this.char3D.applySceneConfig(this.sceneConfig, true);
    }
  }

  triggerFx(kind = 'fireworks') {
    if (kind === 'fireworks') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => this.fireworks.burst?.(rand(this.L.W * 0.2, this.L.W * 0.8), rand(this.L.H * 0.12, this.L.H * 0.35)), i * 220);
      }
    } else if (kind === 'lanterns') {
      for (let i = 0; i < 6; i++) {
        this.lanterns.spawn?.(rand(this.L.W * 0.15, this.L.W * 0.85), this.L.landTop + 40);
      }
    }
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
    const job = this.queue.next();
    if (!job) return;

    const actMode = this.sceneConfig.activityMode || 'loy-krathong';
    const totalSlots = this.L.slots.length;

    // นับจำนวนตัวละครที่กำลังอยู่ในแต่ละช่อง (active per slot)
    const slotCounts = new Array(totalSlots).fill(0);
    for (const c of this.characters) {
      if (!c.done && c.state !== 3) {
        if (c.slotIndex >= 0 && c.slotIndex < totalSlots) {
          slotCounts[c.slotIndex]++;
        }
      }
    }

    // ในโหมดไหว้พระ: อนุญาตให้มีคนต่อแถวเข้ามาได้ถึง 2 คนต่อช่อง (รวมเป็น 10 คนในฉาก) เพื่อความต่อเนื่องของขบวนบุญ
    const maxPerSlot = actMode === 'temple-blessing' ? 2 : 1;
    let bestSlot = -1;
    let minCount = maxPerSlot;

    // เลือกช่องที่มีคนอยู่น้อยที่สุดเพื่อกระจายขบวนบุญให้สวยงาม
    for (let i = totalSlots - 1; i >= 0; i--) {
      if (slotCounts[i] < minCount) {
        minCount = slotCounts[i];
        bestSlot = i;
      }
    }

    if (bestSlot < 0) {
      // ทุกช่องมีคนต่อแถวเต็มขีดจำกัดแล้ว ใส่ job คืนหัวคิวเพื่อรอช่องว่าง
      this.queue.prepend(job);
      return;
    }

    const idx = bestSlot;
    const ch = new Character(this.L, job, this.L.slots[idx], this.sceneConfig, idx);
    ch.slot = idx;
    ch.slotIndex = idx;
    this.slots[idx] = ch;
    this.characters.push(ch);
    this.sinceSpawn = 0;
    this.hooks.onSpawn?.(job);
  }

  update(dt) {
    this.t += dt;
    this.sinceSpawn += dt;
    // เมื่อมีคิวสะสมเยอะ ให้ปล่อยตัวละครต่อแถวเข้ามาต่อเนื่องทุก 0.65 วินาที
    const currentGap = this.queue.length > 0 ? 0.65 : SPAWN_GAP;
    if (this.sinceSpawn > currentGap && this.characters.length < this.L.maxActive) this.#spawn();

    const actMode = this.sceneConfig.activityMode || 'loy-krathong';

    for (const ch of this.characters) {
      ch.update(dt, {
        sceneConfig: this.sceneConfig,
        allCharacters: this.characters,
        onRelease: (c) => {
          if (actMode === 'loy-krathong') {
            const lane = Math.floor(rand(0, this.L.lanes.length));
            const hand = c.handPos;
            this.floating.push(new FloatingKrathong(this.L, c.job, hand, lane));
          } else {
            this.modeStage.spawnModeEffect(actMode, c);
            if (actMode === 'party-dance' && (c.job?.tier || 0) >= 2) {
              this.fireworks.burst?.(c.x, rand(this.L.H * 0.14, this.L.H * 0.34));
            }
          }
          this.totalLaunched++;
          this.hooks.onRelease?.(c.job, this.totalLaunched);
        },
      });
      // เมื่อตัวละครกราบไหว้เสร็จและเริ่มเดินออก (state 3) ให้ปลดล็อกช่องว่างทันทีเพื่อให้คนถัดไปก้าวเข้าสู่เบาะ
      if (ch.state === 3 && this.slots[ch.slot] === ch) {
        this.slots[ch.slot] = null;
      }
      if (ch.done) this.slots[ch.slot] = null;
    }
    this.characters = this.characters.filter((c) => !c.done);

    this.floating = this.floating.filter((f) => !f.update(dt, (k) => this.director.onLand(k)));
    if (this.floating.length > MAX_FLOATING) this.floating.splice(0, this.floating.length - MAX_FLOATING);

    this.modeStage.update(dt);
    this.particles.update(dt);
    this.lanterns.update(dt);
    this.fireworks.update(dt);
    this.director.update(dt);
    this.char3D.update(this.characters, dt, this.t);
  }

  draw() {
    const { ctx, ctxTop, L, t } = this;
    const actMode = this.sceneConfig.activityMode || 'loy-krathong';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // 1. เลเยอร์ไกลสุด: ท้องฟ้า ดาว พระจันทร์ เนินเขา และพระอุโบสถ
    ctx.drawImage(this.backdrop.canvas, 0, 0);
    drawStars(ctx, this.backdrop.stars, t);

    // 2. เลเยอร์โมเดล 3D ฉากหลัง: เจดีย์สีทอง + มณฑปองค์พระ (อยู่หลังเนินหญ้าวัด)
    if (this.sceneConfig.showProps !== false && this.backdrop.modelsCanvas) {
      ctx.drawImage(this.backdrop.modelsCanvas, 0, 0);
    }

    // 3. ชิงช้าสวรรค์งานวัดหมุนไฟนีออนเรียลไทม์ (ตั้งอยู่หลังเนินหญ้าฝั่งขวา)
    if (this.sceneConfig.showFerrisWheel !== false && this.backdrop.wheel) {
      drawFerrisWheel(ctx, this.backdrop.wheel.x, this.backdrop.wheel.y, this.backdrop.wheel.r, t, L.unit);
    }

    // 4. เลเยอร์กลาง: สนามหญ้าวัด (คลุมฐานตึกให้ตั้งติดพื้นดิน) + ศาลาพระสงฆ์ + ร้านค้าขายกระทง
    if (this.backdrop.midCanvas) {
      ctx.drawImage(this.backdrop.midCanvas, 0, 0);
    }

    // 5. ชาวบ้าน NPC เดินเที่ยวงานวัดบนทางเดินสนามหญ้า
    if (this.sceneConfig.showNPCs !== false) {
      drawTempleFairNPCs(ctx, L, t);
    }

    // 6. เลเยอร์หน้า: สายไฟงานวัด ราวสะพาน โคมไฟท่าน้ำ และพื้นสะพานไม้
    if (this.backdrop.pierCanvas) {
      ctx.drawImage(this.backdrop.pierCanvas, 0, 0);
    }

    this.director.drawPillars(ctx);
    if (this.sceneConfig.showLanterns !== false) {
      this.lanterns.draw(ctx, t);
    }

    // 7. พื้นด้านล่างตามโหมดกิจกรรม: แม่น้ำลอยกระทง / ลานวัดไหว้พระ / เวทีปาร์ตี้แดนซ์ฟลอร์
    if (actMode === 'temple-blessing') {
      this.modeStage.drawTempleCourtyard(ctx, t);
    } else if (actMode === 'party-dance') {
      this.modeStage.drawPartyStage(ctx, t, this.sceneConfig.danceSpeed || 1);
    } else {
      drawWater(ctx, L, this.backdrop.lamps, t);
      this.particles.drawWaterLayer(ctx);
      [...this.floating].sort((a, b) => a.y - b.y).forEach((f) => f.draw(ctx, t));
    }

    // บรรยากาศสีตามธีมที่เลือกจากหน้า Admin
    const theme = this.sceneConfig.theme;
    if (theme === 'temple-fair') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255, 175, 60, 0.10)';
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.restore();
    } else if (theme === 'sakura-anime') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(244, 114, 182, 0.14)';
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.restore();
    } else if (theme === 'cyber-festival') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.restore();
    }

    const is3DActive = this.char3D.loaded && this.char3D.enabled;

    if (ctxTop) {
      ctxTop.clearRect(0, 0, L.W, L.H);
    }

    const overlayCtx = ctxTop || ctx;

    for (const ch of this.characters) {
      ch.draw(ctx, t, is3DActive);

      if (is3DActive) {
        if (actMode === 'loy-krathong') {
          ch.drawHeldKrathong(overlayCtx, t);
        } else {
          this.modeStage.drawModeHeldItem(overlayCtx, ch, actMode, t);
        }
        drawNameTag(overlayCtx, L, ch);
      } else {
        if (actMode !== 'loy-krathong') {
          this.modeStage.drawModeHeldItem(ctx, ch, actMode, t);
        }
        drawNameTag(ctx, L, ch);
      }
    }

    this.modeStage.drawOverlayEffects(overlayCtx, actMode, t);
    this.particles.drawAirLayer(overlayCtx);
    this.director.drawFlash(overlayCtx);
  }
}

