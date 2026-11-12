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
  constructor(L, job, slotX, tierStyleDraw = drawKrathong) {
    this.L = L;
    this.job = job;
    this.gender = job.gender === 'female' ? 'female' : 'male';
    this.o = OUTFIT[this.gender];
    this.x = -120 * L.unit;
    this.targetX = slotX;
    this.y = L.walkY;
    this.state = STATE.WALK_IN;
    this.timer = 0;
    this.walk = Math.random() * TAU;
    this.dir = 1;
    this.released = false;
    this.drawKrathong = tierStyleDraw;
    this.speed = 250 * L.unit;
    this.blink = Math.random() * 4;
  }

  get done() {
    return this.state === STATE.DONE;
  }

  /** ตำแหน่งมือขณะถือกระทง (พิกัดฉาก) */
  get handPos() {
    if (this.customHandPos) return this.customHandPos;
    const s = this.L.charScale;
    return { x: this.x + this.dir * 22 * s, y: this.y - 92 * s };
  }

  update(dt, { onRelease }) {
    this.timer += dt;
    this.blink -= dt;
    if (this.blink < -0.14) this.blink = 2 + Math.random() * 3;

    switch (this.state) {
      case STATE.WALK_IN: {
        this.walk += dt * 9;
        this.x += this.speed * dt;
        if (this.x >= this.targetX) {
          this.x = this.targetX;
          this.state = STATE.BOW;
          this.timer = 0;
        }
        break;
      }
      case STATE.BOW:
        // ปล่อยกระทงลงผิวน้ำที่ 2.2 วินาที (ขณะนั่งคุกเข่าอยู่ริมน้ำ)
        if (this.timer >= 2.2 && !this.released) {
          this.released = true;
          onRelease?.(this);
        }
        if (this.timer >= BOW_TIME) {
          this.state = STATE.PRAY;
          this.timer = 0;
        }
        break;
      case STATE.PRAY:
        if (this.timer >= PRAY_TIME) {
          this.state = STATE.WALK_OUT;
          this.dir = 1; // เดินต่อไปข้างหน้าทางขวา
          this.timer = 0;
        }
        break;
      case STATE.WALK_OUT:
        this.walk += dt * 9;
        this.x += this.speed * dt; // เดินตรงไปข้างหน้าข้ามสะพานออกทางขวา
        if (this.x > this.L.W + 180 * this.L.unit) this.state = STATE.DONE;
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

