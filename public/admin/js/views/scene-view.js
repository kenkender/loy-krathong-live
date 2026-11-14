import { $ } from '../dom.js';

const MODE_PRESETS = {
  'loy-krathong': {
    badgeText: 'ประเพณีลอยกระทง',
    title: 'ลอยกระทง ขอขมาพระแม่คงคา',
    subtitle: 'ร่วมลอยกระทงด้วยกัน ทุกใบคือความตั้งใจดี',
    theme: 'loy-krathong',
  },
  'temple-blessing': {
    badgeText: 'มหาบุญมหากุศล',
    title: 'ไหว้พระขอพร เสริมสิริมงคล',
    subtitle: 'ร่วมถวายประทีปบูชาและอธิษฐานจิตหน้าองค์พระประธาน',
    theme: 'temple-fair',
  },
  'party-dance': {
    badgeText: 'LIVE PARTY STAGE',
    title: 'ปาร์ตี้แดนซ์ สนุกสุดเหวี่ยง',
    subtitle: 'ส่งคอมเมนต์และของขวัญเพื่อส่งตัวละครออกสเต็ปเต้นไฟลุกบนเวที',
    theme: 'cyber-festival',
  },
};

export function mountSceneView(root, pushScenePatch) {
  root.innerHTML = `
    <div class="detail-grid">
      <!-- Activity Mode Selector (Span 12) -->
      <section class="panel span-12">
        <div class="panel-head">
          <h2>เลือกรูปแบบงาน / โหมดกิจกรรมหลัก (Activity Mode)</h2>
          <small>SWITCH GAMEPLAY MODE</small>
        </div>

        <div class="mode-cards" id="activityModeCards">
          <button type="button" class="mode-card" data-activity="loy-krathong">
            <span class="mode-tag">MODE 01 · RIVER FESTIVAL</span>
            <strong>งานลอยกระทงริมน้ำ</strong>
            <p>ตัวละครเดินถือกระทงลงท่าน้ำ นั่งคุกเข่าปล่อยกระทงลอยไปตามสายน้ำและพนมมืออธิษฐาน</p>
          </button>

          <button type="button" class="mode-card" data-activity="temple-blessing">
            <span class="mode-tag">MODE 02 · TEMPLE WORSHIP</span>
            <strong>งานไหว้พระขอพร / ทำบุญใหญ่</strong>
            <p>เปลี่ยนผิวน้ำเป็นลานหินอ่อนและพรมแดงมงคล ตัวละครถือถ้วยเทียนทองคำเดินแถวขบวนบุญ 5 สาย เลี้ยว 90° เข้าสู่เบาะกราบไหว้พระ พร้อมดวงแก้วคำอธิษฐานลอยขึ้นฟ้า</p>
          </button>

          <button type="button" class="mode-card" data-activity="party-dance">
            <span class="mode-tag">MODE 03 · CONCERT &amp; DANCE</span>
            <strong>ปาร์ตี้แดนซ์ฟลอร์สนุกสนาน</strong>
            <p>เปลี่ยนฉากเป็นเวทีคอนเสิร์ตไฟนีออน LED ตัวละครถือแท่งไฟออกมายืนเต้นและหมุนตัวตามระดับของขวัญ</p>
          </button>
        </div>

        <div style="margin-top:12px;">
          <label class="switch" style="display:inline-flex;background:transparent;border:0;padding:4px 0;">
            <input id="autoPresetText" type="checkbox" checked />
            <span></span>
            ปรับข้อความหัวเรื่องและโทนสีฉากให้อัตโนมัติเมื่อสลับโหมดงาน
          </label>
        </div>
      </section>

      <!-- Scene Title & Header Texts (Span 7) -->
      <section class="panel span-7">
        <div class="panel-head">
          <h2>ชื่อฉากและข้อความหัวเรื่องบนหน้าจอเกม</h2>
          <small>HUD HEADER &amp; BRANDING</small>
        </div>

        <div class="field">
          <label>ป้ายกำกับด้านบน (Badge Text)</label>
          <input id="sceneBadgeInput" type="text" placeholder="เช่น ประเพณีลอยกระทง / มหาบุญไหว้พระ / LIVE PARTY" />
        </div>

        <div class="field">
          <label>ชื่อฉากหลัก (Main Title — เว้นวรรคเพื่อแยกบรรทัดสีทอง)</label>
          <input id="sceneTitleInput" type="text" placeholder="เช่น ลอยกระทง ขอขมาพระแม่คงคา" />
        </div>

        <div class="field">
          <label>คำโปรยรอง (Subtitle)</label>
          <input id="sceneSubInput" type="text" placeholder="เช่น ร่วมลอยกระทงด้วยกัน ทุกใบคือความตั้งใจดี" />
        </div>

        <div class="row" style="margin-top:14px;">
          <button id="saveSceneTitleBtn" class="btn">บันทึกข้อความหัวเรื่อง</button>
        </div>
      </section>

      <!-- Atmosphere Theme & Scene Toggles (Span 5) -->
      <section class="panel span-5">
        <div class="panel-head">
          <h2>โทนสีบรรยากาศและองค์ประกอบฉาก</h2>
          <small>ATMOSPHERE &amp; PROPS</small>
        </div>

        <div class="field">
          <label>โทนสีบรรยากาศ (Color Theme)</label>
          <div class="tile-grid" id="themeSeg">
            <button type="button" class="tile-btn" data-theme="loy-krathong">
              <strong>คืนเพ็ญดั้งเดิม</strong>
              <small>Warm Moonlight</small>
            </button>
            <button type="button" class="tile-btn" data-theme="temple-fair">
              <strong>งานวัดสีทอง</strong>
              <small>Golden Temple</small>
            </button>
            <button type="button" class="tile-btn" data-theme="sakura-anime">
              <strong>ซากุระอนิเมะ</strong>
              <small>Sakura Pink</small>
            </button>
            <button type="button" class="tile-btn" data-theme="cyber-festival">
              <strong>ไซเบอร์นีออน</strong>
              <small>Cyber Neon</small>
            </button>
          </div>
        </div>

        <h3>เปิด / ปิดองค์ประกอบในฉากหลัง</h3>
        <div class="switch-grid">
          <label class="switch"><input id="toggleProps" type="checkbox" checked /><span></span>สิ่งปลูกสร้าง 3D</label>
          <label class="switch"><input id="toggleWheel" type="checkbox" checked /><span></span>ชิงช้าสวรรค์</label>
          <label class="switch"><input id="toggleLanterns" type="checkbox" checked /><span></span>โคมลอยฟ้า</label>
          <label class="switch"><input id="toggleNPCs" type="checkbox" checked /><span></span>คนเดินงานวัด</label>
        </div>
      </section>
    </div>
  `;

  $('#activityModeCards').addEventListener('click', (e) => {
    const card = e.target.closest('[data-activity]');
    if (!card) return;
    const activityMode = card.dataset.activity;
    const patch = { activityMode };

    if ($('#autoPresetText')?.checked && MODE_PRESETS[activityMode]) {
      Object.assign(patch, MODE_PRESETS[activityMode]);
    }
    pushScenePatch(`สลับเป็นโหมด "${card.querySelector('strong').textContent}" แล้ว`, patch);
  });

  $('#saveSceneTitleBtn').onclick = () => {
    pushScenePatch('บันทึกชื่อฉากและหัวเรื่องแล้ว', {
      badgeText: $('#sceneBadgeInput').value.trim(),
      title: $('#sceneTitleInput').value.trim(),
      subtitle: $('#sceneSubInput').value.trim(),
    });
  };

  $('#themeSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme]');
    if (!btn) return;
    pushScenePatch(`เปลี่ยนโทนสีเป็น "${btn.querySelector('strong').textContent}"`, {
      theme: btn.dataset.theme,
    });
  });

  $('#toggleProps').onchange = (e) => pushScenePatch('อัปเดตสิ่งปลูกสร้าง 3D แล้ว', { showProps: e.target.checked });
  $('#toggleWheel').onchange = (e) => pushScenePatch('อัปเดตชิงช้าสวรรค์แล้ว', { showFerrisWheel: e.target.checked });
  $('#toggleLanterns').onchange = (e) => pushScenePatch('อัปเดตโคมลอยแล้ว', { showLanterns: e.target.checked });
  $('#toggleNPCs').onchange = (e) => pushScenePatch('อัปเดตคนเดินงานวัดแล้ว', { showNPCs: e.target.checked });

  return {
    update(scene) {
      if (!scene) return;
      const mode = scene.activityMode || 'loy-krathong';
      document.querySelectorAll('#activityModeCards .mode-card').forEach((c) => {
        c.classList.toggle('active', c.dataset.activity === mode);
      });

      const modePill = $('#activeModePill');
      if (modePill) {
        const labels = {
          'loy-krathong': 'MODE: LOY KRATHONG',
          'temple-blessing': 'MODE: TEMPLE WORSHIP',
          'party-dance': 'MODE: PARTY DANCE',
        };
        modePill.textContent = labels[mode] || 'MODE: LIVE';
      }

      if (document.activeElement !== $('#sceneBadgeInput')) $('#sceneBadgeInput').value = scene.badgeText || '';
      if (document.activeElement !== $('#sceneTitleInput')) $('#sceneTitleInput').value = scene.title || '';
      if (document.activeElement !== $('#sceneSubInput')) $('#sceneSubInput').value = scene.subtitle || '';

      document.querySelectorAll('#themeSeg .tile-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.theme === scene.theme);
      });

      $('#toggleProps').checked = scene.showProps !== false;
      $('#toggleWheel').checked = scene.showFerrisWheel !== false;
      $('#toggleLanterns').checked = scene.showLanterns !== false;
      $('#toggleNPCs').checked = scene.showNPCs !== false;
    },
  };
}

