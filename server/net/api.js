import express from 'express';
import { config } from '../config.js';
import { sources } from '../sources/manager.js';
import { ledger } from '../core/ledger.js';
import { logger } from '../core/logger.js';
import { metrics } from '../core/metrics.js';
import { giftConfig, reloadGifts } from '../core/gifts.js';
import { buildSnapshot } from '../core/status.js';

export function createApi(hub) {
  const router = express.Router();
  router.use(express.json({ limit: '10kb' }));

  /** ข้อมูลสาธารณะสำหรับหน้าเกม (ไม่มีข้อมูลละเอียดอ่อน) */
  router.get('/public-config', (_req, res) => {
    const g = giftConfig();
    res.json({ mode: sources.mode, tiers: g.tiers, meritSharePercent: g.meritSharePercent, freeCooldownSec: g.freeCooldownSec });
  });

  router.get('/health', (_req, res) => {
    const s = buildSnapshot();
    res.status(s.overall === 'fail' ? 503 : 200).json({ overall: s.overall, components: s.components });
  });

  const admin = express.Router();
  admin.use((req, res, next) => {
    if (!config.adminToken) return next();
    const t = req.get('x-admin-token') || req.query.token;
    return t === config.adminToken ? next() : res.status(401).json({ error: 'unauthorized' });
  });

  admin.get('/status', (_req, res) => res.json(buildSnapshot()));
  admin.get('/logs', (req, res) => res.json(logger.recent(Math.min(Number(req.query.n) || 100, 500))));
  admin.get('/ledger', (_req, res) => res.json({ summary: ledger.summary(), recent: ledger.recent(50) }));
  admin.get('/ledger.csv', (_req, res) => {
    res.type('text/csv; charset=utf-8').attachment('ledger.csv').send(ledger.csv());
  });

  admin.post('/mode', async (req, res) => {
    const { mode, username } = req.body || {};
    if (!['demo', 'live'].includes(mode)) return res.status(400).json({ error: 'mode ต้องเป็น demo หรือ live' });
    if (mode === 'live' && !(username || sources.username)) return res.status(400).json({ error: 'โหมด live ต้องระบุ TikTok username' });
    await sources.switchMode(mode, username);
    res.json({ ok: true, source: sources.snapshot() });
  });

  admin.post('/demo/autoplay', (req, res) => {
    if (sources.mode !== 'demo') return res.status(409).json({ error: 'ใช้ได้เฉพาะโหมดเดโม' });
    const { on, intervalMs } = req.body || {};
    sources.source.setAutoplay(!!on, Number(intervalMs) || undefined);
    res.json({ ok: true });
  });

  admin.post('/test', (req, res) => {
    if (sources.mode !== 'demo') return res.status(409).json({ error: 'ส่งข้อมูลทดสอบได้เฉพาะโหมดเดโม' });
    const { kind, user, gender, diamonds, giftName } = req.body || {};
    if (!['chat', 'gift', 'like'].includes(kind)) return res.status(400).json({ error: 'kind ไม่ถูกต้อง' });
    sources.source.inject({ kind, user: String(user || 'ผู้ทดสอบ').slice(0, 30), gender, diamonds: Math.max(0, Number(diamonds) || 0), giftName });
    res.json({ ok: true });
  });

  admin.post('/game/reload', (_req, res) => {
    hub.broadcastGame({ type: 'reload' });
    logger.info('admin', 'สั่งรีโหลดหน้าเกมทุกจอ');
    res.json({ ok: true });
  });

  admin.post('/game/clear', (_req, res) => {
    hub.broadcastGame({ type: 'clear' });
    logger.info('admin', 'สั่งล้างคิวและฉากในหน้าเกม');
    res.json({ ok: true });
  });

  admin.post('/config/reload', (_req, res) => {
    reloadGifts();
    logger.info('admin', 'โหลด config/gifts.json ใหม่');
    res.json({ ok: true });
  });

  admin.post('/reset-metrics', (_req, res) => {
    metrics.reset();
    ledger.clearSimulated();
    res.json({ ok: true });
  });

  router.use('/admin', admin);
  return router;
}

