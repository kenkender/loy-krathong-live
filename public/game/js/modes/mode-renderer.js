import { TAU, rand } from '../core/util.js';

const BLESSING_WISHES = [
  'สาธุ ขอให้ร่ำรวยสมปรารถนา',
  'เจริญรุ่งเรือง สุขภาพแข็งแรง',
  'โชคลาภหลั่งไหล มั่งมีศรีสุข',
  'บุญรักษา พระคุ้มครอง',
  'สมหวังทุกประการเทอญ',
];

const TIER_GLOW = ['#ffd97d', '#ff9ecd', '#7df9ff', '#ffcf40', '#ffffff'];

/**
 * จัดการการวาดฉากเฉพาะโหมด (ไหว้พระขอพร / ปาร์ตี้แดนซ์ฟลอร์)
 * และเอฟเฟกต์วัตถุลอยตามโหมด (ดวงแก้วคำอธิษฐาน / เอฟเฟกต์ปาร์ตี้)
 */
export class ModeStageRenderer {
  constructor(L) {
    this.L = L;
    this.blessingOrbs = [];
    this.partyBeats = [];
  }

  /** เรียกเมื่อตัวละครทำกิจกรรมเสร็จ (ปล่อยกระทง / อธิษฐานเสร็จ / เต้นไฮไลท์) */
  spawnModeEffect(mode, ch) {
    const u = this.L.unit;
    const tier = Math.min(4, Math.max(0, ch.job?.tier || 0));

    if (mode === 'temple-blessing') {
      const wish = BLESSING_WISHES[Math.floor(Math.random() * BLESSING_WISHES.length)];
      this.blessingOrbs.push({
        x: ch.x,
        y: ch.y - 95 * u,
        vx: rand(-12, 12) * u,
        vy: -rand(38, 56) * u,
        r: (22 + tier * 6) * u,
        tier,
        user: ch.job?.user?.name || 'ผู้มีจิตศรัทธา',
        wish,
        age: 0,
        maxAge: 9.5,
      });
    } else if (mode === 'party-dance') {
      for (let i = 0; i < 8 + tier * 4; i++) {
        this.partyBeats.push({
          x: ch.x + rand(-40, 40) * u,
          y: ch.y - rand(60, 180) * u,
          vx: rand(-70, 70) * u,
          vy: -rand(60, 150) * u,
          size: rand(6, 14) * u,
          color: ['#38bdf8', '#f472b6', '#facc15', '#4ade80', '#c084fc'][i % 5],
          age: 0,
          maxAge: rand(1.4, 2.6),
        });
      }
    }
  }

  update(dt) {
    for (const o of this.blessingOrbs) {
      o.age += dt;
      o.x += o.vx * dt + Math.sin(o.age * 2.2) * 0.35;
      o.y += o.vy * dt;
    }
    this.blessingOrbs = this.blessingOrbs.filter((o) => o.age < o.maxAge);

    for (const p of this.partyBeats) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
    }
    this.partyBeats = this.partyBeats.filter((p) => p.age < p.maxAge);
  }

  /** วาดพื้นลานวัดหินอ่อนและพรมแดงมงคลสำหรับโหมดไหว้พระขอพร */
  drawTempleCourtyard(ctx, t) {
    const { W, H, unit: u, deckTop, waterTop } = this.L;
    const floorTop = deckTop;
    const floorH = H - floorTop;

    ctx.save();
    // 1. พื้นลานศิลาแลงและหินอ่อนวัดสีอบอุ่น
    const grad = ctx.createLinearGradient(0, floorTop, 0, H);
    grad.addColorStop(0, '#2c1d18');
    grad.addColorStop(0.15, '#3b241d');
    grad.addColorStop(0.55, '#241411');
    grad.addColorStop(1, '#120a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorTop, W, floorH);

    // ลายตารางแผ่นหินอ่อน Perspective
    ctx.strokeStyle = 'rgba(255, 215, 130, 0.11)';
    ctx.lineWidth = 1.5 * u;
    for (let row = 0; row < 8; row++) {
      const ry = floorTop + Math.pow(row / 7, 1.35) * floorH;
      ctx.beginPath();
      ctx.moveTo(0, ry);
      ctx.lineTo(W, ry);
      ctx.stroke();
    }
    const cols = 10;
    for (let i = -2; i <= cols + 2; i++) {
      const topX = (W / cols) * i;
      const botX = W * 0.5 + (topX - W * 0.5) * 1.85;
      ctx.beginPath();
      ctx.moveTo(topX, floorTop);
      ctx.lineTo(botX, H);
      ctx.stroke();
    }

    // 2. พรมแดงมงคลขลิบทองสำหรับจุดนั่งกราบพระ
    const carpetTop = deckTop - 8 * u;
    const carpetH = 92 * u;
    const carpetGrad = ctx.createLinearGradient(0, carpetTop, 0, carpetTop + carpetH);
    carpetGrad.addColorStop(0, '#7f1d1d');
    carpetGrad.addColorStop(0.5, '#991b1b');
    carpetGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = carpetGrad;
    ctx.fillRect(0, carpetTop, W, carpetH);

    ctx.strokeStyle = '#f5c451';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(0, carpetTop + 3 * u);
    ctx.lineTo(W, carpetTop + 3 * u);
    ctx.moveTo(0, carpetTop + carpetH - 3 * u);
    ctx.lineTo(W, carpetTop + carpetH - 3 * u);
    ctx.stroke();

    // 3. โต๊ะหมู่บูชา / กระถางธูปทองคำ และพานพุ่มหน้าจุดไหว้ทั้ง 5 จุด
    const altarY = waterTop + 58 * u;
    const cushionY = altarY + 44 * u; // จุดเบาะรองกราบไหว้อยู่ก่อนถึงพานทองวางเทียน

    for (let i = 0; i < this.L.slots.length; i++) {
      const sx = this.L.slots[i];
      // แสงเทียนมงคลเรืองรอง
      const glowR = (54 + Math.sin(t * 4 + i) * 5) * u;
      const g = ctx.createRadialGradient(sx, altarY, 2 * u, sx, altarY, glowR);
      g.addColorStop(0, 'rgba(255, 215, 100, 0.42)');
      g.addColorStop(1, 'rgba(255, 180, 50, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, altarY, glowR, 0, TAU);
      ctx.fill();

      // พานทองวางเทียน/เครื่องบูชา
      ctx.fillStyle = '#d99b26';
      ctx.beginPath();
      ctx.ellipse(sx, altarY + 8 * u, 28 * u, 9 * u, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fde08d';
      ctx.beginPath();
      ctx.ellipse(sx, altarY + 4 * u, 22 * u, 6 * u, 0, 0, TAU);
      ctx.fill();

      // เบาะอาสนะรองกราบไหว้พระ (Velvet Prayer Cushion with Gold Trim)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(sx, cushionY + 4 * u, 24 * u, 7 * u, 0, 0, TAU);
      ctx.fill();

      const cushionGrad = ctx.createLinearGradient(sx - 20 * u, cushionY, sx + 20 * u, cushionY);
      cushionGrad.addColorStop(0, '#991b1b');
      cushionGrad.addColorStop(0.3, '#dc2626');
      cushionGrad.addColorStop(0.7, '#ef4444');
      cushionGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = cushionGrad;
      ctx.beginPath();
      ctx.ellipse(sx, cushionY, 22 * u, 7 * u, 0, 0, TAU);
      ctx.fill();

      // ขอบดิ้นทองอาสนะ
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.4 * u;
      ctx.stroke();

      // เทียนคู่ซ้าย-ขวา
      for (const side of [-1, 1]) {
        const cx = sx + side * 34 * u;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 2.5 * u, altarY - 14 * u, 5 * u, 18 * u);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, altarY - 17 * u + Math.sin(t * 8 + i) * 1.2 * u, 3.8 * u, 0, TAU);
        ctx.fill();
      }
    }

    // 4. เส้นทางเดินขบวนบุญสีทองมงคล 5 สายสู่จุดไหว้ (Sacred Procession Guide Paths)
    const isPortrait = this.L.mode === 'portrait';
    const baseStart = isPortrait ? 76 * u : 44 * u;
    const laneSpacing = isPortrait ? 86 * u : 46 * u;

    for (let i = 0; i < this.L.slots.length; i++) {
      const sx = this.L.slots[i];
      const laneY = cushionY + baseStart + i * laneSpacing;

      // ก. รอยเรืองแสงทองจางๆ ตามแนวเส้นเดิน
      ctx.strokeStyle = 'rgba(255, 215, 120, 0.16)';
      ctx.lineWidth = 6 * u;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, laneY);
      ctx.lineTo(sx, laneY);
      ctx.lineTo(sx, cushionY);
      ctx.stroke();

      // ข. เส้นทองสลักพื้นหินอ่อนคมชัด
      ctx.strokeStyle = 'rgba(255, 225, 140, 0.42)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(0, laneY);
      ctx.lineTo(sx, laneY);
      ctx.lineTo(sx, cushionY);
      ctx.stroke();

      // ค. แสงประกายทองวิ่งนำทาง (Animated Holy Light Dashes)
      ctx.save();
      ctx.setLineDash([14 * u, 28 * u]);
      ctx.lineDashOffset = -t * 42 * u;
      ctx.strokeStyle = 'rgba(255, 255, 220, 0.68)';
      ctx.lineWidth = 2.4 * u;
      ctx.beginPath();
      ctx.moveTo(0, laneY);
      ctx.lineTo(sx, laneY);
      ctx.lineTo(sx, cushionY);
      ctx.stroke();
      ctx.restore();

      // ง. หมุดทองมงคล ณ จุดหักเลี้ยว 90 องศา (Corner Lotus Pivot)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sx, laneY, 5 * u, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, laneY, 2.5 * u, 0, TAU);
      ctx.fill();

      // จ. ลูกศรสีทองชี้ทิศทางเลี้ยวขึ้นสู่จุดไหว้ (Directional Arrow)
      ctx.strokeStyle = 'rgba(255, 240, 150, 0.75)';
      ctx.lineWidth = 2.2 * u;
      ctx.beginPath();
      ctx.moveTo(sx - 4.5 * u, laneY - 14 * u);
      ctx.lineTo(sx, laneY - 19 * u);
      ctx.lineTo(sx + 4.5 * u, laneY - 14 * u);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** วาดเวทีคอนเสิร์ตและฟลอร์เต้น LED สำหรับโหมดปาร์ตี้ */
  drawPartyStage(ctx, t, danceSpeed = 1) {
    const { W, H, unit: u, deckTop } = this.L;
    const floorTop = deckTop - 12 * u;
    const floorH = H - floorTop;
    const beat = t * 4.2 * danceSpeed;

    ctx.save();
    // 1. พื้นเวทีคอนเสิร์ตสีเข้มสะท้อนแสงนีออน
    const bg = ctx.createLinearGradient(0, floorTop, 0, H);
    bg.addColorStop(0, '#090817');
    bg.addColorStop(0.35, '#120d2b');
    bg.addColorStop(1, '#04030a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, floorTop, W, floorH);

    // 2. ลำแสงสปอตไลท์คอนเสิร์ตจากด้านบนกวาดซ้าย-ขวา
    const beamColors = [
      'rgba(56, 189, 248, 0.16)',
      'rgba(244, 114, 182, 0.16)',
      'rgba(168, 85, 247, 0.16)',
      'rgba(52, 211, 153, 0.14)',
    ];
    for (let i = 0; i < 4; i++) {
      const bx = W * (0.15 + i * 0.23);
      const swing = Math.sin(beat * 0.45 + i * 1.4) * 190 * u;
      ctx.fillStyle = beamColors[i % beamColors.length];
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + swing - 130 * u, floorTop + 140 * u);
      ctx.lineTo(bx + swing + 130 * u, floorTop + 140 * u);
      ctx.closePath();
      ctx.fill();
    }

    // 3. ตาราง LED Dance Floor เรืองแสงตามจังหวะเพลง
    const rows = 6;
    const cols = 9;
    const palette = ['#38bdf8', '#ec4899', '#a855f7', '#eab308', '#10b981'];
    for (let r = 0; r < rows; r++) {
      const y1 = floorTop + (r / rows) * floorH * 0.72;
      const y2 = floorTop + ((r + 1) / rows) * floorH * 0.72;
      for (let c = 0; c < cols; c++) {
        const x1 = (c / cols) * W;
        const x2 = ((c + 1) / cols) * W;
        const wave = Math.sin(beat + r * 0.9 + c * 0.7);
        const col = palette[(r + c + Math.floor(beat * 0.5)) % palette.length];
        ctx.fillStyle = col;
        ctx.globalAlpha = wave > 0.2 ? 0.24 + wave * 0.18 : 0.05;
        ctx.fillRect(x1 + 3 * u, y1 + 3 * u, x2 - x1 - 6 * u, y2 - y1 - 6 * u);
      }
    }
    ctx.globalAlpha = 1;

    // 4. วงแหวนนีออนประจำจุดยืนเต้นทั้ง 5 ตำแหน่ง
    for (let i = 0; i < this.L.slots.length; i++) {
      const sx = this.L.slots[i];
      const sy = this.L.walkY + 4 * u;
      const pulse = 1 + Math.sin(beat * 1.5 + i) * 0.12;
      const ringCol = palette[i % palette.length];

      ctx.strokeStyle = ringCol;
      ctx.lineWidth = 3.5 * u;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 48 * u * pulse, 14 * u * pulse, 0, 0, TAU);
      ctx.stroke();
    }

    // 5. แถบคลื่นเสียง Equalizer ด้านล่างจอ
    const bars = 44;
    const barW = W / bars;
    for (let i = 0; i < bars; i++) {
      const amp = Math.abs(Math.sin(beat * 1.3 + i * 0.45) * Math.cos(beat * 0.7 - i * 0.2));
      const bh = (18 + amp * 95) * u;
      ctx.fillStyle = palette[i % palette.length];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(i * barW + 2 * u, H - bh, barW - 4 * u, bh);
    }
    ctx.restore();
  }

  /** วาดของที่ถืออยู่ในมือตามโหมด (ถ้วยเทียนแกะสลักทองคำมงคล / แท่งไฟปาร์ตี้) */
  drawModeHeldItem(ctx, ch, mode, t) {
    const u = this.L.unit;
    const hp = ch.handPos;

    if (mode === 'temple-blessing') {
      // ตัวละครถือถ้วยเทียนตั้งแต่เดินเข้า (WALK_IN) ตลอดจนคุกเข่า (BOW) และไหว้ขอพร (PRAY)
      // วางถ้วยเทียนลงที่โต๊ะหมู่บูชาตอนยืนขึ้นเดินออก (WALK_OUT)
      if (ch.state === 3) return;
      ctx.save();
      ctx.translate(hp.x, hp.y);

      // 1. ออร่าแสงเทียนมงคลเรืองรองรอบถ้วยเทียน (Sacred Warm Candlelight Aura)
      const pulse = 1 + Math.sin(t * 7 + (ch.slot || 0)) * 0.08;
      const auraR = 34 * u * pulse;
      const aura = ctx.createRadialGradient(0, -10 * u, 2 * u, 0, -10 * u, auraR);
      aura.addColorStop(0, 'rgba(255, 225, 110, 0.48)');
      aura.addColorStop(0.42, 'rgba(255, 175, 45, 0.22)');
      aura.addColorStop(1, 'rgba(255, 140, 20, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -10 * u, auraR, 0, TAU);
      ctx.fill();

      // 2. ฐานบัวทองเหลืองหล่อ (Golden Brass Lotus Pedestal Base)
      const baseGrad = ctx.createLinearGradient(-13 * u, 0, 13 * u, 0);
      baseGrad.addColorStop(0, '#92400e');
      baseGrad.addColorStop(0.35, '#f59e0b');
      baseGrad.addColorStop(0.65, '#fef08a');
      baseGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(0, 9 * u, 13 * u, 4 * u, 0, 0, TAU);
      ctx.fill();

      // ก้านคอดถ้วยเทียน
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3.5 * u, 3.5 * u, 7 * u, 5.5 * u);

      // 3. ตัวถ้วยประทีปทรงดอกบัวแกะสลักทองคำ (Carved Golden Lotus Bowl)
      const cupGrad = ctx.createLinearGradient(-16 * u, -4 * u, 16 * u, 8 * u);
      cupGrad.addColorStop(0, '#92400e');
      cupGrad.addColorStop(0.25, '#fbbf24');
      cupGrad.addColorStop(0.5, '#fef08a');
      cupGrad.addColorStop(0.85, '#d97706');
      cupGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = cupGrad;
      ctx.beginPath();
      ctx.moveTo(-15 * u, -2 * u);
      ctx.quadraticCurveTo(-17 * u, 5 * u, -5 * u, 6 * u);
      ctx.lineTo(5 * u, 6 * u);
      ctx.quadraticCurveTo(17 * u, 5 * u, 15 * u, -2 * u);
      ctx.closePath();
      ctx.fill();

      // ลายกลีบดอกบัวทองนูนรอบถ้วย
      ctx.strokeStyle = 'rgba(255, 255, 210, 0.65)';
      ctx.lineWidth = 1.2 * u;
      for (let p = -2; p <= 2; p++) {
        ctx.beginPath();
        ctx.moveTo(p * 5 * u, 5 * u);
        ctx.quadraticCurveTo(p * 6.5 * u, 1 * u, p * 5.5 * u, -2 * u);
        ctx.stroke();
      }

      // ขอบปากถ้วยประทีปสีทองประกาย
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, -2 * u, 15 * u, 4.5 * u, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1 * u;
      ctx.stroke();

      // 4. เนื้อเทียนไขมงคลสีงาช้าง (Ivory Candle Wax)
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.ellipse(0, -2 * u, 12 * u, 3.4 * u, 0, 0, TAU);
      ctx.fill();

      // ไส้เทียน
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.4 * u;
      ctx.beginPath();
      ctx.moveTo(0, -2 * u);
      ctx.lineTo(0, -5.5 * u);
      ctx.stroke();

      // 5. เปลวประทีปทองคำริ้วแสงพริ้วไหว 2 ชั้น (Flickering Dual Sacred Flame)
      const flkX = Math.sin(t * 13 + (ch.slot || 0) * 1.5) * 1.3 * u;
      const flkH = (14 + Math.cos(t * 17 + (ch.slot || 0)) * 2) * u;
      const flameBaseY = -5 * u;
      const flameTipY = flameBaseY - flkH;

      // เปลวด้านนอกสีทองอำพัน
      const flameGrad = ctx.createLinearGradient(0, flameBaseY, flkX, flameTipY);
      flameGrad.addColorStop(0, '#ea580c');
      flameGrad.addColorStop(0.35, '#f59e0b');
      flameGrad.addColorStop(0.75, '#fde047');
      flameGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, flameBaseY);
      ctx.quadraticCurveTo(-6 * u, flameBaseY - flkH * 0.45, flkX, flameTipY);
      ctx.quadraticCurveTo(6 * u, flameBaseY - flkH * 0.45, 4.5 * u, flameBaseY);
      ctx.closePath();
      ctx.fill();

      // เปลวแกนกลางสีขาวบริสุทธิ์
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-2 * u, flameBaseY);
      ctx.quadraticCurveTo(-2.5 * u, flameBaseY - flkH * 0.35, flkX * 0.5, flameBaseY - flkH * 0.72);
      ctx.quadraticCurveTo(2.5 * u, flameBaseY - flkH * 0.35, 2 * u, flameBaseY);
      ctx.closePath();
      ctx.fill();

      // ละอองประทีปมงคลลอยละล่อง
      for (let s = 0; s < 3; s++) {
        const sparkAge = ((t * 2.2 + s * 0.65 + (ch.slot || 0)) % 1);
        const sx = flkX + Math.sin(sparkAge * 8 + s) * 4.5 * u;
        const sy = flameTipY - sparkAge * 17 * u;
        const sa = (1 - sparkAge) * 0.85;
        ctx.fillStyle = `rgba(255, 240, 160, ${sa})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2 * u, 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    } else if (mode === 'party-dance') {
      if (ch.state === 3) return;
      // แท่งไฟคอนเสิร์ตเรืองแสงแกว่งตามมือ
      ctx.save();
      ctx.translate(hp.x, hp.y);
      const col = TIER_GLOW[Math.min(4, ch.job?.tier || 0)];
      const g = ctx.createRadialGradient(0, -8 * u, 2 * u, 0, -8 * u, 26 * u);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -8 * u, 26 * u, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.5 * u;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 8 * u);
      ctx.lineTo(Math.sin(t * 9) * 10 * u, -16 * u);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** วาดดวงแก้วคำอธิษฐานลอยขึ้นฟ้าและพาร์ทิเคิลแดนซ์ด้านหน้าสุด */
  drawOverlayEffects(ctx, mode, t) {
    const u = this.L.unit;

    if (mode === 'temple-blessing') {
      for (const o of this.blessingOrbs) {
        const alpha = Math.min(1, (o.maxAge - o.age) / 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const glow = ctx.createRadialGradient(o.x, o.y, 2 * u, o.x, o.y, o.r * 1.8);
        glow.addColorStop(0, '#fffbeb');
        glow.addColorStop(0.4, TIER_GLOW[o.tier] || '#fde047');
        glow.addColorStop(1, 'rgba(255, 200, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 1.8, 0, TAU);
        ctx.fill();

        // ป้ายคำอธิษฐานมงคลใต้ดวงแก้ว
        ctx.font = `600 ${18 * u}px "Leelawadee UI","Noto Sans Thai",sans-serif`;
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(`🙏 ${o.user}`, o.x, o.y + o.r + 14 * u);
        ctx.font = `500 ${14 * u}px "Leelawadee UI","Noto Sans Thai",sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(o.wish, o.x, o.y + o.r + 32 * u);
        ctx.restore();
      }
    } else if (mode === 'party-dance') {
      for (const p of this.partyBeats) {
        const alpha = Math.max(0, 1 - p.age / p.maxAge);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

