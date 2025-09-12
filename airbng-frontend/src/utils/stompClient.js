import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from './jwtUtil';

let client;

// simple event bus
const listeners = {
  connect: new Set(),
  disconnect: new Set(),
  error: new Set(),
};

function emit(type, payload) {
  listeners[type]?.forEach(fn => { try { fn(payload); } catch {} });
}

export function onStomp(type, fn) {
  listeners[type]?.add(fn);
  return () => listeners[type]?.delete(fn);
}

export function getStompClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(process.env.REACT_APP_WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (s) => console.debug('[STOMP]', s),
    connectHeaders: (() => {
      const t = getAccessToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    })(),
    beforeConnect: () => {
      const t = getAccessToken();
      client.connectHeaders = t ? { Authorization: `Bearer ${t}` } : {};
    },
    onConnected: (frame) => {
      console.log('[STOMP] connected');
      emit('connect', frame);
    },
    onStompError: (frame) => {
      console.warn('[STOMP] error', frame);
      emit('error', frame);
    },
    onWebSocketClose: () => {
      emit('disconnect');
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
