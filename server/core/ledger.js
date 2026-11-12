import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { giftConfig, diamondsToThb } from './gifts.js';
import { logger } from './logger.js';

/**
 * บัญชีรายการของขวัญ (เพื่อความโปร่งใสเรื่องเงินทำบุญ)
 * บันทึกลงไฟล์ data/ledger.json และออกรายงาน CSV ได้
 * หมายเหตุ: มูลค่าเงินบาทเป็นเพียง "ประมาณการ" ตามค่าใน config/gifts.json
 */
const file = path.join(config.dataDir, 'ledger.json');
let rows = [];
let saveTimer = null;

function load() {
  try {
    rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    rows = [];
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(config.dataDir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(rows));
    } catch (e) {
      logger.error('ledger', 'บันทึกไฟล์ไม่สำเร็จ', { error: e.message });
    }
  }, 1500);
}

load();

export const ledger = {
  add({ user, gift, count, diamonds, tier, simulated }) {
    rows.push({ ts: Date.now(), user: user.name, gift, count, diamonds, tier, simulated: !!simulated });
    scheduleSave();
  },
  summary() {
    const real = rows.filter((r) => !r.simulated);
    const diamonds = real.reduce((s, r) => s + r.diamonds, 0);
    const pct = giftConfig().meritSharePercent;
    const estThb = diamondsToThb(diamonds);
    return {
      entries: real.length,
      simulatedEntries: rows.length - real.length,
      diamonds,
      estimatedThb: Math.round(estThb),
      meritSharePercent: pct,
      meritPledgeThb: Math.round((estThb * pct) / 100),
    };
  },
  recent: (n = 30) => rows.slice(-n).reverse(),
  csv() {
    const head = 'time,user,gift,count,diamonds,tier,simulated';
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [new Date(r.ts).toISOString(), esc(r.user), esc(r.gift), r.count, r.diamonds, r.tier, r.simulated].join(',')
    );
    return '\uFEFF' + [head, ...lines].join('\n');
  },
  clearSimulated() {
    rows = rows.filter((r) => !r.simulated);
    scheduleSave();
  },
};

