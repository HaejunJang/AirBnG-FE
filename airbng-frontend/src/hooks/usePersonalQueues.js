import { useEffect, useRef } from 'react';
import useStomp from './useStomp';

function safeJSON(body) {
  try { return JSON.parse(body); } catch { return body; }
}

export default function usePersonalQueues({
  onAck,           // (ack) => void         // { msgId, seq, sentAt }
  onError,         // (err) => void         // string or object
  onInboxHint,    // (hint) => void        // { convId, preview, sentAt, fromMe, unreadInc }
} = {}) {
  const { connected, subscribe } = useStomp();

  // acks/errors용 단일 구독 언섭 모음
  const baseUnsubsRef = useRef([]);

  // convId별 read/typing 구독 관리 맵
  // map: convId -> { unsub: fn, handler: fn }
  const readSubsRef = useRef(new Map());
  const typingSubsRef = useRef(new Map());

  /* ===== 1) /user 공통 큐(acks, errors) ===== */
  useEffect(() => {
    if (!connected) return;
    // 기존 구독 정리
    baseUnsubsRef.current.forEach(u => u?.());
    baseUnsubsRef.current = [];

    if (onAck) {
      baseUnsubsRef.current.push(
        subscribe('/user/queue/acks', frame => {
          onAck(safeJSON(frame.body));
        })
      );
    }
    if (onError) {
      baseUnsubsRef.current.push(
        subscribe('/user/queue/errors', frame => {
          onError(safeJSON(frame.body));
        })
      );
    }

    // inbox 힌트 구독: 리스트 실시간 갱신
    baseUnsubsRef.current.push(
      subscribe('/user/queue/inbox', frame => {
        const hint = safeJSON(frame.body);
        onInboxHint?.(hint);
        // ChatList가 듣는 브라우저 커스텀 이벤트로 브릿지
        try {
          window.dispatchEvent(new CustomEvent('inbox:hint', {
            detail: {
              convId: hint?.convId,
              preview: hint?.preview,
              sentAt: hint?.sentAt,
              unreadTotal: hint?.unreadTotal, // 서버가 절대값을 줄 수도, null일 수도
            }
          }));
          // 읽음 전용 힌트(미리보기 없이 unread=0만 내려오면) → 보조 이벤트
          if (!hint?.preview && hint?.unreadTotal === 0) {
            window.dispatchEvent(new CustomEvent('inbox:read', {
              detail: { convId: hint?.convId }
            }));
          }
        } catch {}
      })
    );

    // cleanup
    return () => {
      baseUnsubsRef.current.forEach(u => u?.());
      baseUnsubsRef.current = [];
    };
  }, [connected, subscribe, onAck, onError, onInboxHint]);

  /* ===== 2) 방별 개인 큐 동적 구독: READ ===== */
  function subscribeRead(convId, handler) {
    // 이미 있으면 교체(재구독)
    unsubscribeRead(convId);
    // /user/queue/read.{convId}
    const unsub = subscribe(`/user/queue/read.${convId}`, frame => {
      const payload = safeJSON(frame.body);
      handler?.(payload);
    });
    readSubsRef.current.set(convId, { unsub, handler });
  }

  function unsubscribeRead(convId) {
    const item = readSubsRef.current.get(convId);
    if (item?.unsub) {
      try { item.unsub(); } catch {}
    }
    readSubsRef.current.delete(convId);
  }

  /* ===== 3) 방별 개인 큐 동적 구독: TYPING ===== */
  function subscribeTyping(convId, handler) {
    // 이미 있으면 교체(재구독)
    unsubscribeTyping(convId);
    // /user/queue/typing.{convId}
    const unsub = subscribe(`/user/queue/typing.${convId}`, frame => {
      const payload = safeJSON(frame.body); // { userId, typing: boolean, at: ISO }
      handler?.(payload);
    });
    typingSubsRef.current.set(convId, { unsub, handler });
  }

  function unsubscribeTyping(convId) {
    const item = typingSubsRef.current.get(convId);
    if (item?.unsub) {
      try { item.unsub(); } catch {}
    }
    typingSubsRef.current.delete(convId);
  }

  /* ===== 4) 재연결 시 기존 방 구독 자동 복구 ===== */
  useEffect(() => {
    if (!connected) return;
    // READ
    for (const [convId, { handler }] of readSubsRef.current.entries()) {
      // 재구독 전에 이전 unsub 호출
      try { readSubsRef.current.get(convId)?.unsub?.(); } catch {}
      const unsub = subscribe(`/user/queue/read.${convId}`, frame => {
        const payload = safeJSON(frame.body);
        handler?.(payload);
      });
      readSubsRef.current.set(convId, { unsub, handler });
    }
    // TYPING
    for (const [convId, { handler }] of typingSubsRef.current.entries()) {
      try { typingSubsRef.current.get(convId)?.unsub?.(); } catch {}
      const unsub = subscribe(`/user/queue/typing.${convId}`, frame => {
        const payload = safeJSON(frame.body);
        handler?.(payload);
      });
      typingSubsRef.current.set(convId, { unsub, handler });
    }
    // cleanup는 필요 없음(연결 끊길 때 STOMP가 자체 정리)
  }, [connected, subscribe]);

  /* ===== 5) 전역 cleanup(컴포넌트 unmount) ===== */
  useEffect(() => {
    return () => {
      baseUnsubsRef.current.forEach(u => u?.());
      baseUnsubsRef.current = [];
      // 모든 방 구독 해제
      for (const [convId, v] of readSubsRef.current.entries()) {
        try { v?.unsub?.(); } catch {}
        readSubsRef.current.delete(convId);
      }
      for (const [convId, v] of typingSubsRef.current.entries()) {
        try { v?.unsub?.(); } catch {}
        typingSubsRef.current.delete(convId);
      }
    };
  }, []);

  return {
    // 개인 큐(공통) 콜백은 props로 전달받음
    // 방별 동적 관리 API:
    subscribeRead,
    unsubscribeRead,
    subscribeTyping,
    unsubscribeTyping,
  };
}
