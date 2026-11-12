/** แผงทดสอบในหน้าเกม (เปิดด้วย ?debug=1) ใช้ได้แม้ไม่ผ่านเซิร์ฟเวอร์ */
export function mountDebugPanel(engine, tiers) {
  const box = document.createElement('div');
  box.className = 'debug-panel';
  const row = (label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = fn;
    box.append(b);
  };
  const job = (tier, gender) => ({
    id: crypto.randomUUID(),
    user: { id: 'dbg', name: ['มะลิ', 'ต้นกล้า', 'ใบเตย', 'ตะวัน'][Math.floor(Math.random() * 4)] },
    gender,
    tier,
    simulated: true,
  });
  tiers.forEach((t) => {
    row(`${t.name} (ชาย)`, () => engine.enqueue(job(t.level, 'male')));
    row(`${t.name} (หญิง)`, () => engine.enqueue(job(t.level, 'female')));
  });

  const btn3D = document.createElement('button');
  btn3D.style.background = '#0284c7';
  btn3D.style.fontWeight = 'bold';
  const update3DText = () => {
    btn3D.textContent = engine.char3D.enabled ? '✨ โหมด: 3D (เปิดอยู่)' : '🎨 โหมด: 2D (เปิดอยู่)';
  };
  update3DText();
  btn3D.onclick = () => {
    engine.char3D.enabled = !engine.char3D.enabled;
    update3DText();
  };
  box.append(btn3D);

  row('ล้างฉาก', () => engine.clear());
  const stat = document.createElement('pre');
  box.append(stat);
  setInterval(() => {
    const s = engine.stats();
    stat.textContent = `fps ${s.fps.toFixed(0)} · queue ${s.queue} · active ${s.active}\nfloating ${s.floating} · particles ${s.particles}`;
  }, 500);
  document.body.append(box);
}

