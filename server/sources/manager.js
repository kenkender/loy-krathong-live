import { bus } from '../core/bus.js';
import { logger } from '../core/logger.js';
import { config } from '../config.js';
import { DemoSource } from './demo-source.js';
import { TikTokSource } from './tiktok-source.js';

/** สลับโหมด demo/live และเก็บสถานะของตัวเชื่อมต่อปัจจุบัน */
class SourceManager {
  constructor() {
    this.mode = config.mode;
    this.username = config.tiktokUsername;
    this.source = null;
    this.state = { status: 'idle', detail: '', since: Date.now(), attempts: 0 };
    bus.on('source', (s) => {
      this.state = { ...this.state, ...s, since: s.status !== this.state.status ? Date.now() : this.state.since };
      logger.info('source', `${this.mode} → ${s.status}`, { detail: s.detail });
    });
  }

  async start() {
    await this.source?.stop();
    this.source =
      this.mode === 'live'
        ? new TikTokSource({ username: this.username })
        : new DemoSource(config.demo);
    await this.source.start();
  }

  async switchMode(mode, username) {
    this.mode = mode === 'live' ? 'live' : 'demo';
    if (username !== undefined) this.username = String(username).replace(/^@/, '').trim();
    await this.start();
  }

  snapshot() {
    return {
      mode: this.mode,
      username: this.username,
      ...this.state,
      autoplay: this.source?.autoplay ?? false,
    };
  }
}

export const sources = new SourceManager();

