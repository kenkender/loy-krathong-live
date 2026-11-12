import { drawKrathong, KRATHONG_STYLES } from './krathong-art.js';
import { clamp, easeOutCubic, rand } from '../core/util.js';

const LIFE = 34; // วินาทีที่กระทงลอยอยู่ในฉาก
const FADE = 5;

/** กระทงที่ตกลงน้ำแล้วลอยไปตามกระแส */
export class FloatingKrathong {
  constructor(L, job, from, lane) {
    this.L = L;
    this.job = job;
    this.tier = job.tier;
    this.seed = Math.floor(rand(0, 9));
    const laneScale = 1 + lane * 0.08;
    this.scale = KRATHONG_STYLES[job.tier].size * L.unit * laneScale;
    this.from = from;
    // กระทงใหญ่ต้องลอยลึกลงไปอีก ไม่ให้บังท่าน้ำและตัวละคร
    this.laneY = L.lanes[lane] + [0, 6, 34, 84, 170][job.tier] * L.unit;
    this.x = from.x;
    this.y = from.y;
    this.age = 0;
    this.drop = 0.7; // วินาทีที่ใช้ตกลงน้ำ
    this.landed = false;
    this.speed = rand(14, 26) * L.unit * (1 - this.tier * 0.08);
    this.phase = rand(0, 6.28);
  }

  /** @returns {boolean} true เมื่อควรลบออก */
  update(dt, onLand) {
    this.age += dt;
    if (this.age < this.drop) {
      const k = this.age / this.drop;
      this.x = this.from.x + 40 * this.L.unit * easeOutCubic(k);
      this.y = this.from.y + (this.laneY - this.from.y) * k * k - Math.sin(k * Math.PI) * 50 * this.L.unit;
    } else {
      if (!this.landed) {
        this.landed = true;
        onLand?.(this);
      }
      this.x += this.speed * dt;
      this.y = this.laneY + Math.sin(this.age * 1.4 + this.phase) * 3 * this.L.unit;
    }
    return this.age > LIFE || this.x > this.L.W + 200;
  }

  get alpha() {
    return clamp((LIFE - this.age) / FADE, 0, 1);
  }

  draw(ctx, t) {
    const a = this.alpha;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(this.x, this.y);
    const bank = this.landed ? Math.sin(this.age * 1.4 + this.phase) * 0.03 : 0;
    ctx.rotate(bank);
    ctx.scale(this.scale, this.scale);

    // เงาสะท้อนบนผิวน้ำ
    if (this.landed) {
      ctx.save();
      ctx.scale(1, -0.32);
      ctx.globalAlpha = a * 0.22;
      drawKrathong(ctx, this.tier, t, this.seed);
      ctx.restore();
    }
    drawKrathong(ctx, this.tier, t, this.seed);
    ctx.restore();

    // ป้ายชื่อเจ้าของกระทง แสดงใต้กระทงทุกระดับตลอดจนกว่าจะลอยพ้นฉากไป
    if (this.landed && this.job.user?.name) {
      const u = this.L.unit;
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      const fontSize = (this.tier >= 3 ? 23 : (this.tier >= 2 ? 21 : 19)) * u;
      ctx.font = `600 ${fontSize}px "Leelawadee UI","Noto Sans Thai",sans-serif`;
      const textWidth = ctx.measureText(this.job.user.name).width;
      const padX = 24 * u;
      const w = textWidth + padX;
      const h = 32 * u;
      // ระยะห่างใต้กระทงตามขนาดกระทง
      const tagY = this.y + 24 * u * (this.scale / u) + 4 * u;

      // พื้นหลังป้ายชื่อมน ขอบเรืองแสงนวลๆ
      ctx.fillStyle = 'rgba(6, 10, 28, 0.72)';
      ctx.beginPath();
      ctx.roundRect(this.x - w / 2, tagY, w, h, h / 2);
      ctx.fill();

      // ขอบป้ายสีทองสำหรับเทียร์สูง หรือขาวมุกสำหรับเทียร์เริ่มต้น
      ctx.strokeStyle = this.tier >= 3 ? 'rgba(255, 215, 0, 0.65)' : (this.tier >= 2 ? 'rgba(255, 200, 100, 0.45)' : 'rgba(255, 255, 255, 0.28)');
      ctx.lineWidth = 1.2 * u;
      ctx.stroke();

      // ข้อความชื่อ
      ctx.fillStyle = this.tier >= 3 ? '#ffe894' : (this.tier >= 2 ? '#fff2c8' : '#ffffff');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.job.user.name, this.x, tagY + h / 2);
      ctx.restore();
    }
  }
}
