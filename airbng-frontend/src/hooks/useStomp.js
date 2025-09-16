import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStompClient, onStomp } from '../utils/stompClient';

// 끊겨 있을 때 publish를 보관하는 큐 (메모리 한정)
const MAX_QUEUE = 200;

export default function useStomp() {
  const clientRef = useRef(getStompClient());

  // 활성 구독(재구독용 메타 저장)  id -> { dest, cb, headers, sub }
  const subsRef  = useRef(new Map());
  const subIdRef = useRef(0);

  // 송신 큐: 연결 안 됐을 때 publish를 적재 → 연결되면 즉시 flush
  // { dest, body, headers }
  const outboxRef = useRef([]);

  const [connected, setConnected] = useState(clientRef.current?.connected ?? false);
  const [status, setStatus] = useState(connected ? 'connected' : 'idle');

  const canPublish = () => !!clientRef.current && clientRef.current.connected;

  const flushOutbox = useCallback(() => {
    if (!canPublish() || outboxRef.current.length === 0) return;
    const c = clientRef.current;
    const items = outboxRef.current;
    outboxRef.current = []; // 먼저 비우고 보냄(중복 방지)
    for (const it of items) {
      try { c.publish({ destination: it.dest, body: it.body, headers: it.headers }); }
      catch (e) {
        // 실패 시 다시 큐 적재(최대치 유지)
        if (outboxRef.current.length < MAX_QUEUE) outboxRef.current.push(it);
      }
    }
  }, []);

  /* ---------- 연결 라이프사이클 ---------- */
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

      // 송신 큐 flush
      flushOutbox();
    };

    const handleDisconnect = () => {
      setConnected(false);
      setStatus('idle');
      // 구독 핸들만 제거(메타 유지). 다음 connect 때 재구독됨
      subsRef.current.forEach((entry) => { entry.sub = null; });
    };

    const handleError = () => {
      setConnected(false);
      setStatus('error');
    };

    const off1 = onStomp('connect', handleConnect);
    const off2 = onStomp('disconnect', handleDisconnect);
    const off3 = onStomp('error', handleError);

    if (!client.active) { setStatus('connecting'); client.activate(); }
    else if (client.connected) { handleConnect(); }

    return () => { off1(); off2(); off3(); };
  }, [flushOutbox]);

  // 토큰 변경 시 재연결 (옵션)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'accessToken' || e.key === 'jwtToken') {
        const client = clientRef.current;
        const token = e.newValue || '';
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        if (client.active) {
          try { client.deactivate().then(() => client.activate()); } catch {}
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

  /* ---------- 끈적 구독: 연결 전 호출해도/재연결돼도 유지 ---------- */
  const subscribe = useMemo(() => {
    return (destination, cb, headers = {}) => {
      const id = `${++subIdRef.current}`;
      const client = clientRef.current;

      const entry = { dest: destination, cb, headers, sub: null };
      subsRef.current.set(id, entry);

      const trySubscribe = () => {
        if (!entry.sub && client?.connected) {
          try { entry.sub = client.subscribe(destination, cb, headers); }
          catch (e) { console.warn('[STOMP subscribe failed]', destination, e); }
        }
      };

      // 연결되어 있으면 즉시, 아니면 다음 connect 때 자동
      trySubscribe();

      // unsubscribe 핸들
      return () => {
        try { entry.sub?.unsubscribe(); } catch {}
        subsRef.current.delete(id);
      };
    };
  }, []);

  /* ---------- publish: 끊겨 있으면 큐 적재, 연결되면 즉시 ---------- */
  const publish = useMemo(() => {
    return (destination, bodyObj, headers = {}) => {
      const client = clientRef.current;
      const body = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj ?? {});
      const baseHeaders = { 'content-type': 'application/json' };

      if (client && client.connected) {
        client.publish({ destination, body, headers: { ...baseHeaders, ...headers } });
        return true;
      }
      // 오프라인/미연결: 큐 적재 → onConnect/online/focus 때 flush
      if (outboxRef.current.length < MAX_QUEUE) {
        outboxRef.current.push({ dest: destination, body, headers: { ...baseHeaders, ...headers } });
      } else {
        // 큐가 가득차면 가장 오래된 것 버리고 적재
        outboxRef.current.shift();
        outboxRef.current.push({ dest: destination, body, headers: { ...baseHeaders, ...headers } });
      }
      return false;
    };
  }, []);

  const flush = useCallback(() => flushOutbox(), [flushOutbox]);

  return { client: clientRef.current, connected, status, subscribe, publish, flush };
}
