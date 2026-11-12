/** WebSocket ฝั่งหน้าเกม: เชื่อมต่อใหม่อัตโนมัติ + ส่ง heartbeat */
export class GameSocket {
  constructor({ onMessage, onStatus }) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.ws = null;
    this.retry = 0;
    this.#open();
  }

  #open() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}/ws/game`);
    this.ws.onopen = () => {
      this.retry = 0;
      this.onStatus('online');
    };
    this.ws.onmessage = (e) => {
      try {
        this.onMessage(JSON.parse(e.data));
      } catch (err) {
        this.send('client-error', { message: `parse: ${err.message}` });
      }
    };
    this.ws.onclose = () => {
      this.onStatus('offline');
      const delay = Math.min(10000, 1000 * 2 ** this.retry++);
      setTimeout(() => this.#open(), delay);
    };
    this.ws.onerror = () => this.ws.close();
  }

  send(type, data) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ type, data }));
  }
}

