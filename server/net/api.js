import express from 'express';
import { config } from '../config.js';
import { sources } from '../sources/manager.js';
import { ledger } from '../core/ledger.js';
import { logger } from '../core/logger.js';
import { metrics } from '../core/metrics.js';
import { giftConfig, reloadGifts } from '../core/gifts.js';
import { buildSnapshot } from '../core/status.js';
import { getSceneConfig, updateSceneConfig, listAvailableModels, saveModelBuffer, loadSceneConfig } from '../core/scene.js';

export function createApi(hub) {
  const router = express.Router();
  router.use(express.json({ limit: '50kb' }));

  /** ข้อมูลสาธารณะสำหรับหน้าเกม (ไม่มีข้อมูลละเอียดอ่อน) */
  router.get('/public-config', (_req, res) => {
    const g = giftConfig();
    res.json({
      mode: sources.mode,
      tiers: g.tiers,
      meritSharePercent: g.meritSharePercent,
      freeCooldownSec: g.freeCooldownSec,
      scene: getSceneConfig(),
      models: listAvailableModels(),
    });
  });

  router.get('/scene', (_req, res) => {
    res.json({ scene: getSceneConfig(), models: listAvailableModels() });
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
    const s = loadSceneConfig();
    hub.broadcastGame({ type: 'scene-update', data: s });
    logger.info('admin', 'โหลด config/gifts.json และ config/scene.json ใหม่');
    res.json({ ok: true, scene: s });
  });

  admin.get('/scene', (_req, res) => {
    res.json({ scene: getSceneConfig(), models: listAvailableModels() });
  });

  admin.post('/scene', (req, res) => {
    const updated = updateSceneConfig(req.body || {});
    hub.broadcastGame({ type: 'scene-update', data: updated });
    logger.info('admin', 'อัปเดตการตั้งค่าฉากและตัวละคร', { theme: updated.theme, female: updated.femaleModel, male: updated.maleModel });
    res.json({ ok: true, scene: updated, models: listAvailableModels() });
  });

  admin.post('/models/save', express.raw({ type: 'application/octet-stream', limit: '250mb' }), (req, res) => {
    try {
      const name = String(req.query.name || 'custom_model.glb');
      const role = String(req.query.role || '');
      const spawnNow = req.query.spawn === '1';
      if (!req.body || !req.body.length) {
        return res.status(400).json({ error: 'ไม่พบข้อมูลไฟล์ .glb' });
      }
      const saved = saveModelBuffer(name, req.body);
      const patch = {};
      if (!role || role === 'character') {
        patch.addCharacterUrl = saved.url;
      } else if (role === 'female') {
        patch.femaleModel = saved.url;
        patch.addCharacterUrl = saved.url;
      } else if (role === 'male') {
        patch.maleModel = saved.url;
        patch.addCharacterUrl = saved.url;
      } else if (role === 'leftProp') {
        patch.leftPropModel = saved.url;
      } else if (role === 'rightProp') {
        patch.rightPropModel = saved.url;
      }

      const updated = Object.keys(patch).length ? updateSceneConfig(patch) : getSceneConfig();
      hub.broadcastGame({ type: 'scene-update', data: updated });

      if (spawnNow && (!role || role === 'character' || role === 'female' || role === 'male')) {
        hub.broadcastGame({
          type: 'krathong',
          data: {
            id: `preview-${Date.now()}`,
            user: { id: 'admin', name: saved.name.replace(/\.glb$/i, '') },
            gender: role === 'male' ? 'male' : 'female',
            tier: 3,
            modelUrl: saved.url,
          },
        });
      }

      logger.info('admin', `บันทึกโมเดล ${saved.name} (${saved.sizeMB} MB) สำเร็จ`, { role });
      res.json({ ok: true, model: saved, scene: updated, models: listAvailableModels() });
    } catch (e) {
      logger.error('admin', 'บันทึกโมเดลไม่สำเร็จ', { error: e.message });
      res.status(500).json({ error: e.message });
    }
  });

  admin.post('/spawn', (req, res) => {
    const { user, gender, tier, modelUrl } = req.body || {};
    const job = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user: { id: 'admin-spawn', name: String(user || 'แขกกิตติมศักดิ์').slice(0, 30) },
      gender: gender === 'male' ? 'male' : 'female',
      tier: Math.min(4, Math.max(0, Number(tier) || 0)),
      modelUrl: modelUrl ? String(modelUrl) : undefined,
    };
    hub.broadcastGame({ type: 'krathong', data: job });
    logger.info('admin', `ปล่อยตัวละครเข้าฉาก: ${job.user.name} (${job.gender}, ระดับ ${job.tier})`);
    res.json({ ok: true, job });
  });

  admin.post('/spawn-wave', (req, res) => {
    const count = Math.min(25, Math.max(2, Number(req.body?.count) || 10));
    const names = [
      'ต้นกล้า', 'น้องมายด์', 'ใบบัว', 'ปลายฟ้า', 'มะลิ',
      'นุ่น', 'สุชาติ', 'แพรวา', 'เจ้าบุญ', 'ป้าสมศรี',
      'ตะวัน', 'ใบเตย', 'พิทักษ์', 'แก้วตา', 'กานดา'
    ];
    const models = listAvailableModels().filter(
      (m) => !/pagoda|mandapa|prop|temple|wat_/i.test(m.name)
    );
    for (let i = 0; i < count; i++) {
      const name = names[i % names.length];
      const model = models.length ? models[i % models.length] : null;
      const job = {
        id: `wave-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        user: { id: `wave-user-${i}`, name },
        gender: i % 2 === 0 ? 'female' : 'male',
        tier: (i % 4) + 1,
        modelUrl: model ? model.url : undefined,
      };
      hub.broadcastGame({ type: 'krathong', data: job });
    }
    logger.info('admin', `จำลองคนโดเนทเข้าฉากเป็นขบวนต่อแถว ${count} คน`);
    res.json({ ok: true, count });
  });

  admin.post('/fx', (req, res) => {
    const { kind } = req.body || {};
    hub.broadcastGame({ type: 'fx', data: { kind: String(kind || 'fireworks') } });
    logger.info('admin', `สั่งเอฟเฟกต์พิเศษ: ${kind}`);
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

