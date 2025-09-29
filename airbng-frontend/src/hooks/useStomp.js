import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStompClient, onStomp } from '../utils/stompClient';
import { getAccessToken } from '../utils/jwtUtil'; // ← 토큰 읽기

const MAX_QUEUE = 200;
const RECONNECT_MS = 5000;

export default function useStomp() {
  const clientRef = useRef(getStompClient());

  // 재구독 메타
  const subsRef  = useRef(new Map());
  const subIdRef = useRef(0);

  // 끊겼을 때 송신 큐
  const outboxRef = useRef([]);

  const [connected, setConnected] = useState(clientRef.current?.connected ?? false);
  const [status, setStatus] = useState(connected ? 'connected' : 'idle');

  const canPublish = () => !!clientRef.current && clientRef.current.connected;

  const flushOutbox = useCallback(() => {
    if (!canPublish() || outboxRef.current.length === 0) return;
    const c = clientRef.current;
    const items = outboxRef.current;
    outboxRef.current = [];
    for (const it of items) {
      try { c.publish({ destination: it.dest, body: it.body, headers: it.headers }); }
      catch (e) {
        if (outboxRef.current.length < MAX_QUEUE) outboxRef.current.push(it);
      }
    }
  }, []);

  // ---------- 연결 라이프사이클 ----------
  useEffect(() => {
    const client = clientRef.current;

    const handleConnect = () => {
      setConnected(true);
      setStatus('connected');

      // 재구독
      subsRef.current.forEach((entry) => {
        if (!entry.sub && client.connected) {
          try { entry.sub = client.subscribe(entry.dest, entry.cb, entry.headers); }
          catch (e) { console.warn('[STOMP resubscribe failed]', entry.dest, e); }
        }
      });

      flushOutbox();
    };

    const handleDisconnect = () => {
      setConnected(false);
      setStatus('idle');
      subsRef.current.forEach((entry) => { entry.sub = null; });
    };

    const handleError = (frameOrEv) => {
      const msg =
        (frameOrEv && frameOrEv.headers && (frameOrEv.headers.message || frameOrEv.headers['message'])) ||
        (frameOrEv && frameOrEv.body) ||
        (frameOrEv && frameOrEv.reason) ||
        '';
      const lower = (msg || '').toString().toLowerCase();

      if (lower.includes('unauthorized') || lower.includes('401')) {
        // 인증 거절: 재연결 끄고 종료
        client.reconnectDelay = 0;
        try { client.deactivate(); } catch {}
        setStatus('unauthorized');
        setConnected(false);
        return;
      }

      setConnected(false);
      setStatus('error');
    };

    const off1 = onStomp('connect', handleConnect);
    const off2 = onStomp('disconnect', handleDisconnect);
    const off3 = onStomp('error', handleError);

    // ★ 토큰 여부로 activate 여부 결정
    const token = getAccessToken();
    if (!token) {
      client.reconnectDelay = 0;            // 재연결 OFF
      if (client.active) { try { client.deactivate(); } catch {} }
      setStatus('unauthenticated');
    } else {
      client.reconnectDelay = RECONNECT_MS; // 재연결 ON
      if (!client.active) { setStatus('connecting'); client.activate(); }
      else if (client.connected) { handleConnect(); }
    }

    return () => { off1(); off2(); off3(); };
  }, [flushOutbox]);

  // 토큰 변경(다른 탭 포함) 시 재연결/해제
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'accessToken' || e.key === 'jwtToken') {
        const client = clientRef.current;
        const token = e.newValue || '';
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        if (!token) {
          client.reconnectDelay = 0;
          try { client.deactivate(); } catch {}
          setStatus('unauthenticated');
          setConnected(false);
        } else {
          client.reconnectDelay = RECONNECT_MS;
          if (client.active) {
            client.deactivate().then(() => client.activate());
          } else {
            client.activate();
          }
        }
      }
    };
    window.addEventListener('storage', onStorage);

    // 단일 탭 내 상태 변화 알림(선택): auth 모듈에서 dispatch(new Event('auth-changed'))
    const onAuthChanged = () => {
      const client = clientRef.current;
      const token = getAccessToken() || '';
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      if (!token) {
        client.reconnectDelay = 0;
        try { client.deactivate(); } catch {}
        setStatus('unauthenticated');
        setConnected(false);
      } else {
        client.reconnectDelay = RECONNECT_MS;
        if (client.active) client.deactivate().then(() => client.activate());
        else client.activate();
      }
    };
    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  // 온라인/포커스/가시성 복귀 시 송신 큐 재시도
  useEffect(() => {
    const tryFlush = () => flushOutbox();
    const onVis = () => { if (document.visibilityState === 'visible') tryFlush(); };
    window.addEventListener('online', tryFlush);
    window.addEventListener('focus', tryFlush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('online', tryFlush);
      window.removeEventListener('focus', tryFlush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [flushOutbox]);

  // 끈적 구독
  const subscribe = useMemo(() => {
    return (destination, cb, headers = {}) => {
      const id = `${++subIdRef.current}`;
      const client = clientRef.current;

      const entry = { dest: destination, cb, headers, sub: null };
      subsRef.current.set(id, entry);

      const trySubscribe = () => {
        if (!entry.sub && client && client.connected) {
          try { entry.sub = client.subscribe(destination, cb, headers); }
          catch (e) { console.warn('[STOMP subscribe failed]', destination, e); }
        }
      };

      trySubscribe();

      return () => {
        try { entry.sub && entry.sub.unsubscribe && entry.sub.unsubscribe(); } catch {}
        subsRef.current.delete(id);
      };
    };
  }, []);

  // publish: 미연결이면 큐 적재
  const publish = useMemo(() => {
    return (destination, bodyObj, headers = {}) => {
      const client = clientRef.current;
      const body = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj || {});
      const baseHeaders = { 'content-type': 'application/json' };

      if (client && client.connected) {
        client.publish({ destination, body, headers: { ...baseHeaders, ...headers } });
        return true;
      }
      if (outboxRef.current.length < MAX_QUEUE) {
        outboxRef.current.push({ dest: destination, body, headers: { ...baseHeaders, ...headers } });
      } else {
        outboxRef.current.shift();
        outboxRef.current.push({ dest: destination, body, headers: { ...baseHeaders, ...headers } });
      }
      return false;
    };
  }, []);

  const flush = useCallback(() => flushOutbox(), [flushOutbox]);

  return { client: clientRef.current, connected, status, subscribe, publish, flush };
}
