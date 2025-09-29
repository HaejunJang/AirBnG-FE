import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from './jwtUtil';

let client;

// 간단 이벤트 버스
const listeners = {
  connect: new Set(),
  disconnect: new Set(),
  error: new Set(),
};

function emit(type, payload) {
  if (!listeners[type]) return;
  listeners[type].forEach(fn => { try { fn(payload); } catch {} });
}

export function onStomp(type, fn) {
  if (!listeners[type]) throw new Error('Unknown STOMP event: ' + type);
  listeners[type].add(fn);
  return () => listeners[type].delete(fn);
}

export function getStompClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(process.env.REACT_APP_WS_URL),
    reconnectDelay: 5000,       // 기본값 (useStomp에서 토큰 없으면 0으로 바꿈)
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // debug: (s) => console.debug('[STOMP]', s),
    connectHeaders: (() => {
      const t = getAccessToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    })(),
    beforeConnect: () => {
      const t = getAccessToken();
      client.connectHeaders = t ? { Authorization: `Bearer ${t}` } : {};
      // 여기서 예외 던지지 않음: 루프 방지
    },
    onConnect: (frame) => { emit('connect', frame); },
    onStompError: (frame) => { console.warn('[STOMP] error', frame); emit('error', frame); },
    onWebSocketError: (ev) => { console.warn('[STOMP] ws error', ev); emit('error', ev); },
    onWebSocketClose: () => { emit('disconnect'); },
    onDisconnect: (frame) => { emit('disconnect', frame); },
  });

  return client;
}

// 로그인/리프레시/로그아웃 시 호출
export async function updateStompToken(newToken) {
  const c = getStompClient();
  c.connectHeaders = newToken ? { Authorization: `Bearer ${newToken}` } : {};
  if (!newToken) {
    // 로그아웃: 재연결 끄고 즉시 종료
    c.reconnectDelay = 0;
    if (c.active) await c.deactivate();
    return;
  }
  // 로그인/재로그인
  c.reconnectDelay = 5000;
  if (c.active) await c.deactivate();
  c.activate();
}
