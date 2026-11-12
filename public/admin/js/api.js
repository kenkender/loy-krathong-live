const params = new URLSearchParams(location.search);
if (params.get('token')) localStorage.setItem('adminToken', params.get('token'));
export const token = () => localStorage.getItem('adminToken') || '';

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-admin-token': token() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/** เชื่อม WebSocket ของแอดมิน เชื่อมใหม่เองเมื่อหลุด */
export function connectAdmin(onMessage, onStatus) {
  let retry = 0;
  const open = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/admin?token=${encodeURIComponent(token())}`);
    ws.onopen = () => {
      retry = 0;
      onStatus(true);
    };
    ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    ws.onclose = () => {
      onStatus(false);
      setTimeout(open, Math.min(8000, 1000 * 2 ** retry++));
    };
  };
  open();
}

