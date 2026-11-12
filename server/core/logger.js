import { EventEmitter } from 'node:events';

const MAX = 500;
const ring = [];
const emitter = new EventEmitter();
let seq = 0;

function write(level, scope, message, meta) {
  const entry = { id: ++seq, ts: Date.now(), level, scope, message, meta };
  ring.push(entry);
  if (ring.length > MAX) ring.shift();
  emitter.emit('log', entry);
  const time = new Date(entry.ts).toLocaleTimeString('th-TH', { hour12: false });
  const line = `${time} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}`;
  (level === 'error' ? console.error : console.log)(line, meta ? JSON.stringify(meta) : '');
}

export const logger = {
  info: (scope, msg, meta) => write('info', scope, msg, meta),
  warn: (scope, msg, meta) => write('warn', scope, msg, meta),
  error: (scope, msg, meta) => write('error', scope, msg, meta),
  recent: (n = 100) => ring.slice(-n),
  on: (fn) => emitter.on('log', fn),
};

