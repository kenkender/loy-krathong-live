import { randomUUID } from 'node:crypto';

/** รูปแบบ event กลางที่ทุก source ต้องส่งออกมา */
export function makeEvent(type, user, extra = {}) {
  return {
    id: randomUUID(),
    ts: Date.now(),
    type, // gift | chat | like | follow | share
    user: { id: String(user.id ?? user.name), name: user.name || 'ผู้ชม' },
    ...extra,
  };
}

