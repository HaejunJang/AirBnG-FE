import { useEffect, useRef } from 'react';
import useStomp from './useStomp';

export default function useConversationTopic(convId, onMessage) {
  const { connected, subscribe } = useStomp();
  const handlerRef = useRef(onMessage);
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    if (!connected || !convId) return;
    const dest = `/topic/conversations.${convId}`;
    const off = subscribe(dest, (frame) => {
      try {
        const msg = JSON.parse(frame.body);
        try { console.debug('[WS recv topic]', dest, msg); } catch {}
        // onMessage?.(msg);
        handlerRef.current?.(msg);
      } catch (e) {
        console.warn('[WS] parse fail', e, frame.body);
      }
    });
    return off; // 방 떠나면 해제
  }, [connected, convId, subscribe]);
}