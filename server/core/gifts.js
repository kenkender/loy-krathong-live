import fs from 'node:fs';
import { config } from '../config.js';

let cfg = config.gifts;

export function reloadGifts() {
  cfg = JSON.parse(fs.readFileSync(config.giftsFile, 'utf8'));
  return cfg;
}

export const giftConfig = () => cfg;

/** แปลงมูลค่าเพชรรวมเป็นระดับกระทง (เลือกระดับสูงสุดที่ถึงเกณฑ์) */
export function resolveTier(diamonds) {
  let picked = cfg.tiers[0];
  for (const t of cfg.tiers) if (diamonds >= t.minDiamonds && diamonds > 0) picked = t;
  return picked;
}

/** ตรวจคำเลือกเพศจากข้อความคอมเมนต์ */
export function detectGender(text = '') {
  const s = text.toLowerCase();
  for (const [gender, words] of Object.entries(cfg.genderKeywords)) {
    if (words.some((w) => s.includes(w))) return gender;
  }
  return null;
}

export const diamondsToThb = (d) => d * cfg.estimatedThbPerDiamond;

