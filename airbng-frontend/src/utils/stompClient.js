import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from './jwtUtil';

let client;

export function getStompClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(process.env.REACT_APP_WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (s) => console.debug('[STOMP]', s),
    beforeConnect: () => {
      const t = getAccessToken();
      client.connectHeaders = t ? { Authorization: `Bearer ${t}` } : {};
    },
    onConnect: () => {
      console.log('[STOMP] connected');
      // 여기서 구독들 하면, 항상 인증된 상태로만 구독됨
      // client.subscribe('/topic/xxx', (msg)=>{...})
    },
  });

  return client;
}

// 토큰 갱신 시 (로그인/리프레시)
export async function updateStompToken(newToken) {
  const c = getStompClient();
  c.connectHeaders = newToken ? { Authorization: `Bearer ${newToken}` } : {};
  if (c.active) {
    await c.deactivate();
    c.activate();
  }
}
