import { $ } from '../dom.js';

const VIEW_META = {
  scene: {
    title: 'โหมดงานและฉาก (Scene & Activity Studio)',
    subtitle: 'สลับโหมดกิจกรรมเป็นงานลอยกระทง ไหว้พระขอพร หรือปาร์ตี้แดนซ์ฟลอร์ได้ทันทีโดยไม่ต้องสร้างโปรเจกต์ใหม่',
  },
  camera: {
    title: 'มุมกล้องและทิศทาง (3D Camera & Stage Direction)',
    subtitle: 'ควบคุมมุมกล้อง 3 มิติ ระยะซูม จังหวะการเต้น และทิศทางการเดินเข้าฉากของตัวละครแบบเรียลไทม์',
  },
  characters: {
    title: 'คลังตัวละครและวัตถุ 3D (Character Pool & Stage Props)',
    subtitle: 'เลือกโมเดลตัวละครเดินสลับกันโดยไม่จำกัดเพศ ปรับขนาดตัวละคร และเสกตัวละครขึ้นเวทีทันที',
  },
  source: {
    title: 'เชื่อมต่อ TikTok Live & ทดสอบของขวัญ (Source & Simulator)',
    subtitle: 'สลับโหมดรับข้อมูลจาก TikTok Live จริง หรือใช้ปุ่มจำลองเหตุการณ์เพื่อทดสอบเอฟเฟกต์แต่ละระดับ',
  },
  monitor: {
    title: 'มอนิเตอร์ระบบและบัญชีทำบุญ (Telemetry & Gift Ledger)',
    subtitle: 'ติดตามสถานะสุขภาพระบบ เหตุการณ์สดจากผู้ชม และดาวน์โหลดรายงานบัญชีของขวัญ CSV',
  },
};

export function initSidebar() {
  const nav = $('#sideNav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item[data-target]');
    if (!btn) return;
    const target = btn.dataset.target;

    document.querySelectorAll('.side-nav .nav-item').forEach((el) => {
      el.classList.toggle('active', el === btn);
    });

    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('active', sec.dataset.view === target);
    });

    const meta = VIEW_META[target];
    if (meta) {
      $('#viewTitle').textContent = meta.title;
      $('#viewSubtitle').textContent = meta.subtitle;
    }
  });
}

