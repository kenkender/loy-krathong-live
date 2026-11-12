import { WebSocketServer } from 'ws';
import { config } from '../config.js';
import { bus } from '../core/bus.js';
import { logger } from '../core/logger.js';

/**
 * WebSocket 2 ช่อง
 *  /ws/game  : หน้าเกม (รับ job, ส่ง heartbeat กลับมา)
 *  /ws/admin : หน้าควบคุม (รับ snapshot + log + event สด)
 */
export function createHub(server, getSnapshot) {
  const gameWss = new WebSocketServer({ noServer: true });
  const adminWss = new WebSocketServer({ noServer: true });
  const games = new Map(); // ws -> { id, connectedAt, heartbeat }
  let nextId = 1;

  const send = (ws, msg) => ws.readyState === 1 && ws.send(JSON.stringify(msg));
  const broadcast = (wss, msg) => wss.clients.forEach((c) => send(c, msg));

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/ws/game') {
      gameWss.handleUpgrade(req, socket, head, (ws) => gameWss.emit('connection', ws, req));
    } else if (url.pathname === '/ws/admin') {
      if (config.adminToken && url.searchParams.get('token') !== config.adminToken) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        return socket.destroy();
      }
      adminWss.handleUpgrade(req, socket, head, (ws) => adminWss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  gameWss.on('connection', (ws) => {
    const info = { id: nextId++, connectedAt: Date.now(), heartbeat: null, lastBeatAt: 0 };
    games.set(ws, info);
    logger.info('hub', `หน้าเกมเชื่อมต่อ #${info.id}`);
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'heartbeat') {
          info.heartbeat = msg.data;
          info.lastBeatAt = Date.now();
        } else if (msg.type === 'client-error') {
          logger.error('game', msg.data?.message || 'client error', msg.data);
        }
      } catch { /* ignore malformed */ }
    });
    ws.on('close', () => {
      games.delete(ws);
      logger.warn('hub', `หน้าเกมหลุด #${info.id}`);
    });
  });

  adminWss.on('connection', (ws) => send(ws, { type: 'snapshot', data: getSnapshot() }));

  bus.on('job', (job) => broadcast(gameWss, { type: 'krathong', data: job }));
  bus.on('like', (l) => broadcast(gameWss, { type: 'like', data: l }));
  bus.on('event', (ev) => broadcast(adminWss, { type: 'event', data: ev }));
  logger.on((entry) => broadcast(adminWss, { type: 'log', data: entry }));

  setInterval(() => broadcast(adminWss, { type: 'snapshot', data: getSnapshot() }), 1000).unref();

  return {
    broadcastGame: (msg) => broadcast(gameWss, msg),
    gameClients: () => [...games.values()].map((g) => ({ id: g.id, connectedAt: g.connectedAt, lastBeatAt: g.lastBeatAt, ...g.heartbeat })),
  };
}

