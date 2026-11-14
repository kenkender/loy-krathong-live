import { drawKrathong } from './krathong-art.js';
import { easeInOutSine, TAU } from '../core/util.js';

const SKIN = '#f2c9a0';
const SKIN_SHADE = '#d9a77c';

const OUTFIT = {
  male: { top: '#f7f1e3', topShade: '#d9d0bb', bottom: '#27508a', bottomShade: '#1a3763', trim: '#e6b550' },
  female: { top: '#f4a6bd', topShade: '#d9809d', bottom: '#7a2a52', bottomShade: '#561b3a', trim: '#f2cf6a' },
};

const STATE = { WALK_IN: 0, BOW: 1, PRAY: 2, WALK_OUT: 3, DONE: 4 };
const BOW_TIME = 3.2;
const PRAY_TIME = 2.5;

function limb(ctx, x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** ตัวละครสไตล์ชิบิ วาดด้วยโค้ดทั้งหมด (ไม่ต้องใช้ไฟล์ภาพ) */
export class Character {
  constructor(L, job, slotX, sceneConfig = {}, tierStyleDraw = drawKrathong, slotIndex = 0) {
    if (typeof tierStyleDraw === 'number') {
      slotIndex = tierStyleDraw;
      tierStyleDraw = drawKrathong;
    }
    this.L = L;
    this.job = job;
    this.slotIndex = typeof slotIndex === 'number' ? slotIndex : 0;
    this.slot = this.slotIndex;
    this.gender = job.gender === 'female' ? 'female' : 'male';
    this.o = OUTFIT[this.gender];
    this.walkDirection = sceneConfig.walkDirection || 'left-to-right';
    this.activityMode = sceneConfig.activityMode || 'loy-krathong';
    this.depthScale = 1;
    this.zOffset = 0;
    this.walkingUp = false;

    const u = L.unit;
    const isPortrait = L.mode === 'portrait';
    const altarY = L.waterTop + 58 * u;
    // จุดเบาะรองกราบไหว้อยู่ก่อนถึงพานทองวางเทียน (+44 * u) เพื่อไม่ให้ตัวละครขึ้นไปเหยียบบนฐานบูชา
    const cushionY = altarY + 44 * u;

    if (this.activityMode === 'temple-blessing') {
      // โหมดไหว้พระขอพร: เดินเข้าตามแนวเส้นทางเดินขบวนบุญสีทอง 5 สาย
      this.targetX = slotX;
      this.targetY = cushionY;
      const baseStart = isPortrait ? 76 * u : 44 * u;
      const laneSpacing = isPortrait ? 86 * u : 46 * u;
      this.laneY = this.targetY + baseStart + this.slotIndex * laneSpacing;

      // เริ่มเดินจากซ้ายจอตามแนวระดับความสูงของช่องตนเอง ถือถ้วยเทียนทองคำ
      this.x = -140 * u;
      this.y = this.laneY;
      this.dir = 1;
      this.exitDir = 1;
      this.depthScale = 1.0 + (this.slotIndex * 0.045);
    } else if (this.walkDirection === 'right-to-left') {
      this.targetX = slotX;
      this.targetY = L.walkY;
      this.x = L.W + 120 * u;
      this.y = L.walkY;
      this.dir = -1;
      this.exitDir = -1;
    } else if (this.walkDirection === 'back-to-front') {
      this.targetX = slotX;
      this.targetY = L.walkY;
      this.x = slotX + (Math.random() - 0.5) * 40 * u;
      this.y = L.walkY - 64 * u;
      this.depthScale = 0.74;
      this.dir = slotX < L.W * 0.5 ? 1 : -1;
      this.exitDir = slotX < L.W * 0.5 ? -1 : 1;
    } else if (this.walkDirection === 'center-spread') {
      this.targetX = slotX;
      this.targetY = L.walkY;
      this.x = L.W * 0.5;
      this.y = L.walkY - 44 * u;
      this.depthScale = 0.82;
      this.dir = slotX >= L.W * 0.5 ? 1 : -1;
      this.exitDir = slotX >= L.W * 0.5 ? 1 : -1;
    } else {
      // left-to-right (ค่าเริ่มต้น)
      this.targetX = slotX;
      this.targetY = L.walkY;
      this.x = -120 * u;
      this.y = L.walkY;
      this.dir = 1;
      this.exitDir = 1;
    }

    this.vx = 0;
    this.state = STATE.WALK_IN;
    this.timer = 0;
    this.walk = Math.random() * TAU;
    this.released = false;
    this.drawKrathong = tierStyleDraw;
    this.speed = 250 * u;
    this.blink = Math.random() * 4;
  }

  get done() {
    return this.state === STATE.DONE;
  }

  /** ตำแหน่งมือขณะถือกระทง/ถ้วยเทียน (พิกัดฉาก) */
  get handPos() {
    if (this.customHandPos) return this.customHandPos;
    const s = this.L.charScale;
    if (this.walkingUp) {
      return { x: this.x, y: this.y - 92 * s };
    }
    return { x: this.x + this.dir * 22 * s, y: this.y - 92 * s };
  }

  update(dt, { onRelease, sceneConfig, allCharacters }) {
    if (sceneConfig) {
      this.activityMode = sceneConfig.activityMode || this.activityMode;
    }
    this.timer += dt;
    this.blink -= dt;
    if (this.blink < -0.14) this.blink = 2 + Math.random() * 3;

    const u = this.L.unit;
    const tier = Math.min(4, Math.max(0, this.job?.tier || 0));
    const bowDuration = this.activityMode === 'party-dance' ? 2.6 + tier * 0.6 : BOW_TIME;
    const prayDuration = this.activityMode === 'party-dance' ? 2.8 + tier * 0.8 : PRAY_TIME;

    switch (this.state) {
      case STATE.WALK_IN: {
        this.walk += dt * 9;
        if (this.activityMode === 'temple-blessing') {
          // ตรวจสอบว่ามีคนข้างหน้าที่อยู่ในเลน/ช่องเดียวกันหรือไม่ (ระบบต่อแถวขบวนบุญ)
          let leader = null;
          if (Array.isArray(allCharacters)) {
            for (const other of allCharacters) {
              if (other !== this && other.slotIndex === this.slotIndex && !other.done) {
                if (other.state > this.state) {
                  leader = other;
                } else if (other.state === this.state) {
                  if (this.walkingUp && other.walkingUp && other.y < this.y) {
                    leader = other;
                  } else if (!this.walkingUp && !other.walkingUp && other.x > this.x) {
                    leader = other;
                  } else if (other.walkingUp && !this.walkingUp) {
                    leader = other;
                  }
                }
              }
            }
          }

          // ขบวนบุญเดินตามแนวเส้นสีแดง:
          // เฟส 1: เดินตรงในแนวนอนตามเลนความสูงของตนเอง (laneY) ไปจนถึงตำแหน่ง X ของเบาะไหว้ (targetX)
          if (!this.walkingUp) {
            this.dir = 1;
            this.y = this.laneY;
            const step = this.speed * dt;
            let maxX = this.targetX;
            if (leader && !leader.walkingUp) {
              maxX = Math.min(maxX, leader.x - 72 * u);
            }
            if (this.x + step >= maxX) {
              this.x = maxX;
              if (this.x >= this.targetX) {
                this.walkingUp = true; // เลี้ยว 90 องศาขึ้นข้างบนมุ่งสู่เบาะรองกราบ
                this.vx = 0;
              } else {
                this.vx = 0; // ยืนรอคนข้างหน้าเดินพ้นทาง
              }
            } else {
              this.x += step;
              this.vx = this.speed;
            }
          } else {
            // เฟส 2: เลี้ยว 90 องศาเดินขึ้นหน้าตรงไปยังเบาะรองกราบไหว้สีทอง (targetY)
            this.x = this.targetX;
            let targetStopY = this.targetY;
            if (leader && leader.state !== STATE.WALK_OUT) {
              if (leader.walkingUp) {
                targetStopY = leader.y + 68 * u;
              } else {
                // คนข้างหน้ากำลังคุกเข่ากราบไหว้อยู่ที่เบาะ ให้ต่อแถวยืนรออยู่ด้านหลังเบาะ
                targetStopY = this.targetY + 65 * u;
              }
            }

            const dy = this.y - targetStopY;
            const step = this.speed * dt;
            if (dy <= step || dy < 2) {
              this.y = targetStopY;
              this.vx = 0;
              if (targetStopY === this.targetY) {
                // ถึงเบาะกราบไหว้แล้ว เริ่มคุกเข่ากราบไหว้องค์พระ
                this.walkingUp = false;
                this.isWaitingInQueue = false;
                this.depthScale = 1.0;
                this.state = STATE.BOW;
                this.timer = 0;
              } else {
                // กำลังยืนถือถ้วยเทียนต่อแถวรอคิวอย่างสงบสำรวม
                this.isWaitingInQueue = true;
              }
            } else {
              this.y -= step;
              this.vx = 0;
              this.isWaitingInQueue = false;
              // ค่อยๆ ปรับ Perspective ให้เข้าใกล้ขนาดมาตรฐาน 1.0 เมื่อถึงเบาะ
              const totalDist = Math.max(1, this.laneY - this.targetY);
              const progress = Math.min(1, Math.max(0, (this.laneY - this.y) / totalDist));
              const startScale = 1.0 + (this.slotIndex * 0.045);
              this.depthScale = startScale * (1 - progress) + 1.0 * progress;
            }
          }
        } else {
          const dx = this.targetX - this.x;
          const dy = this.targetY - this.y;
          const dist = Math.hypot(dx, dy);
          const step = this.speed * dt;
          if (dist <= step || dist < 2) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.depthScale = 1;
            this.vx = 0;
            this.state = STATE.BOW;
            this.timer = 0;
          } else {
            this.vx = (dx / dist) * this.speed;
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;
            const totalY = 64 * this.L.unit;
            const remY = Math.max(0, this.targetY - this.y);
            this.depthScale = 1 - Math.min(0.28, (remY / totalY) * 0.26);
          }
        }
        break;
      }
      case STATE.BOW:
        // ปล่อยกระทง / ส่งคำอธิษฐาน / เอฟเฟกต์เต้นที่จังหวะไฮไลท์
        if (this.timer >= 1.8 && !this.released) {
          this.released = true;
          onRelease?.(this);
        }
        if (this.timer >= bowDuration) {
          this.state = STATE.PRAY;
          this.timer = 0;
        }
        break;
      case STATE.PRAY:
        if (this.timer >= prayDuration) {
          this.state = STATE.WALK_OUT;
          this.dir = this.exitDir || 1;
          this.timer = 0;
        }
        break;
      case STATE.WALK_OUT:
        this.walk += dt * 9;
        this.vx = this.dir * this.speed;
        this.x += this.vx * dt;
        if (this.x > this.L.W + 180 * this.L.unit || this.x < -180 * this.L.unit) {
          this.state = STATE.DONE;
        }
        break;
      default:
    }
  }

  /** วาดกระทงที่ตัวละครถืออยู่ (เรียกแยกเพื่อวาดบนเลเยอร์หน้าโมเดล 3D ได้) */
  drawHeldKrathong(ctx, t) {
    if (this.released || (this.state !== STATE.WALK_IN && this.state !== STATE.BOW)) return;
    const hp = this.handPos;
    ctx.save();
    ctx.translate(hp.x, hp.y);
    ctx.scale(0.42 * this.L.unit, 0.42 * this.L.unit);
    this.drawKrathong(ctx, Math.min(this.job.tier, 4), t, 2);
    ctx.restore();
  }

  draw(ctx, t, is3D = false) {
    if (is3D) {
      // เมื่อใช้โมเดล 3D วาดเฉพาะเงาที่พื้น (กระทงในมือจะวาดบน scene-top เพื่อให้อยู่ด้านหน้าตัวละคร)
      const s = this.L.charScale;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 46, 9, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    const s = this.L.charScale;
    const o = this.o;
    const walking = this.state === STATE.WALK_IN || this.state === STATE.WALK_OUT;
    const swing = walking ? Math.sin(this.walk) : 0;
    const bob = walking ? Math.abs(Math.cos(this.walk)) * 5 : Math.sin(t * 2) * 1.2;

    let bow = 0; // 0..1
    if (this.state === STATE.BOW) bow = easeInOutSine(Math.min(1, this.timer / (BOW_TIME * 0.7)));
    if (this.state === STATE.PRAY) bow = 0.35 * (1 - Math.min(1, this.timer / 0.5)) + (this.timer > PRAY_TIME - 0.5 ? 0.2 : 0.1);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);

    // เงาพื้น
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 46, 9, 0, 0, TAU);
    ctx.fill();

    ctx.translate(0, -bob);

    // ขา
    if (this.gender === 'male') {
      const lx = 13;
      limb(ctx, -lx, -90, -lx + swing * 16, -6, 17, o.bottom);
      limb(ctx, lx, -90, lx - swing * 16, -6, 17, o.bottomShade);
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.ellipse(-lx + swing * 16, -3, 11, 6, 0, 0, TAU);
      ctx.ellipse(lx - swing * 16, -3, 11, 6, 0, 0, TAU);
      ctx.fill();
      // ผ้าโจงกระเบน
      ctx.fillStyle = o.bottom;
      ctx.beginPath();
      ctx.roundRect(-30, -112, 60, 40, 12);
      ctx.fill();
      ctx.fillStyle = o.trim;
      ctx.fillRect(-30, -112, 60, 5);
    } else {
      const sway = swing * 6;
      const g = ctx.createLinearGradient(0, -110, 0, 0);
      g.addColorStop(0, o.bottom);
      g.addColorStop(1, o.bottomShade);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-28, -112);
      ctx.lineTo(28, -112);
      ctx.lineTo(38 + sway, -8);
      ctx.lineTo(-38 + sway, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = o.trim;
      ctx.beginPath();
      ctx.moveTo(-37 + sway, -22);
      ctx.lineTo(38 + sway, -22);
      ctx.lineTo(38 + sway, -8);
      ctx.lineTo(-38 + sway, -8);
      ctx.fill();
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.ellipse(-14 + sway, -4, 10, 5, 0, 0, TAU);
      ctx.ellipse(14 + sway, -4, 10, 5, 0, 0, TAU);
      ctx.fill();
    }

    // ลำตัว + ก้มตัว (บีบสูงและเลื่อนลง)
    ctx.save();
    ctx.translate(0, -112);
    ctx.scale(1, 1 - bow * 0.07);
    ctx.translate(0, 112);

    const tg = ctx.createLinearGradient(-30, 0, 30, 0);
    tg.addColorStop(0, o.topShade);
    tg.addColorStop(0.4, o.top);
    tg.addColorStop(1, o.top);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.roundRect(-31, -176, 62, 74, [18, 18, 8, 8]);
    ctx.fill();

    if (this.gender === 'female') {
      // สไบเฉียง
      ctx.fillStyle = o.trim;
      ctx.beginPath();
      ctx.moveTo(-31, -170);
      ctx.lineTo(-12, -176);
      ctx.lineTo(31, -112);
      ctx.lineTo(10, -104);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-4, -150, 4, 24);
    } else {
      ctx.fillStyle = o.trim;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, -164 + i * 17, 2.6, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = o.topShade;
      ctx.fillRect(-1, -176, 2, 74);
    }
    ctx.restore();

    // แขน
    const sh = -166 + bow * 6;
    const hold = this.state === STATE.WALK_IN || (this.state === STATE.BOW && !this.released);
    const dir = this.dir;
    if (hold) {
      const hy = -118 + bow * 52;
      const hx = dir * (20 + bow * 18);
      limb(ctx, -28, sh, hx - 12, hy, 13, o.top);
      limb(ctx, 28, sh, hx + 12, hy, 13, o.topShade);
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.arc(hx - 12, hy, 8, 0, TAU);
      ctx.arc(hx + 12, hy, 8, 0, TAU);
      ctx.fill();
      // กระทงในมือ
      ctx.save();
      ctx.translate(hx, hy + 8);
      ctx.scale(0.4, 0.4);
      this.drawKrathong(ctx, Math.min(this.job.tier, 4), t, 2);
      ctx.restore();
    } else if (this.state === STATE.PRAY || this.state === STATE.BOW) {
      // ไหว้: พนมมือที่อก
      const hx = 0;
      const hy = -142 + bow * 14;
      limb(ctx, -28, sh, hx - 5, hy, 13, o.top);
      limb(ctx, 28, sh, hx + 5, hy, 13, o.topShade);
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.ellipse(hx, hy - 6, 9, 15, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = SKIN_SHADE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 20);
      ctx.lineTo(hx, hy + 6);
      ctx.stroke();
    } else {
      const a = swing * 14;
      limb(ctx, -28, sh, -34 - a * 0.3, -112 + a, 13, o.top);
      limb(ctx, 28, sh, 34 + a * 0.3, -112 - a, 13, o.topShade);
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.arc(-34 - a * 0.3, -108 + a, 8, 0, TAU);
      ctx.arc(34 + a * 0.3, -108 - a, 8, 0, TAU);
      ctx.fill();
    }

    this.#head(ctx, bow, t);
    ctx.restore();
  }

  #head(ctx, bow, t) {
    const cy = -214 + bow * 18;
    const dir = this.dir;
    const r = 40;

    // คอ
    ctx.fillStyle = SKIN_SHADE;
    ctx.fillRect(-9, cy + 28, 18, 16);

    // ผมด้านหลัง (หญิง)
    if (this.gender === 'female') {
      ctx.fillStyle = '#17121f';
      ctx.beginPath();
      ctx.ellipse(0, cy + 4, r + 5, r + 2, 0, 0, TAU);
      ctx.fill();
      // มวยผม
      ctx.beginPath();
      ctx.arc(-dir * 6, cy - r - 8, 20, 0, TAU);
      ctx.fill();
    }

    // ใบหน้า
    const fg = ctx.createRadialGradient(-8, cy - 10, 4, 0, cy, r);
    fg.addColorStop(0, '#f8d9b6');
    fg.addColorStop(1, SKIN);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(0, cy, r - 2, r, 0, 0, TAU);
    ctx.fill();

    // ผมด้านหน้า
    ctx.fillStyle = '#17121f';
    ctx.beginPath();
    if (this.gender === 'male') {
      ctx.moveTo(-r + 1, cy - 4);
      ctx.bezierCurveTo(-r - 4, cy - r - 12, r + 4, cy - r - 12, r - 1, cy - 4);
      ctx.bezierCurveTo(r - 10, cy - 24, -r + 10, cy - 24, -r + 1, cy - 4);
    } else {
      ctx.moveTo(-r + 1, cy + 2);
      ctx.bezierCurveTo(-r - 2, cy - r - 10, r + 2, cy - r - 10, r - 1, cy + 2);
      ctx.bezierCurveTo(r - 6, cy - 18, 8, cy - 28, 0, cy - 24);
      ctx.bezierCurveTo(-8, cy - 28, -r + 6, cy - 18, -r + 1, cy + 2);
    }
    ctx.fill();

    // ดอกไม้ทัดหู + เข็มทอง (หญิง)
    if (this.gender === 'female') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        ctx.beginPath();
        ctx.ellipse(dir * 28 + Math.cos(a) * 7, cy - 18 + Math.sin(a) * 7, 6, 4.5, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffcf3a';
      ctx.beginPath();
      ctx.arc(dir * 28, cy - 18, 3.6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#f2cf6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-dir * 24, cy - r - 4);
      ctx.lineTo(-dir * 6, cy - r - 24);
      ctx.stroke();
    }

    // ตา
    const closed = this.blink < 0 || this.state === STATE.PRAY;
    const ex = dir * 3;
    ctx.fillStyle = '#2a1a1a';
    ctx.strokeStyle = '#2a1a1a';
    ctx.lineWidth = 3;
    [-14, 14].forEach((dx) => {
      if (closed) {
        ctx.beginPath();
        ctx.arc(dx + ex, cy + 4, 6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(dx + ex, cy + 5, 5, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(dx + ex - 1.5, cy + 2.5, 2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#2a1a1a';
      }
    });
    // แก้มและยิ้ม
    ctx.fillStyle = 'rgba(255,120,120,0.28)';
    ctx.beginPath();
    ctx.ellipse(-24 + ex, cy + 18, 8, 5, 0, 0, TAU);
    ctx.ellipse(24 + ex, cy + 18, 8, 5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8a4a3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ex, cy + 16, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
}

