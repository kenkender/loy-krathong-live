import { randomUUID } from 'node:crypto';
import { bus } from './bus.js';
import { logger } from './logger.js';
import { metrics } from './metrics.js';
import { ledger } from './ledger.js';
import { giftConfig, resolveTier, detectGender } from './gifts.js';

const PREF_TTL_MS = 60 * 60_000; // จำเพศที่ผู้ชมเลือกไว้ 60 นาที
const PREF_MAX = 10000;
const prefs = new Map(); // userId -> { gender, at }
const lastFree = new Map(); // userId -> ts

function setPref(userId, gender) {
  if (prefs.size >= PREF_MAX) prefs.delete(prefs.keys().next().value);
  prefs.set(userId, { gender, at: Date.now() });
}

function genderFor(userId) {
  const p = prefs.get(userId);
  if (p && Date.now() - p.at < PREF_TTL_MS) return p.gender;
  return Math.random() < 0.5 ? 'male' : 'female';
}

function emitJob({ user, tier, diamonds = 0, giftName = null, count = 1, simulated }) {
  const job = {
    id: randomUUID(),
    ts: Date.now(),
    user,
    gender: genderFor(user.id),
    tier: tier.level,
    tierName: tier.name,
    diamonds,
    giftName,
    count,
    simulated: !!simulated,
  };
  metrics.recordJob();
  bus.emit('job', job);
}

/** แปลง event จาก source เป็นงานลอยกระทงให้หน้าเกม */
function handle(ev) {
  metrics.recordEvent(ev.type);
  const cfg = giftConfig();

  switch (ev.type) {
    case 'chat': {
      const gender = detectGender(ev.text);
      if (!gender) return;
      setPref(ev.user.id, gender);
      const last = lastFree.get(ev.user.id) || 0;
      if (Date.now() - last < cfg.freeCooldownSec * 1000) return;
      lastFree.set(ev.user.id, Date.now());
      emitJob({ user: ev.user, tier: cfg.tiers[0], simulated: ev.simulated });
      break;
    }
    case 'gift': {
      const tier = resolveTier(ev.diamonds);
      ledger.add({ user: ev.user, gift: ev.giftName, count: ev.count, diamonds: ev.diamonds, tier: tier.level, simulated: ev.simulated });
      emitJob({ user: ev.user, tier, diamonds: ev.diamonds, giftName: ev.giftName, count: ev.count, simulated: ev.simulated });
      break;
    }
    case 'like':
      bus.emit('like', { user: ev.user, count: ev.count });
      break;
    default:
  }
}

export function startPipeline() {
  bus.on('event', (ev) => {
    try {
      handle(ev);
    } catch (e) {
      metrics.recordError();
      logger.error('pipeline', 'ประมวลผล event ไม่สำเร็จ', { error: e.message, type: ev?.type });
    }
  });
}

