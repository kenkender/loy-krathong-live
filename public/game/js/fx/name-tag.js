const TIER_COLOR = ['#ffffff', '#ffd9e6', '#ffe9b0', '#ffd876', '#fff2b8'];

/** ป้ายชื่อเหนือหัวตัวละคร */
export function drawNameTag(ctx, L, ch) {
  if (ch.state === 3) return; // ไม่แสดงตอนเดินออก
  const u = L.unit;
  const name = ch.job.user.name;
  const y = ch.y - 300 * L.charScale;
  ctx.save();
  ctx.font = `700 ${26 * u}px "Leelawadee UI","Noto Sans Thai",sans-serif`;
  const w = ctx.measureText(name).width + 36 * u;
  const h = 40 * u;
  const x = ch.x;
  ctx.fillStyle = 'rgba(8,10,34,0.68)';
  ctx.strokeStyle = ch.job.tier >= 3 ? 'rgba(255,216,118,0.9)' : 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TIER_COLOR[ch.job.tier] || '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y + 1);
  ctx.restore();
}

