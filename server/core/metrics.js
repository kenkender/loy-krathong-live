/** ตัวนับสถิติแบบเบา ๆ สำหรับหน้า Admin */
const WINDOW_MS = 60_000;

const counters = { gift: 0, chat: 0, like: 0, follow: 0, share: 0, job: 0, errors: 0 };
const recent = []; // timestamp ของ event ล่าสุดภายใน 1 นาที
let lastEventAt = 0;
let startedAt = Date.now();

export const metrics = {
  recordEvent(type) {
    if (type in counters) counters[type]++;
    const now = Date.now();
    lastEventAt = now;
    recent.push(now);
  },
  recordJob: () => counters.job++,
  recordError: () => counters.errors++,
  snapshot() {
    const now = Date.now();
    while (recent.length && now - recent[0] > WINDOW_MS) recent.shift();
    return {
      counters: { ...counters },
      eventsPerMin: recent.length,
      lastEventAt,
      uptimeSec: Math.round((now - startedAt) / 1000),
    };
  },
  reset() {
    for (const k of Object.keys(counters)) counters[k] = 0;
    recent.length = 0;
    startedAt = Date.now();
  },
};

