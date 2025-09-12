import { useEffect, useMemo, useRef, useState } from 'react';
import { getStompClient, onStomp } from '../utils/stompClient';

export default function useStomp() {
  const clientRef = useRef(getStompClient());

  // 활성 구독(재구독용 메타 저장)
  // id -> { dest, cb, headers, sub }
  const subsRef = useRef(new Map());
  const subIdRef = useRef(0);

  const [connected, setConnected] = useState(clientRef.current?.connected ?? false);
  const [status, setStatus] = useState(connected ? 'connected' : 'idle');

  // 연결 라이프사이클
  useEffect(() => {
    const client = clientRef.current;

    const handleConnect = () => {
      setConnected(true);
      setStatus('connected');
      // 재연결 시 모든 "대기중" 구독 재구독
      subsRef.current.forEach((entry) => {
        if (!entry.sub && client.connected) {
          try { entry.sub = client.subscribe(entry.dest, entry.cb, entry.headers); }
          catch (e) { console.warn('[STOMP resubscribe failed]', entry.dest, e); }
        }
      });
    };
    const handleDisconnect = () => {
      setConnected(false);
      setStatus('idle');
      // 연결 끊기면 핸들만 버리고(메타 유지) 다음 connect 때 재구독
      subsRef.current.forEach((entry) => { entry.sub = null; });
    };
    const handleError = () => { setConnected(false); setStatus('error'); };

    const off1 = onStomp('connect', handleConnect);
    const off2 = onStomp('disconnect', handleDisconnect);
    const off3 = onStomp('error', handleError);

    if (!client.active) { setStatus('connecting'); client.activate(); }
    else if (client.connected) { handleConnect(); }

    return () => { off1(); off2(); off3(); };
  }, []);

  // 토큰 변경 시 재연결 (선택)
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

  // 끈적 구독: 연결 전 호출해도, 재연결돼도, 항상 살아있게
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

  const publish = useMemo(() => {
    return (destination, bodyObj, headers = {}) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      const baseHeaders = { 'content-type': 'application/json' };
      client.publish({
        destination,
        body: typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj),
        headers: { ...baseHeaders, ...headers },
      });
    };
  }, []);

  return { client: clientRef.current, connected, status, subscribe, publish };
}