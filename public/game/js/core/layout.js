/**
 * กำหนดตำแหน่งองค์ประกอบของฉากทั้งหมดจากขนาดแคนวาส
 * portrait = 1080×1920 (TikTok แนวตั้ง) | landscape = 1920×1080
 */
export function createLayout(mode) {
  const portrait = mode !== 'landscape';
  const W = portrait ? 1080 : 1920;
  const H = portrait ? 1920 : 1080;
  const unit = Math.min(W, H) / 1080;

  const walkY = H * (portrait ? 0.605 : 0.64);
  return {
    mode: portrait ? 'portrait' : 'landscape',
    W,
    H,
    unit,
    landTop: H * (portrait ? 0.40 : 0.38),
    walkY, // เส้นที่ตัวละครยืน (ขอบท่าน้ำ)
    deckTop: walkY - 26 * unit,
    deckBottom: walkY + 22 * unit,
    waterTop: walkY + 22 * unit,
    moon: { x: W * (portrait ? 0.74 : 0.78), y: H * (portrait ? 0.17 : 0.2), r: 92 * unit },
    charScale: 1.18 * unit,
    // จุดยืนไหว้/ปล่อยกระทง (สูงสุด 3 คนพร้อมกัน)
    slots: portrait ? [0.2, 0.44, 0.68].map((r) => r * W) : [0.18, 0.4, 0.62].map((r) => r * W),
    lanes: [0.0, 0.055, 0.11].map((o) => walkY + (58 + o * H * 1.1) * unit),
    maxActive: 3,
  };
}

