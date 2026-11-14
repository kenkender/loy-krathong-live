import { drawKrathong, KRATHONG_STYLES } from '../actors/krathong-art.js';

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function tierIcon(level) {
  const c = document.createElement('canvas');
  c.width = 132;
  c.height = 110;
  const ctx = c.getContext('2d');
  const s = KRATHONG_STYLES[level];
  const k = 0.5 / Math.max(0.8, s.size * 0.62);
  ctx.translate(66, 88);
  ctx.scale(k, k);
  drawKrathong(ctx, level, 0.6, 3);
  return c;
}

/** ส่วนแสดงผลที่เป็น DOM ทับบนแคนวาส (ข้อความคมชัด แก้สไตล์ใน game.css) */
export class Hud {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.#build();
  }

  #build() {
    const { tiers, meritSharePercent } = this.config;

    this.brandEl = el('div', 'brand', '<span class="brand-dot"></span>ประเพณีลอยกระทง');
    this.titleEl = el('h1', 'title', 'ลอยกระทง<span>ขอขมาพระแม่คงคา</span>');
    this.subtitleEl = el('p', 'subtitle', 'ร่วมลอยกระทงด้วยกัน ทุกใบคือความตั้งใจดี');

    this.root.append(
      (() => {
        const h = el('header', 'hud-head');
        h.append(this.brandEl, this.titleEl, this.subtitleEl);
        return h;
      })()
    );

    this.howEl = el('section', 'howto');
    this.howEl.innerHTML = `
      <div class="how-row"><b>1</b><span>พิมพ์ข้อความทักทายในคอมเมนต์เพื่อส่งตัวละครเข้าฉาก</span><i>ร่วมฟรี</i></div>
      <div class="how-row"><b>2</b><span>ส่งของขวัญเพื่ออัปเกรดระดับเอฟเฟกต์และท่าทางพิเศษตามระดับเพชร</span></div>
      <p class="pledge">ผู้จัดตั้งใจแบ่งรายได้ ${esc(meritSharePercent)}% ไปทำบุญ พร้อมเผยหลักฐานทุกครั้ง</p>`;
    this.root.append(this.howEl);

    const legend = el('section', 'legend');
    tiers.forEach((t) => {
      const chip = el('div', `chip t${t.level}`);
      chip.append(tierIcon(t.level), el('div', 'chip-name', esc(t.name)), el('div', 'chip-val', t.level === 0 ? 'ฟรี' : `${esc(t.label)} 💎`));
      legend.append(chip);
    });
    this.root.append(legend);

    this.counter = el('div', 'counter', '<small id="counterLabel">ผู้ร่วมกิจกรรม</small><strong>0</strong>');
    this.root.append(this.counter);

    this.feed = el('div', 'feed');
    this.root.append(this.feed);

    this.banner = el('div', 'banner');
    this.root.append(this.banner);

    this.status = el('div', 'conn-status', '');
    this.root.append(this.status);

    if (this.config?.scene) {
      this.updateScene(this.config.scene);
    }
  }

  setCount(n) {
    this.counter.querySelector('strong').textContent = n.toLocaleString('th-TH');
  }

  setConnection(state) {
    this.status.textContent = state === 'online' ? '' : 'กำลังเชื่อมต่อใหม่…';
    this.status.classList.toggle('show', state !== 'online');
  }

  updateScene(scene = {}) {
    if (scene.badgeText && this.brandEl) {
      this.brandEl.innerHTML = `<span class="brand-dot"></span>${esc(scene.badgeText)}`;
    }
    if (scene.title && this.titleEl) {
      const parts = String(scene.title).trim().split(/\s+/);
      if (parts.length > 1) {
        const first = parts.shift();
        this.titleEl.innerHTML = `${esc(first)}<span>${esc(parts.join(' '))}</span>`;
      } else {
        this.titleEl.innerHTML = `${esc(scene.title)}`;
      }
      document.title = `${scene.title} · Live`;
    }
    if (scene.subtitle !== undefined && this.subtitleEl) {
      this.subtitleEl.textContent = scene.subtitle;
    }
    if (scene.activityMode && this.counter) {
      const lbl = this.counter.querySelector('#counterLabel');
      if (lbl) {
        lbl.textContent =
          scene.activityMode === 'temple-blessing'
            ? 'ผู้ร่วมไหว้พระขอพร'
            : scene.activityMode === 'party-dance'
            ? 'ผู้ร่วมเต้นปาร์ตี้'
            : 'กระทงที่ลอยแล้ว';
      }
    }
  }

  /** รายชื่อผู้ร่วมล่าสุด */
  pushFeed(job) {
    const tier = this.config.tiers[job.tier];
    const row = el('div', `feed-row t${job.tier}`, `<span class="feed-name">${esc(job.user.name)}</span><span class="feed-what">${esc(tier.name)}</span>`);
    this.feed.prepend(row);
    while (this.feed.children.length > 4) this.feed.lastChild.remove();
    setTimeout(() => row.classList.add('old'), 9000);
  }

  /** แบนเนอร์ประกาศสำหรับกระทงระดับสูง */
  announce(job) {
    if (job.tier < 2) return;
    const tier = this.config.tiers[job.tier];
    const n = el('div', `banner-card t${job.tier}`, `<small>${esc(tier.name)}</small><strong>${esc(job.user.name)}</strong><span>ได้ร่วมลอยกระทงแล้ว อนุโมทนาบุญ 🙏</span>`);
    this.banner.replaceChildren(n);
    setTimeout(() => n.classList.add('out'), job.tier >= 4 ? 5200 : 3600);
    setTimeout(() => n.remove(), job.tier >= 4 ? 5800 : 4200);
  }
}

