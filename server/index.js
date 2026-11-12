import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { logger } from './core/logger.js';
import { metrics } from './core/metrics.js';
import { startPipeline } from './core/pipeline.js';
import { buildSnapshot, bindGameProvider } from './core/status.js';
import { sources } from './sources/manager.js';
import { createHub } from './net/hub.js';
import { createApi } from './net/api.js';

const app = express();
const server = http.createServer(app);

const hub = createHub(server, buildSnapshot);
bindGameProvider(hub.gameClients);

app.disable('x-powered-by');
app.use('/vendor/three', express.static(path.join(process.cwd(), 'node_modules/three')));
app.use('/api', createApi(hub));
app.get('/', (_req, res) => res.redirect('/game/'));
app.use(express.static(config.publicDir, { extensions: ['html'] }));

startPipeline();

process.on('unhandledRejection', (e) => {
  metrics.recordError();
  logger.error('process', 'unhandledRejection', { error: String(e?.message || e) });
});
process.on('uncaughtException', (e) => {
  metrics.recordError();
  logger.error('process', 'uncaughtException', { error: e.message });
});

server.listen(config.port, config.host, async () => {
  logger.info('server', `เริ่มทำงานที่ http://${config.host}:${config.port}`);
  logger.info('server', `หน้าเกม  : http://${config.host}:${config.port}/game/`);
  logger.info('server', `หน้า Admin: http://${config.host}:${config.port}/admin/`);
  await sources.start();
});

const shutdown = async () => {
  logger.info('server', 'กำลังปิดระบบ');
  await sources.source?.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

