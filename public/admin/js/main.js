import { connectAdmin, api } from './api.js';
import { renderHeader, renderKpis, renderHealth, renderLedger, addEvent, addLog } from './render.js';
import { mountControls } from './controls.js';

let state = null;
let tiersKey = '';
const controls = mountControls(() => state);

function onSnapshot(s) {
  state = s;
  renderHeader(s);
  renderKpis(s);
  renderHealth(s);
  renderLedger(s);
  controls.sync(s);
  const key = JSON.stringify(s.tiers);
  if (key !== tiersKey) {
    tiersKey = key;
    controls.setTiers(s.tiers);
  }
  document.getElementById('eventCount').textContent = `${s.metrics.eventsPerMin} / นาที`;
}

connectAdmin(
  (msg) => {
    if (msg.type === 'snapshot') onSnapshot(msg.data);
    else if (msg.type === 'event') addEvent(msg.data);
    else if (msg.type === 'log') addLog(msg.data);
  },
  (online) => {
    if (!online) {
      const o = document.getElementById('overall');
      o.dataset.level = 'fail';
      o.textContent = 'ขาดการเชื่อมต่อเซิร์ฟเวอร์';
    }
  }
);

// โหลดบันทึกย้อนหลังตอนเปิดหน้า
api('/logs?n=40').then((logs) => logs.forEach(addLog)).catch(() => {});

