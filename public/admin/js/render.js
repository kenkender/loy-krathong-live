import { $, esc, fmt, time, duration, LEVEL_TEXT } from './dom.js';

const SOURCE_TEXT = { connected: 'เชื่อมต่อแล้ว', connecting: 'กำลังเชื่อมต่อ', reconnecting: 'กำลังเชื่อมใหม่', error: 'มีข้อผิดพลาด', idle: 'ยังไม่เริ่ม' };
const SOURCE_LEVEL = { connected: 'ok', connecting: 'warn', reconnecting: 'warn', idle: 'warn', error: 'fail' };

export function renderHeader(s) {
  const o = $('#overall');
  o.dataset.level = s.overall;
  o.textContent = `ระบบ${LEVEL_TEXT[s.overall]}`;
  const b = $('#modeBadge');
  b.textContent = s.source.mode === 'live' ? `LIVE · @${s.source.username || '-'}` : 'DEMO';
  b.dataset.mode = s.source.mode;
}

export function renderKpis(s) {
  const games = s.games;
  const fps = games.length ? Math.round(Math.min(...games.map((g) => g.fps ?? 0))) : '-';
  const queue = games.reduce((a, g) => a + (g.queue || 0), 0);
  const cards = [
    { label: 'ตัวเชื่อมต่อ', value: SOURCE_TEXT[s.source.status] || s.source.status, sub: s.source.detail, level: SOURCE_LEVEL[s.source.status] },
    { label: 'จอเกมที่เปิดอยู่', value: games.length, sub: `FPS ต่ำสุด ${fps}`, level: s.components.game?.level },
    { label: 'เหตุการณ์ / นาที', value: fmt(s.metrics.eventsPerMin), sub: `รวม ${fmt(Object.values(s.metrics.counters).slice(0, 5).reduce((a, b) => a + b, 0))} รายการ` },
    { label: 'กระทงที่สร้าง', value: fmt(s.metrics.counters.job), sub: `ค้างคิว ${queue}`, level: s.components.queue?.level },
    { label: 'ทำงานมาแล้ว', value: duration(s.metrics.uptimeSec), sub: `Node ${s.system.node}` },
    { label: 'หน่วยความจำ', value: `${s.system.rssMb} MB`, sub: s.components.memory?.message, level: s.components.memory?.level },
  ];
  $('#kpis').innerHTML = cards
    .map((c) => `<article class="kpi" data-level="${c.level || 'none'}"><span>${esc(c.label)}</span><strong>${esc(c.value)}</strong><em>${esc(c.sub || '')}</em></article>`)
    .join('');
}

export function renderHealth(s) {
  $('#components').innerHTML = Object.values(s.components)
    .map((c) => `<li data-level="${c.level}"><i></i><div><b>${esc(c.label)}</b><span>${esc(c.message)}</span></div><em>${LEVEL_TEXT[c.level]}</em></li>`)
    .join('');
  $('#alerts').innerHTML =
    s.alerts.map((a) => `<li data-level="${a.resolvedAt ? 'done' : a.level}"><time>${time(a.since)}</time><div><b>${esc(a.component)}</b><span>${esc(a.message)}</span></div><em>${a.resolvedAt ? `แก้แล้ว ${time(a.resolvedAt)}` : 'ยังเปิดอยู่'}</em></li>`).join('') ||
    '<li class="empty">ไม่มีการแจ้งเตือน</li>';
}

export function renderLedger(s) {
  const l = s.ledger;
  $('#ledger').innerHTML = `
    <div class="ledger-grid">
      <div><span>เพชรรวม (ของจริง)</span><strong>${fmt(l.diamonds)}</strong></div>
      <div><span>ประมาณการรายได้</span><strong>฿${fmt(l.estimatedThb)}</strong></div>
      <div><span>ตั้งใจทำบุญ ${l.meritSharePercent}%</span><strong class="gold">฿${fmt(l.meritPledgeThb)}</strong></div>
    </div>
    <p class="note">ตัวเลขเงินบาทเป็นเพียงประมาณการตามค่าใน config/gifts.json ยอดจริงดูในแอป TikTok · รายการจำลอง ${fmt(l.simulatedEntries)} ไม่นับรวม</p>
    <a class="btn ghost" href="/api/admin/ledger.csv" download>ดาวน์โหลดรายงาน CSV</a>`;
}

const EVENT_ICON = { gift: '🎁', chat: '💬', like: '❤️', follow: '➕', share: '↗️' };

export function addEvent(ev) {
  const list = $('#events');
  const text = ev.type === 'gift' ? `${ev.giftName} ×${ev.count} · ${fmt(ev.diamonds)} 💎` : ev.type === 'chat' ? ev.text : ev.type === 'like' ? `ไลก์ ${ev.count}` : ev.type;
  const li = document.createElement('li');
  li.className = ev.simulated ? 'sim' : '';
  li.innerHTML = `<time>${time(ev.ts)}</time><span class="ic">${EVENT_ICON[ev.type] || '•'}</span><b>${esc(ev.user.name)}</b><span class="txt">${esc(text)}</span>${ev.simulated ? '<em>จำลอง</em>' : ''}`;
  list.prepend(li);
  while (list.children.length > 80) list.lastChild.remove();
}

export function addLog(entry) {
  const list = $('#logs');
  const li = document.createElement('li');
  li.dataset.level = entry.level;
  li.innerHTML = `<time>${time(entry.ts)}</time><b>${esc(entry.scope)}</b><span>${esc(entry.message)}</span>`;
  list.prepend(li);
  while (list.children.length > 60) list.lastChild.remove();
}

