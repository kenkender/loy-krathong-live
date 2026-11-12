import { config } from '../config.js';
import { sources } from '../sources/manager.js';
import { metrics } from './metrics.js';
import { ledger } from './ledger.js';
import { evaluate, health } from './health.js';
import { giftConfig } from './gifts.js';

let getGames = () => [];
export const bindGameProvider = (fn) => (getGames = fn);

/** ภาพรวมสถานะทั้งระบบ ใช้ทั้งใน /api/admin/status และ WebSocket */
export function buildSnapshot() {
  const source = sources.snapshot();
  const games = getGames();
  const m = metrics.snapshot();
  const { overall, components } = evaluate({ source, games, metricsSnap: m, mode: source.mode });
  const mem = process.memoryUsage();
  return {
    ts: Date.now(),
    overall,
    components,
    alerts: health.alerts().slice(0, 20),
    source,
    games,
    metrics: m,
    ledger: ledger.summary(),
    system: { rssMb: Math.round(mem.rss / 1048576), node: process.version, port: config.port },
    tiers: giftConfig().tiers,
  };
}

