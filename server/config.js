import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const num = (v, d) => (Number.isFinite(Number(v)) && v !== undefined && v !== '' ? Number(v) : d);

export const config = {
  root,
  publicDir: path.join(root, 'public'),
  dataDir: path.join(root, 'data'),
  host: process.env.HOST || '127.0.0.1',
  port: num(process.env.PORT, 3030),
  /** ถ้าตั้งค่า จะต้องแนบ token ในทุกการเรียก /api/admin และ /ws/admin */
  adminToken: process.env.ADMIN_TOKEN || '',
  /** demo | live */
  mode: process.env.MODE === 'live' ? 'live' : 'demo',
  tiktokUsername: (process.env.TIKTOK_USERNAME || '').replace(/^@/, ''),
  demo: {
    autoplay: process.env.DEMO_AUTOPLAY !== 'false',
    intervalMs: num(process.env.DEMO_INTERVAL_MS, 6000),
  },
  health: {
    evaluateEveryMs: 2000,
    gameHeartbeatStaleMs: 10000,
    liveSilenceWarnMs: 120000,
    lowFps: 20,
    heapWarnRatio: 0.85,
  },
  giftsFile: path.join(root, 'config', 'gifts.json'),
  gifts: JSON.parse(fs.readFileSync(path.join(root, 'config', 'gifts.json'), 'utf8')),
};

