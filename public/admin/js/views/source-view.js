import { $ } from '../dom.js';
import { api } from '../api.js';

export function mountSourceView(root, run, toast, getState, reloadSceneState) {
  root.innerHTML = `
    <div class="detail-grid">
      <!-- TikTok / Demo Connection (Span 6) -->
      <section class="panel span-6">
        <div class="panel-head">
          <h2>แหล่งข้อมูลไลฟ์ (TikTok Live / Demo Mode)</h2>
          <small>STREAM SOURCE</small>
        </div>

        <div class="field">
          <label>โหมดการทำงาน</label>
          <div class="seg" id="modeSeg">
            <button type="button" data-mode="demo">โหมดเดโม (ข้อมูลจำลอง)</button>
            <button type="button" data-mode="live">TikTok Live จริง</button>
          </div>
        </div>

        <div class="field">
          <label>ชื่อผู้ใช้ TikTok (ไม่ต้องใส่ @)</label>
          <div class="row">
            <input id="username" type="text" placeholder="เช่น my_tiktok_channel" />
            <button id="applyLive" class="btn">เชื่อมต่อไลฟ์</button>
          </div>
        </div>

        <h3>คำสั่งจัดการหน้าจอเกม (Screen Commands)</h3>
        <div class="row wrap">
          <button id="clearGame" class="btn ghost">ล้างคิวและฉากทั้งหมด</button>
          <button id="reloadGame" class="btn ghost">สั่งรีโหลดหน้าเกมทุกจอ</button>
          <button id="reloadCfg" class="btn ghost">โหลดไฟล์ Config ใหม่</button>
        </div>
      </section>

      <!-- Demo Simulator Tools (Span 6) -->
      <section class="panel span-6">
        <div class="panel-head">
          <h2>เครื่องมือจำลองเหตุการณ์และของขวัญ (Simulator)</h2>
          <small>DEMO EVENT GENERATOR</small>
        </div>

        <div class="field" id="demoTools">
          <div style="margin-bottom:14px;">
            <label class="switch">
              <input id="autoplay" type="checkbox" />
              <span></span>
              ปล่อยผู้ชมจำลองเข้าฉากอัตโนมัติอย่างต่อเนื่อง (Autoplay)
            </label>
          </div>

          <h3>ทดสอบคอมเมนต์เข้าร่วมฟรี</h3>
          <div class="row wrap" style="margin-bottom:14px;">
            <button class="btn ghost" data-test="chat" data-gender="female">จำลองคอมเมนต์เข้าร่วม (แบบที่ 1)</button>
            <button class="btn ghost" data-test="chat" data-gender="male">จำลองคอมเมนต์เข้าร่วม (แบบที่ 2)</button>
          </div>

          <h3>ทดสอบส่งของขวัญแต่ละระดับ (Tier 1 – Tier 4)</h3>
          <div class="row wrap" id="giftBtns"></div>
        </div>
      </section>
    </div>
  `;

  root.querySelector('#modeSeg').onclick = (e) => {
    const mode = e.target.dataset.mode;
    if (!mode) return;
    if (mode === 'live' && !$('#username').value.trim() && !getState()?.source.username) {
      return toast('กรอก TikTok username ก่อนเชื่อมต่อโหมด Live ครับ', true);
    }
    run(`สลับเป็นโหมด ${mode}`, () =>
      api('/mode', { method: 'POST', body: { mode, username: $('#username').value.trim() || undefined } })
    );
  };

  $('#applyLive').onclick = () => {
    const u = $('#username').value.trim();
    if (!u) return toast('กรุณากรอก TikTok username ก่อนครับ', true);
    run('กำลังเชื่อมต่อ TikTok Live…', () => api('/mode', { method: 'POST', body: { mode: 'live', username: u } }));
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-test]');
    if (!t) return;
    run('ส่งข้อมูลทดสอบเข้าฉากแล้ว', () =>
      api('/test', {
        method: 'POST',
        body: {
          kind: t.dataset.test,
          gender: t.dataset.gender,
          diamonds: Number(t.dataset.diamonds),
          user: 'ผู้ชมทดสอบ',
          giftName: t.dataset.gift,
        },
      })
    );
  });

  $('#autoplay').onchange = (e) =>
    run('อัปเดตโหมดปล่อยอัตโนมัติแล้ว', () => api('/demo/autoplay', { method: 'POST', body: { on: e.target.checked } }));

  $('#clearGame').onclick = () => run('ล้างหน้าเกมแล้ว', () => api('/game/clear', { method: 'POST' }));
  $('#reloadGame').onclick = () => run('สั่งรีโหลดหน้าเกมทุกจอแล้ว', () => api('/game/reload', { method: 'POST' }));
  $('#reloadCfg').onclick = () => run('โหลด config ใหม่แล้ว', () => api('/config/reload', { method: 'POST' }).then(reloadSceneState));

  return {
    setTiers(tiers = []) {
      $('#giftBtns').innerHTML = tiers
        .filter((t) => t.level > 0)
        .map(
          (t) =>
            `<button class="btn ghost" data-test="gift" data-diamonds="${Math.max(1, t.minDiamonds)}" data-gift="Gift Tier ${t.level}">${t.minDiamonds} 💎 · ${t.name}</button>`
        )
        .join('');
    },
    sync(s) {
      if (!s?.source) return;
      document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === s.source.mode));
      const demo = s.source.mode === 'demo';
      $('#demoTools').classList.toggle('disabled', !demo);
      if (document.activeElement !== $('#username') && !$('#username').value) {
        $('#username').value = s.source.username || '';
      }
      if (document.activeElement !== $('#autoplay')) {
        $('#autoplay').checked = !!s.source.autoplay;
      }
    },
  };
}

