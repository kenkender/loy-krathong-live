import { config } from '../config.js';
import v8 from 'node:v8';
import { logger } from './logger.js';

/**
 * ตรวจสุขภาพระบบทุก ๆ 2 วินาที แล้วสร้าง "การแจ้งเตือน" (alerts)
 * เมื่อปัญหาเกิด → เปิด alert, เมื่อกลับมาปกติ → ปิด alert อัตโนมัติ
 * ระดับ: ok | warn | fail
 */
const alerts = []; // { key, level, component, message, since, resolvedAt }
let components = {};

const rank = { ok: 0, warn: 1, fail: 2 };

function syncAlerts(next) {
  const now = Date.now();
  for (const [name, c] of Object.entries(next)) {
    const key = name;
    const open = alerts.find((a) => a.key === key && !a.resolvedAt);
    if (c.level === 'ok') {
      if (open) {
        open.resolvedAt = now;
        logger.info('health', `กลับมาปกติ: ${c.label}`);
      }
    } else if (!open) {
      alerts.push({ key, level: c.level, component: c.label, message: c.message, since: now, resolvedAt: null });
      logger[c.level === 'fail' ? 'error' : 'warn']('health', `${c.label}: ${c.message}`);
    } else {
      open.level = c.level;
      open.message = c.message;
    }
  }
  while (alerts.length > 100) alerts.shift();
}

export function evaluate({ source, games, metricsSnap, mode }) {
  const h = config.health;
  const now = Date.now();
  const next = {};

  next.server = { label: 'เซิร์ฟเวอร์', level: 'ok', message: 'ทำงานปกติ' };

  const mem = process.memoryUsage();
  const ratio = mem.heapUsed / v8.getHeapStatistics().heap_size_limit;
  next.memory = {
    label: 'หน่วยความจำ',
    level: ratio > h.heapWarnRatio ? 'warn' : 'ok',
    message: `heap ${(ratio * 100).toFixed(0)}% (${Math.round(mem.heapUsed / 1048576)} MB)`,
  };

  const srcLevel = { connected: 'ok', connecting: 'warn', reconnecting: 'warn', idle: 'warn', error: 'fail' }[source.status] || 'warn';
  next.source = { label: mode === 'live' ? 'การเชื่อมต่อ TikTok' : 'ตัวสร้างข้อมูลเดโม', level: srcLevel, message: source.detail || source.status };

  const live = games.filter((g) => now - g.lastBeatAt < h.gameHeartbeatStaleMs);
  if (!games.length) {
    next.game = { label: 'หน้าเกม', level: 'fail', message: 'ไม่มีหน้าเกมเชื่อมต่ออยู่ (เปิด /game ใน OBS หรือเบราว์เซอร์)' };
  } else if (!live.length) {
    next.game = { label: 'หน้าเกม', level: 'warn', message: 'หน้าเกมเชื่อมต่ออยู่แต่ไม่ส่งสัญญาณ (อาจค้าง)' };
  } else {
    const minFps = Math.min(...live.map((g) => g.fps ?? 60));
    next.game = {
      label: 'หน้าเกม',
      level: minFps < h.lowFps ? 'warn' : 'ok',
      message: `${live.length} จอ · FPS ต่ำสุด ${Math.round(minFps)}`,
    };
  }

  const backlog = live.reduce((s, g) => s + (g.queue ?? 0), 0);
  next.queue = { label: 'คิวกระทง', level: backlog > 25 ? 'warn' : 'ok', message: `ค้างคิว ${backlog} รายการ` };

  if (mode === 'live' && source.status === 'connected') {
    const silent = metricsSnap.lastEventAt ? now - metricsSnap.lastEventAt : now - (source.since || now);
    next.activity = {
      label: 'กิจกรรมในไลฟ์',
      level: silent > h.liveSilenceWarnMs ? 'warn' : 'ok',
      message: silent > h.liveSilenceWarnMs ? `ไม่มี event มา ${Math.round(silent / 1000)} วินาที` : 'มี event เข้ามาปกติ',
    };
  }

  components = next;
  syncAlerts(next);
  const overall = Object.values(next).reduce((m, c) => (rank[c.level] > rank[m] ? c.level : m), 'ok');
  return { overall, components: next };
}

export const health = {
  alerts: () => alerts.slice().reverse(),
  components: () => components,
};

