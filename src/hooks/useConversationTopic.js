import { useEffect, useRef } from 'react';
import useStomp from './useStomp';

function safeJSON(x) { try { return JSON.parse(x); } catch { return null; } }

export default function useConversationTopic(convId, onMessage) {
  const { connected, subscribe } = useStomp();

  // 최신 onMessage를 유지(의존성 없이도 최신 핸들 호출)
  const handlerRef = useRef(onMessage);
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  // convId 스냅샷(콜백 내부에서 안전 비교)
  const convIdRef = useRef(convId);
  useEffect(() => { convIdRef.current = convId; }, [convId]);

  // 중복 수신 방지 (msgId 또는 seq+sender 기준, TTL 청소)
  const seenRef = useRef(new Map()); // key -> ts
  const remember = (key, ttl = 30000) => {
    if (!key) return false;
    const now = Date.now();
    const had = seenRef.current.has(key);
    seenRef.current.set(key, now);
    // 가벼운 GC
    for (const [k, t] of seenRef.current) {
      if (now - t > ttl) seenRef.current.delete(k);
    }
    return had;
  };

  useEffect(() => {
    // 이전 구독들 정리용
    let unsubs = [];
    // 연결되었고 convId가 있어야만 구독
    if (!connected || !convId) return () => {};

    // 서버가 점/슬래시 어느 포맷을 쓰든 대응
    const topics = [
      `/topic/conversations.${convId}`,
      `/topic/conversations/${convId}`,
    ];

    topics.forEach((dest) => {
      try {
        const off = subscribe(dest, (frame) => {
          const msg = safeJSON(frame.body) ?? frame.body;

          // convId 매칭 가드(혹시 다른 방 것 섞여 들어오면 버림)
          const incomingConvId = String(msg?.convId ?? msg?.conversationId ?? '');
          if (!incomingConvId || incomingConvId !== String(convIdRef.current)) return;

          // 중복 방지 키
          const key = msg?.msgId ?? `${msg?.seq ?? ''}:${msg?.senderId ?? ''}`;
          if (remember(key)) return;

          try { console.debug('[WS topic]', dest, msg); } catch {}

          handlerRef.current?.(msg);
        });

        if (typeof off === 'function') unsubs.push(off);
      } catch (err) {
        console.warn('[WS subscribe failed]', dest, err);
      }
    });

    // cleanup: 재연결/방 전환/언마운트 시 모두 해제
    return () => {
      unsubs.forEach((u) => { try { u(); } catch {} });
      unsubs = [];
    };
  }, [connected, convId, subscribe]);
}
