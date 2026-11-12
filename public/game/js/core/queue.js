/**
 * คิวงานลอยกระทง: ระดับสูงกว่าได้ก่อน แต่รายการที่รอนานจะถูกดันขึ้นเพื่อความยุติธรรม
 */
const MAX_QUEUE = 60;
const STARVE_MS = 20000;

export class JobQueue {
  constructor() {
    this.items = [];
  }

  get length() {
    return this.items.length;
  }

  push(job) {
    job.queuedAt = performance.now();
    this.items.push(job);
    if (this.items.length > MAX_QUEUE) {
      // ตัดรายการฟรีที่เก่าที่สุดก่อน
      const i = this.items.findIndex((j) => j.tier === 0);
      this.items.splice(i === -1 ? 0 : i, 1);
    }
  }

  next() {
    if (!this.items.length) return null;
    const now = performance.now();
    let best = 0;
    let bestScore = -1;
    this.items.forEach((j, i) => {
      const waited = now - j.queuedAt;
      const score = (waited > STARVE_MS ? 100 : 0) + j.tier * 10 + Math.min(waited / 1000, 9);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return this.items.splice(best, 1)[0];
  }

  clear() {
    this.items.length = 0;
  }
}

