import { $, toast } from './dom.js';
import { api } from './api.js';

const run = async (label, fn) => {
  try {
    await fn();
    toast(label);
  } catch (e) {
    toast(e.message, true);
  }
};

/** แผงควบคุม: สลับโหมด, ทดสอบของขวัญ, สั่งหน้าเกม */
export function mountControls(getState) {
  const root = $('#controls');
  root.innerHTML = `
    <div class="field">
      <label>โหมดการทำงาน</label>
      <div class="seg" id="modeSeg">
        <button data-mode="demo">เดโม</button>
        <button data-mode="live">ไลฟ์จริง</button>
      </div>
    </div>
    <div class="field" id="usernameField">
      <label for="username">TikTok username (โหมดไลฟ์จริง)</label>
      <div class="row"><input id="username" placeholder="เช่น mychannel" autocomplete="off" /><button class="btn" id="applyLive">เชื่อมต่อ</button></div>
    </div>
    <div class="field" id="demoTools">
      <label>เครื่องมือทดสอบ (โหมดเดโม)</label>
      <div class="row wrap">
        <button class="btn ghost" data-test="chat" data-gender="male">คอมเมนต์ “ชาย”</button>
        <button class="btn ghost" data-test="chat" data-gender="female">คอมเมนต์ “หญิง”</button>
      </div>
      <div class="row wrap" id="giftBtns"></div>
      <div class="row"><label class="switch"><input type="checkbox" id="autoplay" /><span></span>สร้างผู้ชมจำลองอัตโนมัติ</label></div>
    </div>
    <div class="field">
      <label>หน้าเกม</label>
      <div class="row wrap">
        <button class="btn ghost" id="clearGame">ล้างคิวและฉาก</button>
        <button class="btn ghost" id="reloadGame">รีโหลดทุกจอ</button>
        <button class="btn ghost" id="reloadCfg">โหลด config ใหม่</button>
      </div>
    </div>`;

  root.querySelector('#modeSeg').onclick = (e) => {
    const mode = e.target.dataset.mode;
    if (!mode) return;
    if (mode === 'live' && !$('#username').value.trim() && !getState()?.source.username) return toast('กรอก TikTok username ก่อน', true);
    run(`สลับเป็นโหมด ${mode}`, () => api('/mode', { method: 'POST', body: { mode, username: $('#username').value.trim() || undefined } }));
  };
  $('#applyLive').onclick = () => run('กำลังเชื่อมต่อ…', () => api('/mode', { method: 'POST', body: { mode: 'live', username: $('#username').value.trim() } }));

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-test]');
    if (t) run('ส่งข้อมูลทดสอบแล้ว', () => api('/test', { method: 'POST', body: { kind: t.dataset.test, gender: t.dataset.gender, diamonds: Number(t.dataset.diamonds), user: 'ผู้ทดสอบ', giftName: t.dataset.gift } }));
  });
  $('#autoplay').onchange = (e) => run('อัปเดตแล้ว', () => api('/demo/autoplay', { method: 'POST', body: { on: e.target.checked } }));
  $('#clearGame').onclick = () => run('ล้างหน้าเกมแล้ว', () => api('/game/clear', { method: 'POST' }));
  $('#reloadGame').onclick = () => run('สั่งรีโหลดแล้ว', () => api('/game/reload', { method: 'POST' }));
  $('#reloadCfg').onclick = () => run('โหลด config แล้ว', () => api('/config/reload', { method: 'POST' }));

  return {
    /** ปุ่มของขวัญทดสอบสร้างจากระดับกระทงใน config */
    setTiers(tiers) {
      $('#giftBtns').innerHTML = tiers
        .filter((t) => t.level > 0)
        .map((t) => `<button class="btn ghost" data-test="gift" data-diamonds="${Math.max(1, t.minDiamonds)}" data-gift="Test ${t.level}">ของขวัญ ${t.minDiamonds}💎 → ${t.name}</button>`)
        .join('');
    },
    sync(s) {
      document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === s.source.mode));
      const demo = s.source.mode === 'demo';
      $('#demoTools').classList.toggle('disabled', !demo);
      if (document.activeElement !== $('#username') && !$('#username').value) $('#username').value = s.source.username || '';
      if (document.activeElement !== $('#autoplay')) $('#autoplay').checked = !!s.source.autoplay;
    },
  };
}

