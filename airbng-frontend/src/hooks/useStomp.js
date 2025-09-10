import { useEffect, useMemo, useRef, useState } from 'react';
import { getStompClient } from '../utils/stompClient';

export default function useStomp() {
  const clientRef = useRef(getStompClient());
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error

  // 1) 연결 라이프사이클 관리
  useEffect(() => {
    const client = clientRef.current;

    const onConnect = () => { setConnected(true); setStatus('connected'); };
    const onError = (frame) => { 
      console.warn('[STOMP ERROR]', frame);
      setConnected(false); 
      setStatus('error');
    };
    const onClose = () => { setConnected(false); setStatus('idle'); };

    client.onConnect = onConnect;
    client.onStompError = onError;
    client.onWebSocketClose = onClose;

    if (!client.active) { setStatus('connecting'); client.activate(); }

    // cleanup는 비활성화하지 않음(앱 전역 싱글톤)
    return () => {
      // no deactivate — 여러 컴포넌트가 공유하므로 유지
    };
  }, []);

  // 2) 토큰 변경 시 재연결(선택)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'jwtToken') {
        const client = clientRef.current;
        const token = e.newValue;
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        if (client.active) {
          // 강제 재연결
          try { client.deactivate().then(() => client.activate()); }
          catch { /* noop */ }
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 3) 구독 헬퍼 (unsubscribe 반환)
  const subscribe = useMemo(() => {
    return (destination, cb, headers = {}) => {
      const client = clientRef.current;
      if (!client || !client.connected) return () => {};
      const sub = client.subscribe(destination, cb, headers);
      return () => { try { sub?.unsubscribe(); } catch { /* noop */ } };
    };
  }, []);

  // 4) publish 헬퍼
  const publish = useMemo(() => {
    return (destination, bodyObj, headers = {}) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      client.publish({
        destination,
        body: typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj),
        headers,
      });
    };
  }, []);

  return { client: clientRef.current, connected, status, subscribe, publish };
}