import { TAU } from '../core/util.js';

/** พารามิเตอร์รูปลักษณ์ของกระทงแต่ละระดับ (0 = ฟรี … 4 = ใหญ่สุด) */
export const KRATHONG_STYLES = [
  { petals: 8, layers: 1, flowers: 0, candles: 1, gold: false, aura: 0, size: 0.8 },
  { petals: 10, layers: 1, flowers: 6, candles: 1, gold: false, aura: 0.15, size: 1.0 },
  { petals: 12, layers: 2, flowers: 9, candles: 2, gold: false, aura: 0.35, size: 1.2 },
  { petals: 14, layers: 2, flowers: 10, candles: 3, gold: true, aura: 0.6, size: 1.5 },
  { petals: 18, layers: 3, flowers: 14, candles: 5, gold: true, aura: 1, size: 2.0 },
];

const FLOWER_COLORS = ['#ff8fb8', '#ffd45e', '#ffffff', '#ff9f6b', '#d38cff'];

function leaf(ctx, x, y, dx, h, w, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x - w * 0.6 + dx * 0.4, y - h * 0.6, x + dx, y - h);
  ctx.quadraticCurveTo(x + w * 0.6 + dx * 0.4, y - h * 0.6, x + w / 2, y);
  ctx.closePath();
  ctx.fill();
}

function flower(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.4, r * 0.5, r * 0.36, a, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffcf3a';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, TAU);
  ctx.fill();
}

function candle(ctx, x, y, h, t, seed) {
  const flick = 0.85 + 0.15 * Math.sin(t * 11 + seed * 3) + 0.05 * Math.sin(t * 23 + seed);
  const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0);
  g.addColorStop(0, '#e8d9b0');
  g.addColorStop(1, '#fff6dc');
  ctx.fillStyle = g;
  ctx.fillRect(x - 4, y - h, 8, h);
  // รัศมีเปลวเทียน
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y - h - 8, 0, x, y - h - 8, 44);
  glow.addColorStop(0, `rgba(255,190,90,${0.55 * flick})`);
  glow.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 46, y - h - 54, 92, 92);
  ctx.restore();
  // เปลว
  const fh = 16 * flick;
  const fg = ctx.createLinearGradient(0, y - h - fh, 0, y - h);
  fg.addColorStop(0, '#fff3a0');
  fg.addColorStop(1, '#ff8a2a');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(x, y - h - fh);
  ctx.quadraticCurveTo(x + 6, y - h - 4, x, y - h + 1);
  ctx.quadraticCurveTo(x - 6, y - h - 4, x, y - h - fh);
  ctx.fill();
}

/**
 * วาดกระทง จุดอ้างอิง (0,0) = กึ่งกลางฐานที่แตะผิวน้ำ ขนาดฐานรัศมี ≈ 58 หน่วย
 * @param {number} tier  0-4
 * @param {number} t     เวลา (วินาที) ใช้กับเปลวเทียนและแสง
 */
export function drawKrathong(ctx, tier, t = 0, seed = 1) {
  const s = KRATHONG_STYLES[tier];
  const rx = 58;
  const ry = 15;

  // แสงรอบกระทง
  if (s.aura > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const R = 120 + s.aura * 140;
    const g = ctx.createRadialGradient(0, -20, 6, 0, -20, R);
    g.addColorStop(0, s.gold ? `rgba(255,205,100,${0.42 * s.aura})` : `rgba(255,190,120,${0.35 * s.aura})`);
    g.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R - 20, R * 2, R * 2);
    ctx.restore();
  }

  // เงาใต้น้ำ
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 8, rx * 1.05, ry * 0.9, 0, 0, TAU);
  ctx.fill();

  // ฐานกระทง (หยวกกล้วย / ทอง)
  const base = ctx.createLinearGradient(0, -ry, 0, ry + 8);
  if (s.gold) {
    base.addColorStop(0, '#fff0b0');
    base.addColorStop(0.5, '#e3a93c');
    base.addColorStop(1, '#8a5a18');
  } else {
    base.addColorStop(0, '#eaf2b8');
    base.addColorStop(0.55, '#b6c96a');
    base.addColorStop(1, '#6a8038');
  }
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,60,20,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * (1 - i * 0.22), ry * (1 - i * 0.22), 0, 0, TAU);
    ctx.stroke();
  }

  const leafFill = (L) => {
    if (s.gold) return L % 2 ? '#e0a23a' : '#ffd876';
    return L % 2 ? '#3f8a45' : '#58a851';
  };

  // กลีบใบตอง: วาดครึ่งหลังก่อน แล้วค่อยวาดครึ่งหน้า
  const ring = (L, front) => {
    const r = rx * (1 - L * 0.25);
    const lift = L * 20;
    const h = 36 + L * 6;
    for (let i = 0; i < s.petals; i++) {
      const a = (i / s.petals) * TAU + L * 0.2;
      const isFront = Math.sin(a) >= 0;
      if (isFront !== front) continue;
      const x = Math.cos(a) * r * 0.9;
      const y = Math.sin(a) * ry * 0.85 - lift;
      leaf(ctx, x, y, Math.cos(a) * 9, h, 17, leafFill(L + i));
    }
  };
  for (let L = 0; L < s.layers; L++) ring(L, false);

  // เทียน + ธูป (กลางกระทง)
  const cy = -s.layers * 20 + 2;
  const spread = 14 + s.candles * 4;
  for (let i = 0; i < s.candles; i++) {
    const x = s.candles === 1 ? 0 : (i / (s.candles - 1) - 0.5) * spread * 2;
    candle(ctx, x, cy - Math.abs(x) * 0.05, 26 + (i % 2) * 6, t, seed + i);
  }
  if (tier >= 1) {
    ctx.strokeStyle = '#7a4a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-spread - 14, cy);
    ctx.lineTo(-spread - 22, cy - 40);
    ctx.stroke();
  }

  for (let L = 0; L < s.layers; L++) ring(L, true);

  // ดอกไม้
  for (let i = 0; i < s.flowers; i++) {
    const a = (i / s.flowers) * TAU + 0.3;
    const rr = rx * (0.55 + 0.32 * ((i * 7) % 3) / 2);
    flower(ctx, Math.cos(a) * rr, Math.sin(a) * ry * 0.8 - 6 - (i % 2) * 6, 9 + (i % 3) * 1.5, FLOWER_COLORS[(i + seed) % FLOWER_COLORS.length]);
  }

  // ยอดดอกบัวทอง (ระดับสูง)
  if (tier >= 3) {
    ctx.fillStyle = '#ffe9a0';
    for (let i = -2; i <= 2; i++) {
      leaf(ctx, i * 6, cy - 42, i * 3, 28 - Math.abs(i) * 4, 9, i % 2 ? '#ffd876' : '#fff0b8');
    }
  }
}

