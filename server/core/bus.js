import { EventEmitter } from 'node:events';

/**
 * บัสกลางของระบบ
 *  - 'event'  : เหตุการณ์จาก TikTok / โหมดเดโม (ถูก normalize แล้ว)
 *  - 'source' : การเปลี่ยนสถานะของตัวเชื่อมต่อ
 *  - 'job'    : งานลอยกระทงที่ส่งให้หน้าเกม
 */
export const bus = new EventEmitter();
bus.setMaxListeners(50);

