import { offscreen, seeded, TAU } from '../core/util.js';

/** วาดพระสงฆ์นั่ง/ยืนให้พรในศาลาซุ้มไม้สักทอง (มีพื้นศาลาและเสาชัดเจน ไม่ลอย) */
function drawMonkPavilion(ctx, x, baseY, h, u) {
  const w = h * 1.05;

  // เงาพื้นศาลา
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, baseY + 4 * u, w * 0.6, 10 * u, 0, 0, TAU);
  ctx.fill();

  // แสงเทียนและรัศมีสีทองอบอุ่นในศาลา
  const g = ctx.createRadialGradient(x, baseY - h * 0.45, 4 * u, x, baseY - h * 0.45, h * 0.75);
  g.addColorStop(0, 'rgba(255,215,120,0.42)');
  g.addColorStop(0.55, 'rgba(255,170,60,0.14)');
  g.addColorStop(1, 'rgba(255,150,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, baseY - h * 0.45, h * 0.75, 0, TAU);
  ctx.fill();

  // ฐานศาลาและอาสน์สงฆ์ไม้สักทอง
  ctx.fillStyle = '#4a2511';
  ctx.beginPath();
  ctx.roundRect(x - w * 0.52, baseY - 14 * u, w * 1.04, 16 * u, 4 * u);
  ctx.fill();
  ctx.fillStyle = '#d49b38';
  ctx.fillRect(x - w * 0.5, baseY - 14 * u, w, 3 * u);

  // พรมแดงปูอาสน์สงฆ์
  ctx.fillStyle = '#8e1b1b';
  ctx.fillRect(x - w * 0.36, baseY - 22 * u, w * 0.72, 9 * u);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(x - w * 0.36, baseY - 22 * u, w * 0.72, 2 * u);

  // เสาไม้สีทอง 2 ต้นซ้าย-ขวา
  const roofY = baseY - h * 0.88;
  ctx.fillStyle = '#8a5a1e';
  ctx.fillRect(x - w * 0.4, roofY, 5 * u, h * 0.88 - 12 * u);
  ctx.fillRect(x + w * 0.4 - 5 * u, roofY, 5 * u, h * 0.88 - 12 * u);
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(x - w * 0.4, roofY, 2 * u, h * 0.88 - 12 * u);
  ctx.fillRect(x + w * 0.4 - 5 * u, roofY, 2 * u, h * 0.88 - 12 * u);

  // หลังคาซุ้มทรงไทย + ยอดฉัตร
  ctx.fillStyle = '#6e1e2a';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.56, roofY + 6 * u);
  ctx.lineTo(x - w * 0.25, roofY - h * 0.22);
  ctx.lineTo(x, roofY - h * 0.38);
  ctx.lineTo(x + w * 0.25, roofY - h * 0.22);
  ctx.lineTo(x + w * 0.56, roofY + 6 * u);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 2.5 * u;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.56, roofY + 6 * u);
  ctx.lineTo(x, roofY - h * 0.38);
  ctx.lineTo(x + w * 0.56, roofY + 6 * u);
  ctx.stroke();

  // พระสงฆ์นั่งขัดสมาธิให้พรบนอาสน์สงฆ์
  const monkY = baseY - 22 * u;
  const robe = ctx.createLinearGradient(x - 16 * u, 0, x + 16 * u, 0);
  robe.addColorStop(0, '#b8420a');
  robe.addColorStop(0.5, '#e67e22');
  robe.addColorStop(1, '#9c3606');
  ctx.fillStyle = robe;

  // ขาขัดสมาธิ
  ctx.beginPath();
  ctx.ellipse(x, monkY - 4 * u, 18 * u, 7 * u, 0, 0, TAU);
  ctx.fill();

  // ลำตัวห่มจีวร
  ctx.beginPath();
  ctx.roundRect(x - 12 * u, monkY - 34 * u, 24 * u, 30 * u, [9 * u, 9 * u, 4 * u, 4 * u]);
  ctx.fill();

  // ศีรษะพระสงฆ์
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, monkY - 42 * u, 9 * u, 0, TAU);
  ctx.fill();

  // มือพนมให้พร
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.ellipse(x, monkY - 21 * u, 4 * u, 6 * u, 0, 0, TAU);
  ctx.fill();

  // ขันน้ำมนต์และเทียนด้านข้าง
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(x + 22 * u, monkY - 4 * u, 5 * u, 0, TAU);
  ctx.fill();
}

/** วาดซุ้มร้านขายกระทงในงานวัด (สมส่วน มีเงาพื้น) */
function drawKrathongShop(ctx, x, baseY, w, h, u) {
  // เงาพื้นร้านค้า
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, baseY + 4 * u, w * 0.58, 10 * u, 0, 0, TAU);
  ctx.fill();

  // แสงไฟอุ่นๆ ใต้ซุ้มร้าน
  const shopGlow = ctx.createRadialGradient(x, baseY - h * 0.55, 5 * u, x, baseY - h * 0.55, w * 0.7);
  shopGlow.addColorStop(0, 'rgba(255,210,120,0.38)');
  shopGlow.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = shopGlow;
  ctx.beginPath();
  ctx.arc(x, baseY - h * 0.55, w * 0.7, 0, TAU);
  ctx.fill();

  // โครงเสาไม้
  ctx.fillStyle = '#3e2215';
  ctx.fillRect(x - w * 0.44, baseY - h, 5 * u, h);
  ctx.fillRect(x + w * 0.44 - 5 * u, baseY - h, 5 * u, h);

  // แม่ค้ายืนยิ้มหลังร้าน
  ctx.fillStyle = '#ec407a';
  ctx.beginPath();
  ctx.roundRect(x - 10 * u, baseY - h * 0.68, 20 * u, 26 * u, 6 * u);
  ctx.fill();
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(x, baseY - h * 0.77, 8 * u, 0, TAU);
  ctx.fill();

  // โต๊ะวางกระทงคลุมผ้าลายไทย
  ctx.fillStyle = '#4e2c1c';
  ctx.fillRect(x - w * 0.46, baseY - h * 0.42, w * 0.92, h * 0.42);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - w * 0.46, baseY - h * 0.42, w * 0.92, h * 0.16);
  ctx.fillStyle = '#f5c35b';
  ctx.fillRect(x - w * 0.48, baseY - h * 0.44, w * 0.96, 4 * u);

  // กระทงวางเรียงบนโต๊ะ 3 อัน
  for (let i = -1; i <= 1; i++) {
    const kx = x + i * (w * 0.27);
    const ky = baseY - h * 0.46;
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 11 * u, 5.5 * u, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = i === 0 ? '#ffd54f' : '#ff80ab';
    ctx.beginPath();
    ctx.arc(kx, ky - 2.5 * u, 4 * u, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(kx, ky - 8 * u, 2 * u, 0, TAU);
    ctx.fill();
  }

  // หลังคาผ้าใบกันสาดลายทางงานวัด
  const roofY = baseY - h;
  const stripes = 7;
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d93829' : '#fff8e7';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + i * sw, roofY);
    ctx.lineTo(x - w / 2 + (i + 1) * sw, roofY);
    ctx.lineTo(x - w / 2 + (i + 1) * sw + 4 * u, roofY + 18 * u);
    ctx.lineTo(x - w / 2 + i * sw + 4 * u, roofY + 18 * u);
    ctx.closePath();
    ctx.fill();
  }

  // ป้ายร้าน "ร้านกระทง"
  ctx.fillStyle = '#5d2906';
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.4, roofY - 18 * u, w * 0.8, 16 * u, 4 * u);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe599';
  ctx.font = `700 ${10.5 * u}px "Leelawadee UI","Noto Sans Thai",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ร้านกระทงมงคล', x, roofY - 10 * u);
}

/** วาดชิงช้าสวรรค์งานวัดหมุนได้แบบเรียลไทม์ (อยู่ฉากหลังไกล สมส่วน) */
export function drawFerrisWheel(ctx, cx, cy, radius, t, u) {
  ctx.save();

  // แสงออร่าไฟนีออนหลังชิงช้าสวรรค์
  const bgGlow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.35);
  bgGlow.addColorStop(0, 'rgba(255,120,200,0.16)');
  bgGlow.addColorStop(0.6, 'rgba(80,190,255,0.08)');
  bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.35, 0, TAU);
  ctx.fill();

  // เสาค้ำรูปตัว A ลงสู่พื้นดิน
  ctx.strokeStyle = '#263268';
  ctx.lineWidth = 4.5 * u;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - radius * 0.58, cy + radius * 1.32);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + radius * 0.58, cy + radius * 1.32);
  ctx.moveTo(cx - radius * 0.4, cy + radius * 0.9);
  ctx.lineTo(cx + radius * 0.4, cy + radius * 0.9);
  ctx.stroke();

  // วงล้อรอบนอก
  const angle = t * 0.32;
  const spokes = 8;
  const neonCols = ['#ff2e93', '#00e5ff', '#ffde00', '#00e676', '#d500f9', '#ff9100', '#3d5afe', '#ff5252'];

  ctx.strokeStyle = 'rgba(255,240,200,0.45)';
  ctx.lineWidth = 2.2 * u;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.arc(cx, cy, radius * 0.62, 0, TAU);
  ctx.stroke();

  // ซี่ล้อ + กระเช้าโดยสาร
  for (let i = 0; i < spokes; i++) {
    const a = angle + (i / spokes) * TAU;
    const gx = cx + Math.cos(a) * radius;
    const gy = cy + Math.sin(a) * radius;

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(gx, gy);
    ctx.stroke();

    const col = neonCols[i % neonCols.length];
    const lightGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 13 * u);
    lightGlow.addColorStop(0, col);
    lightGlow.addColorStop(0.45, col + '99');
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(gx - 13 * u, gy - 13 * u, 26 * u, 26 * u);

    // กระเช้าห้อยตั้งตรง
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(gx - 7.5 * u, gy + 3 * u, 15 * u, 12 * u, 3 * u);
    ctx.fill();
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(gx - 4.5 * u, gy + 5.5 * u, 9 * u, 4.5 * u);
  }

  // ดุมล้อไฟทองตรงกลาง
  const hubGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 * u);
  hubGlow.addColorStop(0, '#ffffff');
  hubGlow.addColorStop(0.5, '#ffd700');
  hubGlow.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = hubGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 16 * u, 0, TAU);
  ctx.fill();

  ctx.restore();
}

/** วาดชาวบ้าน NPC เดินเที่ยวงานวัดบนลานวัด (มีขาและเงาพื้น ไม่ลอย) */
function drawMiniPerson(ctx, x, groundY, scale, topCol, botCol, walkPhase, u) {
  const s = scale * u;
  const swing = Math.sin(walkPhase) * 3.5 * s;

  // เงาที่พื้น
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 1 * s, 9 * s, 3 * s, 0, 0, TAU);
  ctx.fill();

  // ขา 2 ข้าง
  ctx.strokeStyle = botCol;
  ctx.lineWidth = 4.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, groundY - 14 * s);
  ctx.lineTo(x - 3 * s + swing, groundY);
  ctx.moveTo(x + 3 * s, groundY - 14 * s);
  ctx.lineTo(x + 3 * s - swing, groundY);
  ctx.stroke();

  // ลำตัว
  ctx.fillStyle = topCol;
  ctx.beginPath();
  ctx.roundRect(x - 6.5 * s, groundY - 30 * s, 13 * s, 17 * s, 4 * s);
  ctx.fill();

  // ศีรษะ + ทรงผม
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, groundY - 36 * s, 5.5 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#221a24';
  ctx.beginPath();
  ctx.arc(x, groundY - 37.5 * s, 5.6 * s, Math.PI, 0);
  ctx.fill();
}

export function drawTempleFairNPCs(ctx, L, t) {
  const u = L.unit;
  const portrait = L.mode === 'portrait';
  const pathY = L.deckTop - (portrait ? 52 : 46) * u;

  // คู่รักเดินชมงานวัดบริเวณหน้ามณฑป
  const walk1X = L.W * 0.23 + Math.sin(t * 0.45) * 32 * u;
  drawMiniPerson(ctx, walk1X, pathY, 0.95, '#f06292', '#4a154b', t * 4, u);
  drawMiniPerson(ctx, walk1X + 16 * u, pathY + 2 * u, 1.0, '#42a5f5', '#1a237e', t * 4 + 1, u);

  // ชาวบ้านเดินชมซุ้มร้านกระทง
  const walk2X = L.W * 0.67 + Math.cos(t * 0.38) * 24 * u;
  drawMiniPerson(ctx, walk2X, pathY - 2 * u, 0.92, '#ffca28', '#3e2723', t * 3.5, u);

  // เด็กน้อยถือลูกโป่งสวรรค์ข้างร้านขายกระทง
  const childX = L.W * 0.82;
  drawMiniPerson(ctx, childX, pathY + 1 * u, 0.76, '#66bb6a', '#1b5e20', 0, u);

  const balloonY = pathY - 52 * u + Math.sin(t * 2.2) * 3.5 * u;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  ctx.moveTo(childX + 4 * u, pathY - 18 * u);
  ctx.lineTo(childX + 8 * u, balloonY);
  ctx.stroke();

  ctx.fillStyle = '#ff5252';
  ctx.beginPath();
  ctx.arc(childX + 8 * u, balloonY, 7.5 * u, 0, TAU);
  ctx.fill();
}

/** วาดพระอุโบสถซ้อนหลังคาศิลปะไทย (ฉากหลังระยะไกล) */
function ubosot(ctx, x, baseY, h, u) {
  const w = h * 1.18;
  ctx.fillStyle = '#141132';
  ctx.fillRect(x - w * 0.36, baseY - h * 0.34, w * 0.72, h * 0.34);

  const roof = (cx, y, rw, rh, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(cx - rw / 2, y);
    ctx.lineTo(cx - rw * 0.34, y - rh * 0.75);
    ctx.lineTo(cx - rw * 0.46, y - rh * 0.92);
    ctx.lineTo(cx, y - rh);
    ctx.lineTo(cx + rw * 0.46, y - rh * 0.92);
    ctx.lineTo(cx + rw * 0.34, y - rh * 0.75);
    ctx.lineTo(cx + rw / 2, y);
    ctx.closePath();
    ctx.fill();
  };
  roof(x, baseY - h * 0.3, w, h * 0.42, '#3a1530');
  roof(x, baseY - h * 0.52, w * 0.74, h * 0.38, '#5b1f33');
  roof(x, baseY - h * 0.7, w * 0.5, h * 0.3, '#7a2a36');
  ctx.strokeStyle = '#e9b655';
  ctx.lineWidth = 2.5 * u;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY - h * 0.3);
  ctx.lineTo(x + w / 2, baseY - h * 0.3);
  ctx.stroke();

  // ช่อฟ้า
  ctx.fillStyle = '#e9b655';
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.lineTo(x - 4 * u, baseY - h * 1.07);
  ctx.lineTo(x + 3 * u, baseY - h * 1.13);
  ctx.fill();

  // หน้าต่างเรืองแสง
  for (let i = -2; i <= 2; i++) {
    const wx = x + i * w * 0.13;
    const g = ctx.createLinearGradient(0, baseY - h * 0.28, 0, baseY - h * 0.06);
    g.addColorStop(0, '#ffd27a');
    g.addColorStop(1, '#d8863a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(wx - 7 * u, baseY - h * 0.27, 14 * u, h * 0.19, [7 * u, 7 * u, 2, 2]);
    ctx.fill();
  }
}

function palm(ctx, x, baseY, h, lean, u) {
  ctx.strokeStyle = '#090c22';
  ctx.lineWidth = 8 * u;
  ctx.lineCap = 'round';
  const tx = x + lean;
  const ty = baseY - h;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.2, baseY - h * 0.6, tx, ty);
  ctx.stroke();
  ctx.lineWidth = 3.5 * u;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI + Math.PI;
    const len = h * 0.32;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.2 - len * 0.35, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.3 + len * 0.28);
    ctx.stroke();
  }
}

function stringLights(ctx, x1, x2, y, sag, u, rnd) {
  ctx.strokeStyle = 'rgba(20,16,40,.85)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) / 2, y + sag * 2, x2, y);
  ctx.stroke();
  const n = Math.round((x2 - x1) / (42 * u));
  const cols = ['#ff2e93', '#00e5ff', '#ffea00', '#00e676', '#ff9900', '#ffd27a'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const px = x1 + (x2 - x1) * t;
    const py = y + sag * 4 * t * (1 - t);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 13 * u);
    const c = cols[Math.floor(rnd() * cols.length)];
    g.addColorStop(0, c);
    g.addColorStop(0.3, c + '99');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - 14 * u, py - 14 * u, 28 * u, 28 * u);
  }
}

/**
 * สร้างฉากหลังแยกเป็นเลเยอร์ความลึก (Depth Layers) เพื่อให้โมเดลพระ 3D และชิงช้าสวรรค์
 * อยู่ด้านหลังพื้นสนามหญ้า ต้นไม้ ซุ้มงานวัด และเสาไฟท่าน้ำอย่างสมจริง ไม่ลอยทับวัตถุด้านหน้า
 */
export function createBackdrop(L) {
  const { W, H, unit: u } = L;
  const [canvas, ctx] = offscreen(W, H); // เลเยอร์หลังสุด (ท้องฟ้า ดวงจันทร์ เนินเขา พระอุโบสถ)
  const [modelsCanvas] = offscreen(W, H); // เลเยอร์สำหรับเรนเดอร์โมเดล 3D พระเจดีย์และมณฑปพระ
  const [midCanvas, midCtx] = offscreen(W, H); // เลเยอร์กลาง (พื้นสนามหญ้าวัด ศาลาพระสงฆ์ ร้านขายกระทง)
  const [pierCanvas, pierCtx] = offscreen(W, H); // เลเยอร์หน้า (สายไฟ ราวสะพาน เสาโคมไฟ พื้นสะพานไม้ น้ำ)

  const rnd = seeded(20261125);
  const portrait = L.mode === 'portrait';

  // === 1. เลเยอร์หลังสุด: ท้องฟ้า ดาว เมฆ พระจันทร์ เนินเขาไกล ===
  const sky = ctx.createLinearGradient(0, 0, 0, L.deckTop);
  sky.addColorStop(0, '#04061a');
  sky.addColorStop(0.45, '#120f38');
  sky.addColorStop(0.75, '#2b1b4d');
  sky.addColorStop(1, '#5c2d58');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, L.deckTop);

  const stars = [];
  for (let i = 0; i < 160; i++) {
    const s = { x: rnd() * W, y: rnd() * L.landTop * 0.95, r: (0.5 + rnd() * 1.3) * u, p: rnd() * TAU, tw: rnd() < 0.25 };
    if (s.tw) stars.push(s);
    else {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  // พระจันทร์เต็มดวง
  const m = L.moon;
  let g = ctx.createRadialGradient(m.x, m.y, m.r * 0.6, m.x, m.y, m.r * 4.2);
  g.addColorStop(0, 'rgba(255,240,190,0.38)');
  g.addColorStop(0.4, 'rgba(255,220,150,0.10)');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(m.x - m.r * 4.5, m.y - m.r * 4.5, m.r * 9, m.r * 9);
  g = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.1, m.x, m.y, m.r);
  g.addColorStop(0, '#fffdf0');
  g.addColorStop(1, '#f1dca0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.r, 0, TAU);
  ctx.fill();

  // ทิวเขาระยะไกล
  const hills = ctx.createLinearGradient(0, L.landTop - 60 * u, 0, L.landTop + 80 * u);
  hills.addColorStop(0, '#19163f');
  hills.addColorStop(1, '#0c0d24');
  ctx.fillStyle = hills;
  ctx.beginPath();
  ctx.moveTo(0, L.deckTop);
  ctx.lineTo(0, L.landTop + 20 * u);
  for (let x = 0; x <= W; x += 24) {
    ctx.lineTo(x, L.landTop - 20 * u + Math.sin(x * 0.006) * 26 * u + Math.sin(x * 0.017 + 1) * 10 * u);
  }
  ctx.lineTo(W, L.deckTop);
  ctx.fill();

  const baseY = L.landTop + (portrait ? 265 : 225) * u;

  // แสงรัศมีสีทองอ่อนๆ ด้านหลังโซนพุทธาวาส (ฝั่งซ้าย)
  const templeX = W * (portrait ? 0.23 : 0.21);
  const aura = ctx.createRadialGradient(templeX, baseY - 120 * u, 15 * u, templeX, baseY - 120 * u, 230 * u);
  aura.addColorStop(0, 'rgba(255,220,120,0.38)');
  aura.addColorStop(0.5, 'rgba(255,180,60,0.12)');
  aura.addColorStop(1, 'rgba(255,140,20,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(templeX, baseY - 120 * u, 230 * u, 0, TAU);
  ctx.fill();

  // ต้นมะพร้าวระยะไกล
  [[0.04, 240, 28], [0.43, 200, -18], [0.97, 250, -35]].forEach(([r, h, lean]) =>
    palm(ctx, W * r, baseY + 25 * u, h * u, lean * u, u)
  );

  // พระอุโบสถระยะไกล (โซนกลาง-ขวา)
  const ubosotX = W * (portrait ? 0.61 : 0.56);
  ubosot(ctx, ubosotX, baseY + 12 * u, (portrait ? 205 : 210) * u, u);

  // === 2. เลเยอร์กลาง (midCanvas): พื้นสนามหญ้าวัด (บังโคนฐานตึกให้ตั้งอยู่บนดินจริง) + ศาลาพระสงฆ์ + ร้านกระทง ===
  const landTopY = baseY + 8 * u;
  const land = midCtx.createLinearGradient(0, landTopY, 0, L.deckTop);
  land.addColorStop(0, '#0d152c');
  land.addColorStop(0.45, '#131f38');
  land.addColorStop(1, '#182642');
  midCtx.fillStyle = land;
  midCtx.fillRect(0, landTopY, W, L.deckTop - landTopY);

  // เส้นขอบเนินสนามหญ้านุ่มๆ
  const grassEdge = midCtx.createLinearGradient(0, landTopY - 8 * u, 0, landTopY + 10 * u);
  grassEdge.addColorStop(0, 'rgba(13,21,44,0)');
  grassEdge.addColorStop(0.5, 'rgba(18,30,56,0.85)');
  grassEdge.addColorStop(1, '#0d152c');
  midCtx.fillStyle = grassEdge;
  midCtx.fillRect(0, landTopY - 8 * u, W, 18 * u);

  // ทางเดินหินในงานวัด
  midCtx.fillStyle = 'rgba(255,220,160,0.06)';
  midCtx.fillRect(0, L.deckTop - 66 * u, W, 24 * u);

  // ศาลาพระสงฆ์ให้พร (ตั้งอยู่บนลานวัด โซนกลาง)
  const monkX = W * (portrait ? 0.47 : 0.42);
  drawMonkPavilion(midCtx, monkX, landTopY + 34 * u, (portrait ? 94 : 90) * u, u);

  // ซุ้มร้านค้าขายกระทง (ตั้งอยู่ฝั่งขวา แยกจากชิงช้าสวรรค์ชัดเจน ไม่ทับกัน)
  const stallX = W * (portrait ? 0.75 : 0.72);
  drawKrathongShop(midCtx, stallX, landTopY + 38 * u, 96 * u, 82 * u, u);

  // === 3. เลเยอร์หน้า (pierCanvas): สายไฟงานวัด + ราวสะพาน + โคมไฟท่าน้ำ + พื้นสะพานไม้ ===
  const ly = landTopY + 14 * u;
  stringLights(pierCtx, -20, W * 0.5, ly - 16 * u, 22 * u, u, rnd);
  stringLights(pierCtx, W * 0.48, W + 20, ly - 8 * u, 24 * u, u, rnd);

  const lamps = [];
  const step = (portrait ? 216 : 240) * u;
  for (let x = step / 2; x < W; x += step) {
    pierCtx.fillStyle = '#1a1220';
    pierCtx.fillRect(x - 5 * u, L.deckTop - 92 * u, 10 * u, 96 * u);
    const gg = pierCtx.createRadialGradient(x, L.deckTop - 100 * u, 0, x, L.deckTop - 100 * u, 70 * u);
    gg.addColorStop(0, 'rgba(255,190,110,0.55)');
    gg.addColorStop(1, 'rgba(255,190,110,0)');
    pierCtx.fillStyle = gg;
    pierCtx.fillRect(x - 70 * u, L.deckTop - 170 * u, 140 * u, 140 * u);
    pierCtx.fillStyle = '#ffb066';
    pierCtx.beginPath();
    pierCtx.roundRect(x - 13 * u, L.deckTop - 118 * u, 26 * u, 34 * u, 10 * u);
    pierCtx.fill();
    pierCtx.fillStyle = '#fff1c4';
    pierCtx.beginPath();
    pierCtx.roundRect(x - 6 * u, L.deckTop - 111 * u, 12 * u, 20 * u, 6 * u);
    pierCtx.fill();
    lamps.push(x);
  }
  pierCtx.strokeStyle = '#2a1a22';
  pierCtx.lineWidth = 6 * u;
  pierCtx.beginPath();
  pierCtx.moveTo(0, L.deckTop - 58 * u);
  pierCtx.lineTo(W, L.deckTop - 58 * u);
  pierCtx.stroke();

  // พื้นสะพานท่าน้ำไม้
  const deck = pierCtx.createLinearGradient(0, L.deckTop, 0, L.deckBottom);
  deck.addColorStop(0, '#6a4a3a');
  deck.addColorStop(0.18, '#4b3329');
  deck.addColorStop(1, '#241518');
  pierCtx.fillStyle = deck;
  pierCtx.fillRect(0, L.deckTop, W, L.deckBottom - L.deckTop);
  pierCtx.strokeStyle = 'rgba(0,0,0,0.45)';
  pierCtx.lineWidth = 2 * u;
  for (let x = 0; x < W; x += 54 * u) {
    pierCtx.beginPath();
    pierCtx.moveTo(x, L.deckTop);
    pierCtx.lineTo(x - 8 * u, L.deckBottom);
    pierCtx.stroke();
  }
  pierCtx.fillStyle = 'rgba(255,210,150,0.35)';
  pierCtx.fillRect(0, L.deckTop, W, 3 * u);
  pierCtx.fillStyle = '#150d12';
  pierCtx.fillRect(0, L.deckBottom - 4 * u, W, 6 * u);

  // พื้นผิวน้ำ
  const water = pierCtx.createLinearGradient(0, L.waterTop, 0, H);
  water.addColorStop(0, '#12385a');
  water.addColorStop(0.35, '#0a2142');
  water.addColorStop(1, '#040b1f');
  pierCtx.fillStyle = water;
  pierCtx.fillRect(0, L.waterTop + 2 * u, W, H - L.waterTop);

  // ตำแหน่งชิงช้าสวรรค์ (อยู่ฉากหลังฝั่งขวาสุด เยื้องหลังจากร้านกระทง ไม่ทับกัน)
  const wheelX = W * (portrait ? 0.90 : 0.88);
  const wheelR = (portrait ? 74 : 72) * u;
  const wheelY = landTopY - wheelR * 1.12;

  return {
    canvas,
    modelsCanvas,
    midCanvas,
    pierCanvas,
    baseY: landTopY,
    stars,
    lamps,
    wheel: { x: wheelX, y: wheelY, r: wheelR },
  };
}

export function drawStars(ctx, stars, t) {
  for (const s of stars) {
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + s.p));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 1.2, 0, TAU);
    ctx.fill();
  }
}
