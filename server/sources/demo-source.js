import { bus } from '../core/bus.js';
import { makeEvent } from './event.js';

const NAMES = ['น้องมายด์', 'พี่โบ๊ท', 'ป้าสมศรี', 'ลุงชาติ', 'แพรวา', 'ต้นกล้า', 'ใบเตย', 'มะลิ', 'ปลายฟ้า', 'ตะวัน', 'นุ่น', 'เจ้าบุญ'];
const GIFTS = [
  { name: 'Rose', diamonds: 1 },
  { name: 'Heart', diamonds: 5 },
  { name: 'GG', diamonds: 10 },
  { name: 'Finger Heart', diamonds: 5 },
  { name: 'Hand Hearts', diamonds: 100 },
  { name: 'Money Gun', diamonds: 500 },
  { name: 'Galaxy', diamonds: 1000 },
  { name: 'Lion', diamonds: 29999 },
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** สร้าง event จำลองแบบสุ่ม: คอมเมนต์เลือกเพศ → ของขวัญ → ไลก์ */
export function randomDemoSequence() {
  const user = { id: `demo-${Math.random().toString(36).slice(2, 8)}`, name: pick(NAMES) };
  const out = [];
  out.push(makeEvent('chat', user, { text: Math.random() < 0.5 ? 'ชาย' : 'หญิง', simulated: true }));
  if (Math.random() < 0.8) {
    const r = Math.random();
    const g = r < 0.45 ? GIFTS[0] : r < 0.7 ? GIFTS[Math.floor(Math.random() * 4)] : r < 0.88 ? GIFTS[4] : r < 0.97 ? GIFTS[5] : GIFTS[6];
    out.push(makeEvent('gift', user, { giftName: g.name, diamonds: g.diamonds, count: 1, simulated: true }));
  }
  return out;
}

export class DemoSource {
  constructor({ autoplay, intervalMs }) {
    this.name = 'demo';
    this.autoplay = autoplay;
    this.intervalMs = intervalMs;
    this.timer = null;
  }

  async start() {
    bus.emit('source', { status: 'connected', detail: 'โหมดเดโม (ข้อมูลจำลอง)' });
    this.setAutoplay(this.autoplay);
  }

  setAutoplay(on, intervalMs) {
    this.autoplay = on;
    if (intervalMs) this.intervalMs = intervalMs;
    clearTimeout(this.timer);
    if (!on) return;
    const tick = () => {
      let delay = 0;
      for (const ev of randomDemoSequence()) {
        setTimeout(() => bus.emit('event', ev), delay);
        delay += 2500;
      }
      this.timer = setTimeout(tick, this.intervalMs * (0.6 + Math.random() * 0.8));
    };
    this.timer = setTimeout(tick, 1200);
  }

  async stop() {
    clearTimeout(this.timer);
    this.timer = null;
  }

  /** ฉีด event ทดสอบด้วยมือจากหน้า Admin */
  inject({ kind, user, gender, diamonds, giftName }) {
    const u = { id: `test-${user}`, name: user || 'ผู้ทดสอบ' };
    if (kind === 'chat') {
      bus.emit('event', makeEvent('chat', u, { text: gender === 'female' ? 'หญิง' : 'ชาย', simulated: true }));
    } else if (kind === 'gift') {
      bus.emit('event', makeEvent('gift', u, { giftName: giftName || 'Test Gift', diamonds, count: 1, simulated: true }));
    } else if (kind === 'like') {
      bus.emit('event', makeEvent('like', u, { count: 15, simulated: true }));
    }
  }
}

