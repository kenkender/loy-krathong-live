import { $ } from '../dom.js';

export function mountCameraView(root, pushScenePatch) {
  root.innerHTML = `
    <div class="detail-grid">
      <!-- Camera Presets (Span 6) -->
      <section class="panel span-6">
        <div class="panel-head">
          <h2>มุมกล้อง 3 มิติสำเร็จรูป (Camera Angle Presets)</h2>
          <small>3D CAMERA RIG</small>
        </div>

        <div class="tile-grid" id="cameraPresetGrid">
          <button type="button" class="tile-btn" data-cam="front">
            <strong>หน้าตรง (Front View)</strong>
            <small>มุมมองเวทีด้านหน้าตรง 0°</small>
          </button>
          <button type="button" class="tile-btn" data-cam="iso-left">
            <strong>เฉียงซ้าย 3 มิติ (Iso Left)</strong>
            <small>หันกล้องเฉียงซ้าย -24° เห็นมิติลึก</small>
          </button>
          <button type="button" class="tile-btn" data-cam="iso-right">
            <strong>เฉียงขวา 3 มิติ (Iso Right)</strong>
            <small>หันกล้องเฉียงขวา +24° เห็นมิติลึก</small>
          </button>
          <button type="button" class="tile-btn" data-cam="high-stage">
            <strong>มุมสูงเห็นลานกว้าง (High Stage)</strong>
            <small>กดมุมกล้องลงเห็นพื้นเวทีชัด</small>
          </button>
          <button type="button" class="tile-btn" data-cam="cinema-orbit">
            <strong>แพนกล้องอัตโนมัติ (Cinema Orbit)</strong>
            <small>กล้องเลื่อนซ้าย-ขวาช้าๆ แบบภาพยนตร์</small>
          </button>
        </div>

        <h3>ทิศทางการเดินเข้าฉากของตัวละคร (Walk Direction)</h3>
        <div class="tile-grid" id="walkDirGrid">
          <button type="button" class="tile-btn" data-dir="left-to-right">
            <strong>ซ้าย → ไปขวา</strong>
            <small>เดินเข้าจากฝั่งซ้ายออกขวา</small>
          </button>
          <button type="button" class="tile-btn" data-dir="right-to-left">
            <strong>ขวา → ไปซ้าย</strong>
            <small>เดินเข้าจากฝั่งขวาออกซ้าย</small>
          </button>
          <button type="button" class="tile-btn" data-dir="back-to-front">
            <strong>ด้านหลัง → ออกมาหน้าเวที</strong>
            <small>เดินจากด้านในออกมาหาคนดู</small>
          </button>
          <button type="button" class="tile-btn" data-dir="center-spread">
            <strong>กลางเวที → กระจายซ้ายขวา</strong>
            <small>เปิดตัวจากกึ่งกลางแยกเข้าจุดยืน</small>
          </button>
        </div>
      </section>

      <!-- Fine Camera & Dance Speed Controls (Span 6) -->
      <section class="panel span-6">
        <div class="panel-head">
          <h2>ปรับแต่งมุมกล้องและจังหวะละเอียด (Fine Tuning)</h2>
          <small>MANUAL OVERRIDE</small>
        </div>

        <div class="field">
          <label>
            <span>มุมหันกล้องซ้าย-ขวาเพิ่มเติม (Camera Yaw Offset)</span>
            <b id="camYawVal">0°</b>
          </label>
          <input id="camYawRange" type="range" min="-45" max="45" step="1" value="0" />
        </div>

        <div class="field">
          <label>
            <span>มุมก้ม-เงยกล้องเพิ่มเติม (Camera Tilt Offset)</span>
            <b id="camTiltVal">0°</b>
          </label>
          <input id="camTiltRange" type="range" min="-25" max="25" step="1" value="0" />
        </div>

        <div class="field">
          <label>
            <span>ระยะซูมกล้อง 3D (Camera Zoom)</span>
            <b id="camZoomVal">1.00x</b>
          </label>
          <input id="camZoomRange" type="range" min="0.65" max="1.45" step="0.05" value="1" />
        </div>

        <div class="field">
          <label>
            <span>ความเร็วจังหวะเต้นและไฟเวที (Party Beat Speed)</span>
            <b id="danceSpeedVal">1.00x</b>
          </label>
          <input id="danceSpeedRange" type="range" min="0.5" max="2.5" step="0.1" value="1" />
        </div>

        <div class="row" style="margin-top:18px;">
          <button id="resetCamBtn" class="btn ghost">รีเซ็ตมุมกล้องและทิศทางเป็นค่าเริ่มต้น</button>
        </div>
      </section>
    </div>
  `;

  $('#cameraPresetGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cam]');
    if (!btn) return;
    pushScenePatch(`เปลี่ยนมุมกล้องเป็น "${btn.querySelector('strong').textContent}"`, {
      cameraPreset: btn.dataset.cam,
    });
  });

  $('#walkDirGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dir]');
    if (!btn) return;
    pushScenePatch(`เปลี่ยนทิศทางเดินเป็น "${btn.querySelector('strong').textContent}"`, {
      walkDirection: btn.dataset.dir,
    });
  });

  $('#camYawRange').oninput = (e) => {
    $('#camYawVal').textContent = `${e.target.value}°`;
  };
  $('#camYawRange').onchange = (e) => {
    pushScenePatch('ปรับมุมหันกล้องแล้ว', { cameraYaw: Number(e.target.value) });
  };

  $('#camTiltRange').oninput = (e) => {
    $('#camTiltVal').textContent = `${e.target.value}°`;
  };
  $('#camTiltRange').onchange = (e) => {
    pushScenePatch('ปรับมุมก้ม-เงยกล้องแล้ว', { cameraTilt: Number(e.target.value) });
  };

  $('#camZoomRange').oninput = (e) => {
    $('#camZoomVal').textContent = `${Number(e.target.value).toFixed(2)}x`;
  };
  $('#camZoomRange').onchange = (e) => {
    pushScenePatch('ปรับระยะซูมกล้องแล้ว', { cameraZoom: Number(e.target.value) });
  };

  $('#danceSpeedRange').oninput = (e) => {
    $('#danceSpeedVal').textContent = `${Number(e.target.value).toFixed(2)}x`;
  };
  $('#danceSpeedRange').onchange = (e) => {
    pushScenePatch('ปรับความเร็วจังหวะเต้นแล้ว', { danceSpeed: Number(e.target.value) });
  };

  $('#resetCamBtn').onclick = () => {
    pushScenePatch('รีเซ็ตมุมกล้องและทิศทางเรียบร้อยแล้ว', {
      cameraPreset: 'front',
      walkDirection: 'left-to-right',
      cameraYaw: 0,
      cameraTilt: 0,
      cameraZoom: 1,
      danceSpeed: 1,
    });
  };

  return {
    update(scene) {
      if (!scene) return;
      const cam = scene.cameraPreset || 'front';
      document.querySelectorAll('#cameraPresetGrid .tile-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.cam === cam);
      });

      const dir = scene.walkDirection || 'left-to-right';
      document.querySelectorAll('#walkDirGrid .tile-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.dir === dir);
      });

      const yaw = Number(scene.cameraYaw) || 0;
      const tilt = Number(scene.cameraTilt) || 0;
      const zoom = Number(scene.cameraZoom) || 1;
      const speed = Number(scene.danceSpeed) || 1;

      $('#camYawRange').value = yaw;
      $('#camYawVal').textContent = `${yaw}°`;

      $('#camTiltRange').value = tilt;
      $('#camTiltVal').textContent = `${tilt}°`;

      $('#camZoomRange').value = zoom;
      $('#camZoomVal').textContent = `${zoom.toFixed(2)}x`;

      $('#danceSpeedRange').value = speed;
      $('#danceSpeedVal').textContent = `${speed.toFixed(2)}x`;
    },
  };
}

