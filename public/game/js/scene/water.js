/** ผิวน้ำเคลื่อนไหว: เส้นคลื่น + เงาพระจันทร์ + เงาโคมไฟ */
export function drawWater(ctx, L, lamps, t) {
  const { W, H, unit: u } = L;
  const top = L.waterTop + 4 * u;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, H - top);
  ctx.clip();

  // เส้นคลื่นเรียงเป็นชั้น ยิ่งใกล้ยิ่งห่างและใหญ่
  ctx.lineWidth = 1.5 * u;
  for (let row = 0, y = top + 14 * u; y < H; row++) {
    const depth = (y - top) / (H - top);
    ctx.strokeStyle = `rgba(150,200,255,${0.05 + depth * 0.07})`;
    ctx.beginPath();
    const amp = (1.5 + depth * 5) * u;
    const len = (60 + depth * 120) * u;
    for (let x = 0; x <= W + 20; x += 20) {
      const yy = y + Math.sin(x / len * 6.28 + t * (0.8 + depth) + row * 1.7) * amp;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
    y += (20 + depth * 34) * u;
  }

  ctx.globalCompositeOperation = 'lighter';

  // เงาพระจันทร์เป็นรอยสะท้อนขาด ๆ
  const mx = L.moon.x;
  for (let y = top + 6 * u, i = 0; y < H; i++) {
    const depth = (y - top) / (H - top);
    const w = (40 + depth * 150) * u * (0.6 + 0.4 * Math.sin(t * 1.3 + i));
    const off = Math.sin(t * 0.9 + i * 2.1) * 14 * u * (1 + depth);
    ctx.fillStyle = `rgba(255,232,170,${0.2 * (1 - depth * 0.55)})`;
    ctx.fillRect(mx - w / 2 + off, y, w, (2 + depth * 3) * u);
    y += (13 + depth * 26) * u;
  }

  // เงาโคมไฟบนผืนน้ำ
  for (const x of lamps) {
    for (let k = 0; k < 6; k++) {
      const y = top + (10 + k * 26) * u;
      const w = (18 + k * 8) * u * (0.7 + 0.3 * Math.sin(t * 2 + k + x));
      ctx.fillStyle = `rgba(255,170,90,${0.18 - k * 0.025})`;
      ctx.fillRect(x - w / 2, y, w, 3 * u);
    }
  }
  ctx.restore();
}

