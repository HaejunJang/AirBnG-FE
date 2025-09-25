import { useEffect, useRef } from 'react';
import useStomp from './useStomp';

function safeJSON(body) {
  try { return JSON.parse(body); } catch { return body; }
}

/**
 * /user 큐(acks, errors, inbox) + 방별 개인큐(read, typing) 구독 관리 훅
 */
export default function usePersonalQueues({
  onAck,        // (ack) => void         // { msgId, seq, sentAt | sentAtMs }
  onError,      // (err) => void
  onInboxHint,  // (hint) => void        // { convId, preview, sentAtMs, unreadTotal, ... }
  onInboxRead,
} = {}) {
  const { connected, subscribe } = useStomp();

  // acks/errors/inbox 단일 구독 언섭 모음
  const baseUnsubsRef = useRef([]);

  // convId별 read/typing 구독 관리 맵
  const readSubsRef   = useRef(new Map());   // convId -> { unsub, handler }
  const typingSubsRef = useRef(new Map());   // convId -> { unsub, handler }

  /* ===== 1) /user 공통 큐(acks, errors, inbox) ===== */
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

    // inbox 힌트 → 리스트 실시간 갱신
    baseUnsubsRef.current.push(
      subscribe('/user/queue/inbox', frame => {
        const raw = safeJSON(frame.body) || {};
        onInboxHint?.(raw);

        // 1) sentAt / sentAtMs 정규화 → 숫자(ms)
        const rawAt = raw.sentAtMs ?? raw.sentAt ?? null;
        const atMs = (typeof rawAt === 'string')
          ? (isNaN(Number(rawAt)) ? Date.parse(rawAt) : Number(rawAt))
          : rawAt;

        // 2) preview 트림 + 연속 공백 축소 + 60자 컷
        const pv0 = (typeof raw.preview === 'string') ? raw.preview.trim().replace(/\s+/g, ' ') : '';
        const preview = pv0.length > 60 ? pv0.slice(0, 60) + '…' : pv0;

        // 3) 브라우저 커스텀 이벤트로 브릿지 (ChatList가 수신)
        try {
          window.dispatchEvent(new CustomEvent('inbox:hint', {
            detail: {
              convId: raw.convId,
              preview,
              sentAt: atMs ?? null,
              unreadTotal: raw.unreadTotal,
              peerName: raw.peerName,
              peerNickname: raw.peerNickname,
              peerProfileUrl: raw.peerProfileUrl,
              senderId: raw.senderId,
            }
          }));

          // 읽음 전용 힌트(미리보기 없이 unread=0만 내려오면) → 보조 이벤트
          if (!preview && raw.unreadTotal === 0) {
            window.dispatchEvent(new CustomEvent('inbox:read', {
              detail: { convId: raw.convId, unreadTotal: 0 }
            }));
            onInboxRead?.({ convId: raw.convId, unreadTotal: 0 });
          }
        } catch {}
      })
    );

    return () => {
      baseUnsubsRef.current.forEach(u => u?.());
      baseUnsubsRef.current = [];
    };
  }, [connected, subscribe, onAck, onError, onInboxHint, onInboxRead]);

  /* ===== 2) 방별 개인 큐 동적 구독: READ ===== */
  function subscribeRead(convId, handler) {
    unsubscribeRead(convId);
    console.log('[SUB read]', `/user/queue/read.${convId}`);
    const unsub = subscribe(`/user/queue/read.${convId}`, frame => {
      const raw = safeJSON(frame.body); // number | object
      console.log('[READ FRAME]', `/user/queue/read.${convId}`, raw);
      const payload = (typeof raw === 'number') ? { lastReadSeq: raw } : raw;
      handler?.(payload);
    });
    readSubsRef.current.set(convId, { unsub, handler });
  }
  function unsubscribeRead(convId) {
    const item = readSubsRef.current.get(convId);
    if (item?.unsub) { try { item.unsub(); } catch {} }
    readSubsRef.current.delete(convId);
  }

  /* ===== 3) 방별 개인 큐 동적 구독: TYPING ===== */
  function subscribeTyping(convId, handler) {
    unsubscribeTyping(convId);
    console.log('[SUB typing]', `/user/queue/typing.${convId}`);
    const unsub = subscribe(`/user/queue/typing.${convId}`, frame => {
      const payload = safeJSON(frame.body);          // { userId, typing: boolean, at }
      console.log('[TYPING FRAME]', `/user/queue/typing.${convId}`, payload);
      handler?.(payload);
    });
    typingSubsRef.current.set(convId, { unsub, handler });
  }
  function unsubscribeTyping(convId) {
    const item = typingSubsRef.current.get(convId);
    if (item?.unsub) { try { item.unsub(); } catch {} }
    typingSubsRef.current.delete(convId);
  }

  /* ===== 4) 재연결 시 기존 방 구독 자동 복구 ===== */
  useEffect(() => {
    if (!connected) return;

    // READ
    for (const [convId, { handler }] of readSubsRef.current.entries()) {
      try { readSubsRef.current.get(convId)?.unsub?.(); } catch {}
      const unsub = subscribe(`/user/queue/read.${convId}`, frame => {
        const raw = safeJSON(frame.body);
        const payload = (typeof raw === 'number') ? { lastReadSeq: raw } : raw;
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
  }, [connected, subscribe]);

  /* ===== 5) 언마운트 정리 ===== */
  useEffect(() => {
    return () => {
      baseUnsubsRef.current.forEach(u => u?.());
      baseUnsubsRef.current = [];
      for (const [, v] of readSubsRef.current.entries()) { try { v?.unsub?.(); } catch {} }
      for (const [, v] of typingSubsRef.current.entries()) { try { v?.unsub?.(); } catch {} }
      readSubsRef.current.clear();
      typingSubsRef.current.clear();
    };
  }, []);

  return {
    subscribeRead,
    unsubscribeRead,
    subscribeTyping,
    unsubscribeTyping,
  };
}
