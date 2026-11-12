import { Engine } from './engine.js';
import { GameSocket } from './core/net.js';
import { Hud } from './ui/hud.js';
import { mountDebugPanel } from './ui/debug-panel.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') === 'landscape' ? 'landscape' : 'portrait';
const debug = params.get('debug') === '1';

const FALLBACK_CONFIG = {
  mode: 'demo',
  meritSharePercent: 20,
  tiers: [
    { level: 0, name: 'กระทงใบตอง', label: 'ฟรี' },
    { level: 1, name: 'กระทงดอกไม้', label: '1+' },
    { level: 2, name: 'กระทงโคมลอย', label: '30+' },
    { level: 3, name: 'กระทงทองมงคล', label: '300+' },
    { level: 4, name: 'มหากระทงสวรรค์', label: '1,500+' },
  ],
};

async function loadConfig() {
  try {
    const r = await fetch('/api/public-config');
    return r.ok ? await r.json() : FALLBACK_CONFIG;
  } catch {
    return FALLBACK_CONFIG;
  }
}

/** ปรับขนาดเวทีให้พอดีหน้าต่างโดยคงสัดส่วน (OBS Browser Source ตั้ง 1080×1920 ได้ตรง ๆ) */
function fitStage(stage, W, H) {
  const apply = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  };
  addEventListener('resize', apply);
  apply();
}

async function boot() {
  const config = await loadConfig();
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('scene');
  document.body.classList.add(`mode-${mode}`);

  const hud = new Hud(document.getElementById('hud'), config);
  const engine = new Engine(canvas, mode, {
    onSpawn: (job) => hud.pushFeed(job),
    onRelease: (job, total) => {
      hud.setCount(total);
      hud.announce(job);
    },
  });
  stage.style.width = `${engine.L.W}px`;
  stage.style.height = `${engine.L.H}px`;
  fitStage(stage, engine.L.W, engine.L.H);

  try {
    await engine.char3D.init(stage);
  } catch (err) {
    console.warn('Cannot init 3D engine, using 2D fallback:', err);
  }

  engine.start();

  const socket = new GameSocket({
    onStatus: (s) => hud.setConnection(s),
    onMessage: (msg) => {
      if (msg.type === 'krathong') engine.enqueue(msg.data);
      else if (msg.type === 'clear') engine.clear();
      else if (msg.type === 'reload') location.reload();
    },
  });

  setInterval(() => {
    const s = engine.stats();
    socket.send('heartbeat', { fps: s.fps, queue: s.queue, active: s.active, mode, w: engine.L.W, h: engine.L.H });
  }, 3000);

  addEventListener('error', (e) => socket.send('client-error', { message: e.message, source: e.filename, line: e.lineno }));
  addEventListener('unhandledrejection', (e) => socket.send('client-error', { message: String(e.reason) }));

  if (debug) {
    mountDebugPanel(engine, config.tiers);
    // ?debug=1&seed=1,3,4 → ใส่งานทดสอบตอนเปิดหน้า (ไว้พรีวิวภาพ)
    (params.get('seed') || '').split(',').filter(Boolean).forEach((t, i) =>
      engine.enqueue({ id: `seed-${i}`, user: { id: `s${i}`, name: ['มะลิ', 'ต้นกล้า', 'ใบเตย'][i % 3] }, gender: i % 2 ? 'female' : 'male', tier: Number(t) })
    );
    // ?warp=8 → เดินเวลาล่วงหน้า 8 วินาที (ไว้พรีวิวภาพ)
    for (let i = 0, n = Number(params.get('warp') || 0) * 30; i < n; i++) engine.update(1 / 30);
  }
}

boot();
