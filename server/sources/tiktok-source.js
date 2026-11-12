import { bus } from '../core/bus.js';
import { logger } from '../core/logger.js';
import { makeEvent } from './event.js';

const MAX_BACKOFF_MS = 60_000;

const userOf = (d = {}) => {
  const u = d.user || d;
  return {
    id: u.userId ?? u.uniqueId ?? u.nickname,
    name: u.nickname || u.uniqueId || 'ผู้ชม',
  };
};

/**
 * ตัวเชื่อมต่อ TikTok Live (ไลบรารีไม่เป็นทางการ tiktok-live-connector v2)
 * - เชื่อมต่อใหม่อัตโนมัติด้วย exponential backoff
 * - แปลง event เป็นรูปแบบกลาง
 * - ของขวัญแบบสะสม (streak) จะนับเมื่อ streak จบเท่านั้น เพื่อไม่ให้นับซ้ำ
 */
export class TikTokSource {
  constructor({ username }) {
    this.name = 'tiktok';
    this.username = username;
    this.conn = null;
    this.attempts = 0;
    this.stopped = false;
    this.retryTimer = null;
  }

  async start() {
    this.stopped = false;
    if (!this.username) {
      bus.emit('source', { status: 'error', detail: 'ยังไม่ได้ตั้งค่า TikTok username' });
      return;
    }
    await this.#connect();
  }

  async #connect() {
    bus.emit('source', { status: this.attempts ? 'reconnecting' : 'connecting', detail: `@${this.username}`, attempts: this.attempts });
    let lib;
    try {
      lib = await import('tiktok-live-connector');
    } catch (e) {
      bus.emit('source', { status: 'error', detail: `โหลดไลบรารีไม่สำเร็จ: ${e.message}` });
      return;
    }
    const { TikTokLiveConnection, WebcastEvent, ControlEvent } = lib;
    const conn = new TikTokLiveConnection(this.username);
    this.conn = conn;

    conn.on(ControlEvent.CONNECTED, (state) => {
      this.attempts = 0;
      bus.emit('source', { status: 'connected', detail: `@${this.username} · room ${state?.roomId ?? '-'}` });
    });
    conn.on(ControlEvent.DISCONNECTED, () => this.#scheduleRetry('หลุดการเชื่อมต่อ'));
    conn.on(ControlEvent.ERROR, (err) => {
      logger.warn('tiktok', 'connector error', { error: String(err?.message || err) });
    });
    conn.on(WebcastEvent.STREAM_END, () => bus.emit('source', { status: 'error', detail: 'ไลฟ์จบแล้ว' }));

    conn.on(WebcastEvent.CHAT, (d) => bus.emit('event', makeEvent('chat', userOf(d), { text: d.comment || '' })));
    conn.on(WebcastEvent.LIKE, (d) => bus.emit('event', makeEvent('like', userOf(d), { count: d.likeCount || 1 })));
    conn.on(WebcastEvent.FOLLOW, (d) => bus.emit('event', makeEvent('follow', userOf(d))));
    conn.on(WebcastEvent.SHARE, (d) => bus.emit('event', makeEvent('share', userOf(d))));
    conn.on(WebcastEvent.GIFT, (d) => {
      const g = d.giftDetails || {};
      const streakable = g.giftType === 1;
      if (streakable && d.repeatEnd === false) return; // ยังไม่จบ streak
      const count = d.repeatCount || 1;
      const unit = g.diamondCount ?? d.diamondCount ?? 0;
      bus.emit('event', makeEvent('gift', userOf(d), { giftName: g.giftName || 'Gift', diamonds: unit * count, count }));
    });

    try {
      await conn.connect();
    } catch (e) {
      logger.warn('tiktok', 'เชื่อมต่อไม่สำเร็จ', { error: String(e?.message || e) });
      this.#scheduleRetry(`เชื่อมต่อไม่สำเร็จ: ${String(e?.message || e).slice(0, 120)}`);
    }
  }

  #scheduleRetry(reason) {
    if (this.stopped || this.retryTimer) return;
    this.attempts++;
    const delay = Math.min(MAX_BACKOFF_MS, 2000 * 2 ** Math.min(this.attempts, 5));
    bus.emit('source', { status: 'reconnecting', detail: `${reason} · ลองใหม่ใน ${Math.round(delay / 1000)} วินาที`, attempts: this.attempts });
    this.#teardown();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.stopped) this.#connect();
    }, delay);
  }

  #teardown() {
    try {
      this.conn?.removeAllListeners?.();
      this.conn?.disconnect?.();
    } catch { /* ignore */ }
    this.conn = null;
  }

  async stop() {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.#teardown();
  }
}

