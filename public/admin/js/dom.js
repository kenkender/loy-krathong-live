export const $ = (sel) => document.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (n) => Number(n || 0).toLocaleString('th-TH');
export const time = (ts) => new Date(ts).toLocaleTimeString('th-TH', { hour12: false });

export function duration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h} ชม. ${m} น.` : m ? `${m} น. ${sec % 60} ว.` : `${sec} ว.`;
}

export function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast show${isError ? ' error' : ''}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.className = 'toast'), 2800);
}

export const LEVEL_TEXT = { ok: 'ปกติ', warn: 'เฝ้าระวัง', fail: 'มีปัญหา' };

