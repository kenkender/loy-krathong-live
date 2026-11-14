import { $ } from '../dom.js';
import { api } from '../api.js';

export function mountCharactersView(root, pushScenePatch, run, toast, reloadSceneState) {
  root.innerHTML = `
    <div class="detail-grid">
      <!-- Character Pool (Span 7) -->
      <section class="panel span-7">
        <div class="panel-head">
          <h2>คลังตัวละครในฉาก (ไม่ระบุเพศ · สุ่มออกสลับกันครบทุกโมเดล)</h2>
          <div class="row" style="margin:0;">
            <button id="selectAllPoolBtn" class="btn ghost" style="height:30px;font-size:12px;">เลือกตัวละครทั้งหมด</button>
            <button id="refreshModelsBtn" class="btn ghost" style="height:30px;font-size:12px;">รีเฟรชคลัง</button>
            <a class="btn" href="/converter/" target="_blank" style="height:30px;font-size:12px;">+ เพิ่มโมเดลใหม่</a>
          </div>
        </div>

        <div id="characterPoolList" class="pool-grid"></div>

        <div class="field" style="margin-top:20px;">
          <label>
            <span>ขนาดตัวละครในฉาก (Character Scale)</span>
            <b id="scaleVal">1.00x</b>
          </label>
          <input id="charScaleRange" type="range" min="0.4" max="2.2" step="0.05" value="1" />
        </div>
      </section>

      <!-- 3D Props & Instant Spawner (Span 5) -->
      <section class="panel span-5">
        <div class="panel-head">
          <h2>สิ่งปลูกสร้าง 3D และเสกตัวละครเข้าฉาก</h2>
          <small>PROPS &amp; SPAWNER</small>
        </div>

        <div class="field">
          <label>วัตถุ 3D ฉากหลังฝั่งซ้าย (Left Stage Prop)</label>
          <select id="leftPropSelect"></select>
        </div>

        <div class="field">
          <label>วัตถุ 3D ฉากหลังฝั่งขวา (Right Stage Prop)</label>
          <select id="rightPropSelect"></select>
        </div>

        <h3>ปล่อยตัวละครและเอฟเฟกต์ขึ้นเวทีทันที</h3>
        <div class="field">
          <label>ชื่อบนหัวตัวละคร</label>
          <input id="spawnUser" type="text" value="ผู้ร่วมงาน" placeholder="ชื่อผู้ชม" />
        </div>

        <div class="row">
          <select id="spawnModelSelect"></select>
          <select id="spawnTierSelect" style="max-width:155px;">
            <option value="0">ระดับ 0 (ฟรี)</option>
            <option value="1">ระดับ 1 (1+ 💎)</option>
            <option value="2">ระดับ 2 (30+ 💎)</option>
            <option value="3" selected>ระดับ 3 (300+ 💎)</option>
            <option value="4">ระดับ 4 (1500+ 💎)</option>
          </select>
        </div>

        <div class="row wrap" style="margin-top:12px;">
          <button id="spawnAnyBtn" class="btn" style="flex:1;">ปล่อยตัวละครเข้าฉากทันที</button>
          <button id="spawnQueueWaveBtn" class="btn primary" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;font-weight:700;">จำลองคนโดเนทต่อแถว (10 คน)</button>
          <button id="fxFireworksBtn" class="btn ghost">จุดพลุฉลอง</button>
          <button id="fxLanternsBtn" class="btn ghost">ปล่อยโคมลอย</button>
        </div>
      </section>
    </div>
  `;

  let cachedModels = [];

  $('#characterPoolList').onchange = () => {
    const checkedUrls = Array.from(document.querySelectorAll('.pool-check:checked')).map((el) => el.value);
    if (checkedUrls.length === 0) {
      toast('ต้องเลือกตัวละครในฉากอย่างน้อย 1 ตัวครับ', true);
      reloadSceneState();
      return;
    }
    pushScenePatch(`อัปเดตคลังตัวละครในฉาก (${checkedUrls.length} ตัว)`, { characterPool: checkedUrls });
  };

  $('#selectAllPoolBtn').onclick = () => {
    const propKeywords = ['pagoda', 'mandapa', 'temple', 'wat_'];
    const charUrls = cachedModels
      .filter((m) => !propKeywords.some((k) => m.name.toLowerCase().includes(k)))
      .map((m) => m.url);
    if (charUrls.length > 0) {
      pushScenePatch(`เลือกตัวละครทั้งหมด (${charUrls.length} ตัว) แล้ว`, { characterPool: charUrls });
    }
  };

  $('#refreshModelsBtn').onclick = () => run('อัปเดตรายชื่อโมเดลแล้ว', reloadSceneState);
  $('#leftPropSelect').onchange = (e) => pushScenePatch('เปลี่ยนวัตถุฉากซ้ายแล้ว', { leftPropModel: e.target.value });
  $('#rightPropSelect').onchange = (e) => pushScenePatch('เปลี่ยนวัตถุฉากขวาแล้ว', { rightPropModel: e.target.value });

  $('#charScaleRange').oninput = (e) => {
    $('#scaleVal').textContent = `${Number(e.target.value).toFixed(2)}x`;
  };
  $('#charScaleRange').onchange = (e) => {
    pushScenePatch('ปรับขนาดตัวละครแล้ว', { characterScale: Number(e.target.value) });
  };

  $('#spawnAnyBtn').onclick = () => {
    const user = $('#spawnUser').value.trim() || 'ผู้ร่วมงาน';
    const tier = Number($('#spawnTierSelect').value) || 0;
    const modelUrl = $('#spawnModelSelect').value || undefined;
    run(`ปล่อยตัวละคร "${user}" เข้าฉากแล้ว`, () =>
      api('/spawn', { method: 'POST', body: { user, tier, modelUrl } })
    );
  };

  $('#spawnQueueWaveBtn').onclick = () => {
    run('ส่งขบวนบุญโดเนทต่อเนื่อง 10 คนเข้าฉากแล้ว', () =>
      api('/spawn-wave', { method: 'POST', body: { count: 10 } })
    );
  };

  $('#fxFireworksBtn').onclick = () => run('จุดพลุฉลองแล้ว', () => api('/fx', { method: 'POST', body: { kind: 'fireworks' } }));
  $('#fxLanternsBtn').onclick = () => run('ปล่อยโคมลอยแล้ว', () => api('/fx', { method: 'POST', body: { kind: 'lanterns' } }));

  return {
    update(scene, models = []) {
      if (!scene) return;
      cachedModels = models;
      const activePool = new Set(scene.characterPool || []);
      const propKeywords = ['pagoda', 'mandapa', 'temple', 'wat_'];

      $('#characterPoolList').innerHTML = models
        .map((m) => {
          const isChecked = activePool.has(m.url);
          const isPropHint = propKeywords.some((k) => m.name.toLowerCase().includes(k));
          return `
            <label class="pool-card ${isChecked ? 'checked' : ''}">
              <input type="checkbox" class="pool-check" value="${m.url}" ${isChecked ? 'checked' : ''} />
              <div class="pool-card-info">
                <b>${m.name.replace(/\.glb$/i, '')}</b>
                <small>${m.sizeMB} MB${isPropHint ? ' · วัตถุฉาก' : ''}</small>
              </div>
            </label>`;
        })
        .join('');

      const buildPropOptions = (selectedUrl) => {
        const opts = [`<option value="none" ${selectedUrl === 'none' ? 'selected' : ''}>— ซ่อน / ไม่แสดง —</option>`];
        for (const m of models) {
          const sel = m.url === selectedUrl ? 'selected' : '';
          opts.push(`<option value="${m.url}" ${sel}>${m.name} (${m.sizeMB} MB)</option>`);
        }
        return opts.join('');
      };

      $('#leftPropSelect').innerHTML = buildPropOptions(scene.leftPropModel);
      $('#rightPropSelect').innerHTML = buildPropOptions(scene.rightPropModel);

      $('#spawnModelSelect').innerHTML =
        `<option value="">สุ่มจากคลังที่เลือกไว้ (${activePool.size} ตัว)</option>` +
        models.map((m) => `<option value="${m.url}">เจาะจง: ${m.name.replace(/\.glb$/i, '')}</option>`).join('');

      const sc = Number(scene.characterScale) || 1;
      $('#charScaleRange').value = sc;
      $('#scaleVal').textContent = `${sc.toFixed(2)}x`;
    },
  };
}

